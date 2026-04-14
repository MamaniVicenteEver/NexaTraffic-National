# Estrategia de Escalabilidad Elástica

## 1. Objetivo

Garantizar que NexaTraffic pueda manejar picos de carga (hasta 500 eventos/segundo) y aumentos progresivos de ubicaciones (de 200 a 500 en el futuro) sin degradación del servicio, optimizando costos mediante escalado automático.

## 2. Dimensionamiento base

- **Carga normal**: 4M eventos/día → ~46 eventos/segundo promedio.
- **Picos de hora punta**: 500 eventos/segundo (10-12 veces la media).
- **Ubicaciones**: 200 iniciales, crecimiento planificado a 500.

## 3. Escalado horizontal por microservicio

### 3.1. Estrategia general

Todos los microservicios son **stateless** y se despliegan como Deployments en Kubernetes. Se utiliza **Horizontal Pod Autoscaler (HPA)** y **KEDA** para escalado basado en métricas.

### 3.2. Tabla de políticas de escalado

| Microservicio | Métrica de escalado | Umbral | Rango de réplicas | Estabilización (segundos) |
|---------------|---------------------|--------|-------------------|---------------------------|
| **Ingesta IoT** | CPU (target 70%) + Lag de Kafka producer (target < 1000) | 70% | 3 - 20 | 60 |
| **Análisis de Tráfico** | Lag de consumer group (vehicle-sightings) | > 5000 mensajes | 2 - 15 | 120 |
| **Trayectorias** | CPU (target 65%) | 65% | 2 - 10 | 60 |
| **Monitoreo Ambiental** | Lag de consumer group (weather-metrics) | > 2000 mensajes | 1 - 5 | 90 |
| **Aplicación de la Ley** | CPU + Lag (vehicle-sightings) | 70% o lag > 2000 | 2 - 12 | 60 |
| **Identidad y Registro** | CPU + RPS (gRPC) | 60% o RPS > 500 | 2 - 8 | 120 |
| **Notificaciones** | Longitud de cola de correo (cola interna) | > 1000 pendientes | 1 - 6 | 30 |

### 3.3. Ejemplo de configuración HPA (Kubernetes)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ingestion-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ingestion
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Pods
    pods:
      metric:
        name: kafka_producer_lag
      target:
        type: AverageValue
        averageValue: 1000
```

## 4. Escalado basado en eventos (KEDA) para consumidores de Kafka

KEDA permite escalar a cero cuando no hay mensajes, ahorrando recursos en horas valle (ej. 2am - 5am).

**Ejemplo para Violation Detector**:

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: violation-detector-scaler
spec:
  scaleTargetRef:
    name: violation-detector
  pollingInterval: 30
  cooldownPeriod: 300
  minReplicaCount: 2
  maxReplicaCount: 12
  triggers:
  - type: kafka
    metadata:
      topic: vehicle-sightings
      bootstrapServers: my-kafka-brokers:9092
      consumerGroup: violation-group
      lagThreshold: "1000"
```

## 5. Escalado de la infraestructura de datos

### 5.1. Kafka (Azure Event Hubs)

- **Throughput units**: Autoescalado basado en entrada de datos (configurar `auto-inflate` en Event Hubs).
- **Particiones**: Se definen 20 particiones para `vehicle-sightings` (una por cada 10 ubicaciones iniciales). El crecimiento a 500 ubicaciones requerirá aumentar particiones (repartición manual planificada).

### 5.2. PostgreSQL

- **Réplicas de lectura**: Para consultas de trayectoria y dashboards. Se añade una réplica cuando la CPU de la primaria supera el 60% durante 10 minutos.
- **Escalado vertical**: Azure Flexible Server permite cambiar vCores sin downtime. Se monitorea el tamaño de la base de datos.

### 5.3. ClickHouse

- **Sharding**: Se implementa sharding por `location_id` para distribuir la carga de escritura.
- **Replicación**: Factor 2 para tolerancia a fallos. El escalado se realiza añadiendo nuevos nodos al cluster (rebalanceo manual).

### 5.4. Redis

- **Clúster**: 3 nodos primarios + réplicas. El escalado se hace mediante el plan managed de Azure (aumentar capacidad de memoria).

## 6. Estrategia de escalado vertical (cuando no es posible horizontal)

| Componente | Límite horizontal | Plan de escalado vertical |
|------------|-------------------|---------------------------|
| PostgreSQL | Hasta 16 vCores en Flexible Server | Monitorear IOPS; si supera 5000, migrar a Hyperscale (Citus). |
| ClickHouse | Máquinas con 64GB RAM | Añadir nodos (sharding) en lugar de escalar verticalmente. |
| Kafka | Particiones limitadas | Rebalancear topics o añadir más unidades de throughput. |

## 7. Simulación de pico máximo (500 eventos/segundo)

| Recurso | Demanda estimada | Capacidad mínima | Holgura |
|---------|------------------|------------------|---------|
| Ingesta (Go) | 500 req/seg | 3 pods (cada uno ~200 req/seg) | 20% |
| Kafka (Event Hubs) | 500 msgs/seg, 1KB c/u | 1 TU (1 MB/s) suficiente | 50% |
| Violation Detector | 500 ev/seg procesados | 4 pods (cada uno 150 ev/seg) | 20% |
| PostgreSQL (escritura tickets) | 500 transacciones/seg (pico) | 4 vCores, 50GB IOPS | 30% |

**Conclusión**: Con 3 nodos AKS (4 vCPU c/u) y escalado automático, se puede manejar el pico sin degradación.

## 8. Escalado predictivo (basado en tiempo)

Se implementa un **cron-scaler** (usando KEDA con calendario) para anticipar picos conocidos:

- **Horas punta (7-9am, 5-7pm)**: Aumentar réplicas mínimas de Ingesta a 10, Violation Detector a 6.
- **Fines de semana**: Reducir réplicas mínimas a la mitad (menor tráfico).

```yaml
triggers:
- type: cron
  metadata:
    timezone: "America/La_Paz"
    start: "0 7 * * *"
    end: "0 9 * * *"
    desiredReplicas: "10"
```

## 9. Monitoreo de escalabilidad

| Métrica | Herramienta | Umbral de alerta |
|---------|-------------|------------------|
| Tiempo de escalado de pods | Prometheus + HPA metrics | Mayor a 5 minutos |
| Lag de Kafka máximo | Prometheus Kafka exporter | Mayor a 20.000 mensajes |
| Uso de CPU en nodos | Azure Monitor | Mayor a 80% |
| Número de réplicas máximas alcanzado | Kubernetes API | Alertar si se supera el 80% del máximo configurado. |

## 10. Costos del escalado elástico

- **Beneficio**: En horas valle (6 horas diarias), el número de réplicas se reduce un 50%, ahorrando ~30% de costos de cómputo.
- **Ejemplo**: Con 3 réplicas base (costo 420 USD/mes), el ahorro por escalado elástico es de ~126 USD/mes.

La estrategia de escalabilidad elástica asegura que NexaTraffic cumpla con los requisitos de rendimiento sin sobredimensionar recursos fijos, adaptándose dinámicamente a la demanda.
