# Validación POC: Ingesta Masiva de 4M Eventos/Día

## 1. Objetivo

Demostrar que la arquitectura propuesta puede manejar el pico de 500 eventos/segundo (4M diarios) sin pérdida de datos y con latencia aceptable (<200ms para detección de infracciones).

## 2. Entorno de prueba

- **Infraestructura**: AKS con 3 nodos D4s v3 (4 vCPU, 16GB RAM) – igual a producción.
- **Simulador de sensores**: Script en Go que genera 500 eventos/segundo (VehicleSighted) distribuidos en 200 ubicaciones.
- **Componentes bajo prueba**: Ingesta IoT, Kafka (Event Hubs 1 TU), Violation Detector, PostgreSQL.
- **Duración**: 1 hora continua (1.8M eventos).

## 3. Métricas a medir

| Métrica | Herramienta | Umbral de éxito |
|---------|-------------|-----------------|
| Throughput de ingesta (eventos/segundo) | Prometheus + conteo de mensajes Kafka | > 500 |
| Tasa de error HTTP en ingesta | Logs de Ingesta | < 0.1% |
| Lag máximo de Kafka | Kafka exporter | < 5000 mensajes |
| Latencia p99 (ingesta → infracción) | Timestamps en eventos | < 250 ms |
| Uso de CPU en nodos | Azure Monitor | < 80% |
| Pérdida de eventos | Comparar offsets iniciales y finales | 0% |

## 4. Procedimiento

1. Desplegar el sistema en un namespace `poc-load`.
2. Iniciar el simulador con 200 hilos (uno por ubicación).
3. Ejecutar durante 1 hora, registrando métricas cada 10 segundos.
4. Al finalizar, verificar que todos los eventos fueron consumidos y que no hay mensajes en DLQ.
5. Medir la latencia de los primeros 1000 tickets generados.

## 5. Resultados esperados (simulados)

| Métrica | Valor esperado | ¿Cumple? |
|---------|----------------|----------|
| Throughput máximo | 520 ev/seg | ✅ |
| Tasa de error HTTP | 0.05% (por back-pressure puntual) | ✅ |
| Lag máximo | 3.200 mensajes | ✅ |
| Latencia p99 | 210 ms | ✅ |
| CPU máxima | 75% | ✅ |
| Pérdida | 0 | ✅ |

## 6. Acciones correctivas si no se cumple

- **Alta tasa de error**: Aumentar réplicas de Ingesta, revisar buffer.
- **Lag > 10.000**: Escalar Violation Detector, aumentar particiones de Kafka.
- **Latencia > 500ms**: Revisar consulta a Identity, implementar caché.

## 7. Evidencia requerida

- Capturas de pantalla de Grafana mostrando métricas.
- Logs de offsets de Kafka.
- Registro de tickets generados vs eventos recibidos.

La POC se ejecutará en la semana 10 (después de implementar M5) y sus resultados se adjuntarán al informe final.
