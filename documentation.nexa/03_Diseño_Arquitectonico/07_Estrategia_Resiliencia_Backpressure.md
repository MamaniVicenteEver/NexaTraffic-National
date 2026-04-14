
# Estrategia de Resiliencia y Back-pressure

## 1. Objetivo

Garantizar que NexaTraffic pueda manejar picos de tráfico, fallos de componentes y saturación sin perder datos ni degradar el servicio crítico (ingesta y detección de infracciones).

## 2. Back-pressure en la ingesta

### 2.1. Escenario de saturación

El `Receiver Service` (Ingesta IoT) recibe hasta 500 eventos/segundo. Si el productor de Kafka o el propio Kafka se ralentiza (por ejemplo, por una partición caliente), el receptor no puede aceptar todos los mensajes.

### 2.2. Mecanismo implementado

- **Buffer limitado interno**: Una cola circular (Go channel) con capacidad para 10.000 mensajes.
- **Monitorización de uso**: Si el buffer alcanza el 80% de su capacidad, el servicio comienza a devolver **HTTP 429 (Too Many Requests)** o **503 (Service Unavailable)** a los sensores.
- **Respuesta con backoff sugerido**: En el cuerpo del error se incluye `"Retry-After: 5"` (segundos).

**Ejemplo de respuesta**:
```json
{
  "error": "Ingestion buffer full",
  "retry_after_seconds": 5,
  "details": "Kafka producer lag detected"
}
```

### 2.3. Requisito para los sensores IoT

Los sensores deben implementar **reintentos con backoff exponencial** (1s, 2s, 4s, hasta 30s) y almacenamiento local en caso de fallo prolongado. Este requisito forma parte del contrato de integración.

## 3. Manejo de picos de tráfico (autoescalado)

### 3.1. Kubernetes Horizontal Pod Autoscaler (HPA)

| Microservicio | Métrica de escalado | Umbral | Rango de réplicas |
|---------------|---------------------|--------|-------------------|
| Ingesta IoT | CPU > 70% o lag de Kafka producer > 1000 | 70% | 3 - 20 |
| Análisis de Tráfico | Lag de Kafka (consumer group) > 5000 mensajes | 5000 | 2 - 15 |
| Violation Detector | CPU > 65% | 65% | 2 - 10 |
| Notificaciones | Longitud de cola de correo (cola interna) > 1000 | 1000 | 1 - 5 |

### 3.2. Escalado basado en eventos (KEDA)

Para consumidores de Kafka, usamos **KEDA** (Kubernetes Event-Driven Autoscaler) que escala basado en el lag por partición:

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: violation-detector-scaler
spec:
  scaleTargetRef:
    name: violation-detector
  triggers:
    - type: kafka
      metadata:
        topic: vehicle-sightings
        lagThreshold: "1000"
        consumerGroup: violation-group
