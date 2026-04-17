# Propuesta Inicial del Proyecto NexaTraffic

## 1. Resumen Ejecutivo

El presente documento constituye la propuesta técnica inicial para el diseño e implementación del **Sistema de Monitoreo de Tráfico Nacional (SMT)**, denominado NexaTraffic. La solución se basa en una arquitectura cloud-native, orientada a eventos y desplegada sobre Kubernetes, con capacidad para procesar 4 millones de eventos diarios provenientes de 200 ubicaciones remotas.

Se identifican las principales brechas técnicas y de requisitos, y se proponen líneas de acción concretas para mitigarlas en las fases siguientes del proyecto.

## 2. Brechas Técnicas y de Requisitos Documentadas

A continuación se listan las brechas detectadas durante el análisis de los requisitos proporcionados. Cada brecha incluye una justificación, el impacto potencial y la estrategia de resolución.

### 2.1 Brecha: Configuración dinámica de límites de velocidad y umbrales climáticos

**Descripción**: Los requisitos especifican que se deben generar infracciones cuando un vehículo supera el "límite de velocidad" de una ubicación, pero no se define cómo se almacenan, actualizan o distribuyen estos límites. Tampoco se especifica la gestión de umbrales para "clima extremo".

**Impacto**: Sin una fuente centralizada y dinámica de configuración, cada instancia del *Violation Detector* necesitaría reiniciarse para cambiar un límite, o se produciría inconsistencia entre réplicas.

**Estrategia de resolución**:
- Crear un **Contexto de Configuración** (nuevo bounded context) que exponga una API CRUD y publique eventos `SpeedLimitUpdated` y `WeatherThresholdUpdated` en Kafka.
- Todos los servicios consumidores (*Violation Detector*, *Extreme Weather Detector*) escuchan estos eventos y mantienen una caché local actualizada.
- El límite por ubicación se versiona y audita.

### 2.2 Brecha: Idempotencia en consumidores de eventos

**Descripción**: Kafka garantiza entrega *at-least-once*. Si un consumidor falla después de procesar un evento pero antes de confirmar el offset, el mismo evento se reenviará. Sin mecanismos de idempotencia, se pueden generar múltiples infracciones para el mismo avistamiento.

**Impacto**: Multas duplicadas, inconsistencia legal y quejas de ciudadanos.

**Estrategia de resolución**:
- Cada consumidor (ej. *Violation Detector*) mantiene una tabla (en Redis o PostgreSQL) de `processed_event_ids` con el ID único del evento y un TTL.
- Antes de procesar, verifica si el ID ya existe; si es así, salta el evento y confirma el offset.
- Los IDs de evento se generan en el *Protocol Adapter* como UUIDv7 (ordenable por tiempo).

### 2.3 Brecha: Políticas de retención y particionamiento de datos no definidas

**Descripción**: Se menciona "retener datos por 5 años" en el README, pero no hay especificación de qué datos se retienen por cuánto tiempo (crudos, agregados, trayectorias, infracciones). Tampoco se define una estrategia de particionamiento para manejar el crecimiento.

**Impacto**: Crecimiento ilimitado del almacenamiento, degradación del rendimiento de consultas y costos elevados.

**Estrategia de resolución**:
- **Eventos crudos (Kafka)**: Retención configurable por tiempo (ej. 7 días) mediante `log.retention.hours`.
- **Métricas agregadas (ClickHouse)**: Tablas particionadas por mes, con TTL (Time-To-Live) de 5 años para métricas horarias. Las métricas por minuto se retienen 30 días.
- **Trayectorias (PostgreSQL/Graph)**: Se mantienen por 2 años, luego se archive a almacenamiento frío (S3 Glacier).
- **Infracciones**: Indefinido por requerimientos legales, pero se implementa particionamiento por año y se planifica archivo después de 7 años.

### 2.4 Brecha: Ausencia de mecanismo de back-pressure en la ingesta

**Descripción**: El *Receiver Service* recibe datos de 200 ubicaciones vía HTTP/MQTT. Si el clúster de Kafka se satura o el productor se ralentiza, no hay un mecanismo definido para que el receptor le indique a los sensores IoT que reduzcan la tasa de envío.

