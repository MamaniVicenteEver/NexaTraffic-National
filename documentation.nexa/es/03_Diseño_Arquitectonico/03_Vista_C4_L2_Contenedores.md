
# Vista C4 Nivel 2: Diagrama de Contenedores (PlantUML)

## 1. Descripción

El diagrama de contenedores muestra los principales ejecutables (microservicios, bases de datos, brokers) que componen NexaTraffic y cómo se comunican. Cada contenedor es un proceso independiente que puede desplegarse por separado.

## 2. Diagrama (PlantUML)

```plantuml
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

' Título
title Diagrama de Contenedores - NexaTraffic (Nivel 2)

' Personas externas (actores)
Person(sensor, "Sensores IoT", "200 ubicaciones: cámaras ANPR, estaciones climáticas")
Person(officer, "Oficial de Tránsito", "Consulta trayectorias y métricas")
Person(admin, "Administrador", "Configura límites y umbrales")

' Sistemas externos
System_Ext(vehicle_registry, "Registro Vehicular Nacional", "API gRPC")
System_Ext(email_server, "Servidor de Correo", "SMTP")
System_Ext(traffic_authority, "Autoridad de Tránsito", "Sistema interno receptor de alertas")

' Límite del sistema NexaTraffic
System_Boundary(nexatraffic, "NexaTraffic") {

    ' Contenedores de microservicios
    Container(ingestion, "Ingesta IoT", "Go", "Recibe datos de sensores, normaliza, publica en Kafka. Stateless.")
    Container(kafka, "Apache Kafka", "Broker de eventos", "Persiste eventos, retención 7 días. Backbone asíncrono.")
    
    Container(traffic_analytics, "Análisis de Tráfico", "Java + Spring Boot", "Calcula métricas agregadas (total, únicos, velocidades).")
    Container(trajectory, "Trayectorias", "Go", "Registra secuencia de avistamientos por placa, responde consultas.")
    Container(environmental, "Monitoreo Ambiental", "Python + FastAPI", "Almacena métricas climáticas y detecta condiciones extremas.")
    Container(law_enforcement, "Aplicación de la Ley", "Java + Spring Boot", "Detecta infracciones, genera tickets inmutables.")
    Container(identity, "Identidad y Registro", "Java + Spring Boot", "Fuente de verdad de propietarios (placa → email).")
    Container(notifications, "Notificaciones", "Node.js", "Envía correos de multa y notifica a Autoridad de Tránsito.")

    ' Contenedores de almacenamiento
    ContainerDb(postgres, "PostgreSQL", "Base de datos relacional", "Almacena infracciones, tickets, propietarios.")
    ContainerDb(clickhouse, "ClickHouse", "Base de datos de series temporales", "Métricas de tráfico y clima (alta ingesta).")
    ContainerDb(redis, "Redis", "Caché en memoria", "Caché de relaciones placa-email, deduplicación de placas (ventanas de hora).")
}

' Relaciones entre contenedores y externos

' Sensores → Ingesta
Rel(sensor, ingestion, "Envía datos crudos (MQTT/HTTP)", "JSON binario")

' Ingesta → Kafka
Rel(ingestion, kafka, "Publica eventos canónicos", "VehicleSighted, WeatherMetricsRecorded")

' Kafka → consumidores (asíncrono)
Rel(kafka, traffic_analytics, "Consume", "VehicleSighted")
Rel(kafka, trajectory, "Consume", "VehicleSighted")
Rel(kafka, environmental, "Consume", "WeatherMetricsRecorded")
Rel(kafka, law_enforcement, "Consume", "VehicleSighted")
Rel(kafka, notifications, "Consume", "InfractionTicketCreated, ExtremeWeatherAlertTriggered")

' Ley → Identidad (síncrono)
Rel(law_enforcement, identity, "Consulta propietario (gRPC)", "Timeout 500ms, circuit breaker")

' Ley y Ambiental publican eventos de vuelta a Kafka
Rel(law_enforcement, kafka, "Publica", "InfractionTicketCreated")
Rel(environmental, kafka, "Publica", "ExtremeWeatherAlertTriggered")

' Escrituras a bases de datos
Rel(traffic_analytics, clickhouse, "Escribe métricas", "Inserción batch")
Rel(trajectory, postgres, "Escribe trayectorias", "Upsert por placa")
Rel(environmental, clickhouse, "Escribe métricas climáticas", "Inserción por lote")
Rel(law_enforcement, postgres, "Escribe tickets", "Transacción ACID")
Rel(identity, postgres, "Lee/escribe propietarios", "CRUD")
Rel(notifications, redis, "Lee caché de propietario", "GET")
Rel(law_enforcement, redis, "Deduplicación de placas", "SETEX, SISMEMBER")

' Notificaciones hacia sistemas externos
Rel(notifications, email_server, "Envía correo de multa", "SMTP")
Rel(notifications, traffic_authority, "Envía alertas y reportes", "Eventos Kafka / API interna")

' Usuarios
Rel(officer, trajectory, "Consulta trayectoria (HTTPS)", "REST API")
Rel(officer, traffic_analytics, "Consulta dashboards (HTTPS)", "REST API")
Rel(admin, identity, "Configura límites y umbrales", "UI administrativa")

' Nota de estilo
LAYOUT_TOP_DOWN()
LAYOUT_AS_SKETCH()

@enduml
```