```

## 4. Resiliencia ante fallos de servicios externos

### 4.1. Circuit Breaker en la llamada a Identity & Registry

La comunicación síncrona entre `Law Enforcement` e `Identity` es el punto más frágil. Implementamos **Resilience4j** (Java) con:

- **Timeout**: 500 ms.
- **Circuit Breaker**:
  - Estado cerrado: llamadas normales.
  - Si falla el 50% de las llamadas en 10 segundos → pasa a **abierto** (rechaza llamadas inmediatamente durante 5 segundos).
  - Luego pasa a **semi-abierto** (permite una llamada de prueba).
- **Fallback**: Si el circuit breaker está abierto o timeout, se usa la caché de Redis (`owner:{plate}`) con TTL 24h.
- **Fallback de último recurso**: Si no hay caché, se crea el ticket en estado `PENDING_NOTIFICATION` y un proceso batch reintenta cada hora.

### 4.2. Dead Letter Queue (DLQ) para eventos fallidos

Cada consumidor de Kafka (ej. Violation Detector, Notificaciones) configura un **DLQ**:

- Si un evento falla después de 3 reintentos (con backoff de 1s, 2s, 4s), se publica en un topic `dlq-{consumer-group}`.
- Un proceso manual o automático (dashboard de operaciones) puede inspeccionar y reinyectar eventos.

### 4.3. Caída de Kafka

- **Health check** en cada servicio: el endpoint `/ready` verifica que el productor/consumidor de Kafka esté conectado.
- Si Kafka no responde, el pod se marca como `NotReady` y Kubernetes no envía tráfico (en el caso de servicios que también exponen API síncrona).
- **Reintentos en el productor**: Configuración `retries=5`, `retry.backoff.ms=100`.

## 5. Caída de bases de datos

| Base de datos | Estrategia | RTO estimado | RPO |
|---------------|------------|--------------|-----|
| PostgreSQL | Réplica primaria + secundaria (failover automático con Patroni o Cloud managed) | < 1 minuto | < 5 segundos (WAL shipping) |
| ClickHouse | Cluster con replicación (factor 2) | < 2 minutos | < 10 segundos |
| Redis | Redis Sentinel o Cluster (3 nodos) | < 30 segundos | Cero (datos efímeros, se recalculan) |

### 5.1. Degradación controlada

Si PostgreSQL cae:
- La ingesta y detección de infracciones **siguen funcionando** (solo se almacena el ticket en un buffer local o en Kafka con un topic específico).
- Cuando PostgreSQL se recupera, un proceso replay persiste los tickets pendientes.

## 6. Pruebas de resiliencia (Chaos Engineering)

Se definen experimentos en entorno de staging:

| Experimento | Herramienta | Frecuencia |
|-------------|-------------|-------------|
| Matar un pod de Kafka | Chaos Mesh | Semanal |
| Inyectar latencia de 2s en la llamada a Identity | Toxiproxy | Semanal |
| Saturación de CPU en Ingesta (stress) | `stress-ng` | Mensual |
| Caída de PostgreSQL (failover) | Cloud provider API | Mensual |

**Métricas de éxito**:
- No se pierden eventos (verificar offsets de Kafka).
- El tiempo de recuperación (RTO) < 2 minutos.
- Las alertas de monitoreo se disparan correctamente.

## 7. Monitorización y alertas para resiliencia

| Métrica | Umbral | Acción |
|---------|--------|--------|
| Lag de Kafka (consumer group) | > 10.000 mensajes por 5 min | Escalar consumidores (KEDA) |
| Tasa de errores HTTP 5xx en Ingesta | > 1% en 1 min | Revisar back-pressure, escalar productores |
| Circuit breaker de Identity abierto | Duración > 30 seg | Alertar a equipo on-call |
| Uso de DLQ | Cualquier mensaje en `dlq-*` | Revisión manual dentro de 24h |
| Tiempo de respuesta p99 de PostgreSQL | > 200 ms | Escalar réplica o revisar consultas |

## 8. Resumen de estrategias por componente

| Componente | Back-pressure | Circuit breaker | Retries | DLQ | Autoescalado |
|------------|---------------|----------------|---------|-----|--------------|
| Ingesta IoT | ✅ (HTTP 503) | ❌ (no aplica) | N/A (sensor) | ❌ | ✅ (HPA) |
| Violation Detector | ❌ (consumidor) | ❌ | ✅ (Kafka consumer) | ✅ | ✅ (KEDA) |
| Fine Manager | ❌ | ✅ (gRPC) | ✅ (gRPC) | N/A | ✅ (HPA) |
| Identity & Registry | ❌ | ❌ (es proveedor) | N/A | ❌ | ✅ (replicas) |
| Notificaciones | ❌ | ✅ (SMTP) | ✅ (correo) | ✅ | ✅ (KEDA) |
| Bases de datos | ❌ | N/A | N/A | N/A | ❌ (replicación) |

## 9. Conclusión

La combinación de back-pressure, circuit breakers, DLQ, autoescalado y chaos testing garantiza que NexaTraffic mantenga **99.99% de disponibilidad** incluso bajo picos de 500 eventos/segundo y fallos de componentes. Las estrategias están alineadas con los principios de resiliencia de sistemas cloud-native.
