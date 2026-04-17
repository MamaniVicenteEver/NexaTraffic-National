# Contextos Delimitados (Bounded Contexts)

## 1. Propósito

Este documento define los límites explícitos de cada modelo de dominio dentro del Sistema de Monitoreo de Tráfico (SMT). Cada contexto tiene su propio lenguaje ubícuo, su modelo de datos y su responsabilidad única, permitiendo la evolución independiente y el desacoplamiento.

## 2. Lista de Contextos Delimitados

### 2.1. Ingesta IoT (IoT Gateway)

| Propiedad | Descripción |
|-----------|-------------|
| **Responsabilidad** | Recibir datos crudos desde las 200 ubicaciones remotas (cámaras ANPR, sensores de velocidad, estaciones climáticas), normalizarlos y publicarlos en el bus de eventos sin pérdida. |
| **Eventos clave** | `VehicleSighted`, `WeatherMetricsRecorded`, `PlateNotRecognized` |
| **Límite** | No procesa ni almacena lógica de negocio. Solo transforma formatos propietarios a canónico. |
| **Anti-Corruption Layer** | Sí, para aislar modelos externos de fabricantes de hardware. |

### 2.2. Análisis de Tráfico (Traffic Analyzer)

| Propiedad | Descripción |
|-----------|-------------|
| **Responsabilidad** | Calcular métricas agregadas de tráfico por ubicación y ventana de tiempo: total de vehículos, vehículos únicos, velocidades promedio/máxima/mínima. |
| **Eventos clave** | `TrafficMetricsAggregated` |
| **Límite** | No conoce la identidad del propietario ni las infracciones. Solo trabaja con datos anónimos. |
| **Almacenamiento** | Time-Series Database (ClickHouse / TimescaleDB). |

### 2.3. Seguimiento y Trayectorias (Trajectory Tracker)

| Propiedad | Descripción |
|-----------|-------------|
| **Responsabilidad** | Registrar la secuencia de avistamientos por placa y reconstruir rutas históricas de vehículos. |
| **Eventos clave** | `VehicleSighted` (consumido), consultas de lectura. |
| **Límite** | No calcula métricas ni detecta infracciones. Solo almacena la línea de tiempo de movimientos. |
| **Almacenamiento** | Base de datos de grafos o columna ancha (ej. Cassandra, Neo4j opcional). |

### 2.4. Monitoreo Ambiental (Environmental Monitor)

| Propiedad | Descripción |
|-----------|-------------|
| **Responsabilidad** | Almacenar métricas climáticas (temperatura, humedad, precipitación) y detectar condiciones extremas que superen umbrales. |
| **Eventos clave** | `WeatherMetricsRecorded`, `ExtremeWeatherAlertTriggered` |
| **Límite** | No se mezcla con tráfico vehicular. Las alertas climáticas son independientes de las infracciones. |
| **Almacenamiento** | Time-Series Database (puede compartir la misma TSDB que tráfico). |

### 2.5. Aplicación de la Ley (Law Enforcement)

| Propiedad | Descripción |
|-----------|-------------|
| **Responsabilidad** | Evaluar si un avistamiento excede el límite de velocidad de la ubicación, generar una infracción inmutable y gestionar su ciclo de vida (notificada, pagada, impugnada). |
| **Eventos clave** | `SpeedLimitViolated`, `InfractionTicketCreated`, `FineStatusUpdated` |
| **Límite** | No envía correos ni notificaciones públicas. Delega la comunicación al contexto de Notificaciones. |
| **Almacenamiento** | Base de datos relacional (PostgreSQL) con auditoría e inmutabilidad. |

### 2.6. Identidad y Registro (Identity & Registry)

| Propiedad | Descripción |
|-----------|-------------|
| **Responsabilidad** | Mantener la relación entre placas y propietarios (datos de contacto, identidad). Fuente de verdad para consultas de dueños. |
| **Eventos clave** | (No publica eventos propios; es consultado vía sincrónica gRPC/HTTP) |
| **Límite** | No conoce infracciones ni métricas. Solo responde a consultas de "propietario de placa X". |
| **Almacenamiento** | Base de datos relacional (PostgreSQL) con datos personales (PII) cifrados. |

### 2.7. Notificaciones (Notifications)

| Propiedad | Descripción |
|-----------|-------------|
| **Responsabilidad** | Enviar correos electrónicos a propietarios por multas, y publicar alertas climáticas extremas en redes sociales / portal público. |
| **Eventos clave** | `InfractionTicketCreated` (consumido), `ExtremeWeatherAlertTriggered` (consumido) |
| **Límite** | No genera multas ni detecta clima extremo. Solo actúa como consumidor y orquestador de canales externos. |
| **Almacenamiento** | Registro de envíos (auditoría) en base de datos ligera o logs. |

## 3. Resumen de Contextos

| Contexto | Rol Principal | Tipo de Comunicación | Almacenamiento |
|----------|---------------|----------------------|----------------|
| Ingesta IoT | Gateway de entrada | Eventos (Kafka) | Ninguno (solo buffer) |
| Análisis de Tráfico | Métricas | Eventos (Kafka) | TSDB |
| Trayectorias | Historial de rutas | Eventos + consultas | Graph/NoSQL |
| Ambiental | Datos climáticos | Eventos (Kafka) | TSDB |
| Aplicación de la Ley | Infracciones y multas | Eventos + consulta síncrona | PostgreSQL |
| Identidad y Registro | Propietarios | Síncrono (gRPC) | PostgreSQL |
| Notificaciones | Comunicación externa | Eventos (Kafka) | Log / auditoría |

## 4. Nota sobre independencia

Cada contexto puede ser desarrollado, desplegado y escalado de forma independiente. Los eventos en Kafka son el único acoplamiento débil entre contextos productores y consumidores. La comunicación síncrona solo ocurre entre `Law Enforcement` e `Identity & Registry` (consulta de propietario), y se maneja con circuit breakers y caché para evitar fallos en cascada.