**Impacto**: Pérdida de datos (timeouts, buffers llenos) o colapso del servicio por memoria.

**Estrategia de resolución**:
- El *Receiver Service* implementa un **circuit breaker** y un **buffer limitado** (cola circular). Cuando el productor de Kafka responde con error o latencia alta, el servicio devuelve HTTP 503 (Service Unavailable) o MQTT no acepta publicaciones.
- Los sensores IoT deben implementar lógica de reintento con backoff exponencial (responsabilidad del fabricante, pero se especifica en el contrato de integración).

### 2.5 Brecha: Falta de especificación del formato de datos de los sensores

**Descripción**: Se menciona "formato propietario" y un "Protocol Adapter", pero no se define un esquema concreto (JSON Schema / Protobuf) para el modelo canónico interno.

**Impacto**: Ambigüedad en el desarrollo del adaptador y riesgo de interpretaciones incorrectas.

**Estrategia de resolución**:
- Definir un **esquema Protobuf** (evolución compatible) para los eventos canónicos:
  ```protobuf
  message VehicleSighting {
    string sighting_id = 1;
    string license_plate = 2;
    int64 timestamp_unix_ms = 3;
    uint32 location_id = 4;
    double speed_kph = 5;
    bytes evidence_image = 6; // JPEG comprimido
  }
  ```
- Para clima:
  ```protobuf
  message WeatherReading {
    string reading_id = 1;
    uint32 location_id = 2;
    int64 timestamp_unix_ms = 3;
    float temperature_celsius = 4;
    float humidity_percent = 5;
    enum Precipitation { NONE = 0; RAIN = 1; SNOW = 2; }
    Precipitation precipitation = 6;
  }
  ```
- El Protocol Adapter transforma los formatos de cada fabricante a estos protos.

### 2.6 Brecha: Consulta de propietario como punto sincrónico no resiliente

**Descripción**: El *Fine Manager* debe consultar el *Vehicle Registry* (vía gRPC) para obtener el correo del propietario. Si el registro falla, la multa no puede notificarse, y no se define un comportamiento alternativo.

**Impacto**: Bloqueo en la generación de notificaciones; posible retención de multas no enviadas.

**Estrategia de resolución**:
- Implementar **patrón Circuit Breaker** (Resilience4j en Java, go-resiliency en Go) con timeout de 500ms.
- Caché local de última milla: almacenar en Redis la relación (placa → email) con TTL de 24 horas. Si el registry falla, se usa la caché.
- Si no hay caché y el registry falla, la multa se persiste en estado `PENDING_NOTIFICATION` y un proceso batch reintenta cada hora.

## 3. Plan de Acción para Mitigar Brechas

| Brecha | Prioridad | Hito de mitigación | Responsable sugerido |
|--------|-----------|--------------------|----------------------|
| Configuración dinámica | Alta | Milestone 2 (diseño) + Milestone 5 (implementación de eventos) | Arquitecto |
| Idempotencia | Alta | Milestone 5 (consumidores de Kafka) | Desarrollador backend |
| Políticas de retención | Media | Milestone 2 (diseño) y Milestone 6 (operación) | Arquitecto de datos |
| Back-pressure | Alta | Milestone 3 (servicio base) | Desarrollador ingesta |
| Formato de datos | Media | Milestone 1 (definición) | Arquitecto de integración |
| Resiliencia en consulta a registry | Alta | Milestone 3 + Milestone 6 | Desarrollador backend |

## 4. Conclusiones de la Propuesta Inicial

La arquitectura propuesta para NexaTraffic es sólida y alineada con los principios cloud-native. Las brechas identificadas son manejables mediante las estrategias descritas, que serán implementadas progresivamente en los milestones correspondientes. Se recomienda priorizar la definición del **Contexto de Configuración** y la **idempotencia** antes de la primera prueba de carga real.

El presente documento será actualizado a medida que se resuelvan las brechas y se descubran nuevas durante la implementación.