## 3. Explicación detallada de cada contenedor

| Contenedor | Tecnología | Responsabilidad | Escalabilidad | Estado |
|------------|------------|----------------|---------------|--------|
| **Ingesta IoT** | Go | Recibe datos crudos, normaliza formatos propietarios, publica en Kafka. | Horizontal (HPA por CPU/lag). | Stateless |
| **Apache Kafka** | Kafka + Zookeeper | Broker de eventos persistente. Retención 7 días para crudos, particionado por `locationId`. | Particionado + réplicas. | Stateful (persistente) |
| **Análisis de Tráfico** | Java/Spring | Calcula métricas agregadas (total de vehículos, únicos, velocidades). Usa Redis para deduplicación. | Horizontal. | Stateless (estado en Redis/ClickHouse) |
| **Trayectorias** | Go | Almacena secuencia de avistamientos por placa; responde consultas de ruta (historial). | Horizontal. | Stateless (estado en PostgreSQL) |
| **Monitoreo Ambiental** | Python/FastAPI | Almacena métricas climáticas y detecta condiciones extremas (umbrales). | Horizontal. | Stateless |
| **Aplicación de la Ley** | Java/Spring | Evalúa velocidad vs límite, genera ticket inmutable, consulta Identity. | Horizontal. | Stateless |
| **Identidad y Registro** | Java/Spring | Fuente de verdad de propietarios. Expone API gRPC y REST. | Horizontal (solo lectura replica). | Stateful (PostgreSQL) |
| **Notificaciones** | Node.js | Consume eventos de multa y alerta, envía correo y notifica internamente. | Horizontal. | Stateless |
| **PostgreSQL** | PostgreSQL 16 | Almacenamiento relacional: tickets, propietarios, trayectorias (como JSON). | Replicación primaria-secundaria. | Stateful |
| **ClickHouse** | ClickHouse | Métricas de tráfico y clima (series temporales). Particionado por mes. | Escalado horizontal (sharding). | Stateful |
| **Redis** | Redis 7 | Caché de relaciones placa-email (TTL 24h), deduplicación de placas (ventanas de hora). | Clúster de réplicas. | Stateful efímero |

## 4. Comunicaciones clave y patrones

- **Asíncrona (Kafka)**: Productores (Ingesta, Ley, Ambiental) y consumidores (todos los demás). Desacoplamiento total.
- **Síncrona (gRPC)**: Solo entre Ley e Identity. Con circuit breaker, timeout, caché.
- **Back-pressure**: Ingesta aplica HTTP 503 si Kafka no puede aceptar mensajes (ver estrategia de resiliencia).
- **Cacheo**: Notificaciones lee de Redis para evitar consultar Identity en cada multa.

## 5. Justificación de tecnologías

- **Go** en ingesta y trayectorias: alta concurrencia y bajo consumo de recursos para manejar 500 eventos/segundo.
- **Java/Spring** en análisis, ley e identidad: ecosistema maduro, JPA, resiliencia, transacciones.
- **Python** en ambiental: facilidad para integración con librerías de análisis climático (pandas, numpy).
- **Node.js** en notificaciones: eficiente para operaciones I/O (envío de correos).
- **ClickHouse** para métricas: rendimiento de inserción y consultas por tiempo, compresión alta.
- **PostgreSQL** para tickets y propietarios: ACID, integridad referencial, inmutabilidad legal.
- **Redis** para caché y deduplicación: operaciones atómicas, baja latencia.

## 6. Resumen de escalado y resiliencia

- Cada microservicio se despliega como Deployment en Kubernetes con HPA basado en CPU y lag de Kafka.
- Kafka se particiona por `locationId` (ingesta) y `licensePlate` (trayectorias).
- Bases de datos con réplicas de lectura y failover automático.
- Circuit breakers y retries en llamadas síncronas.
