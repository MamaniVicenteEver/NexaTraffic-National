# C4 View Level 2: Container Diagram (PlantUML)

## 1. Description

The container diagram shows the main executables (microservices, databases, brokers) that make up NexaTraffic and how they communicate. Each container is an independent process that can be deployed separately.

## 2. Diagram (PlantUML)

```plantuml
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

' Title
title Container Diagram - NexaTraffic (Level 2)

' External people (actors)
Person(sensor, "IoT Sensors", "200 locations: ANPR cameras, weather stations")
Person(officer, "Traffic Officer", "Queries trajectories and metrics")
Person(admin, "Administrator", "Configures limits and thresholds")

' External systems
System_Ext(vehicle_registry, "National Vehicle Registry", "gRPC API")
System_Ext(email_server, "Email Server", "SMTP")
System_Ext(traffic_authority, "Traffic Authority", "Internal alert receiving system")

' NexaTraffic system boundary
System_Boundary(nexatraffic, "NexaTraffic") {

    ' Microservice containers
    Container(ingestion, "IoT Ingestion", "Go", "Receives sensor data, normalizes, publishes to Kafka. Stateless.")
    Container(kafka, "Apache Kafka", "Event broker", "Persists events, 7-day retention. Asynchronous backbone.")
    
    Container(traffic_analytics, "Traffic Analytics", "Java + Spring Boot", "Calculates aggregated metrics (total, unique, speeds).")
    Container(trajectory, "Trajectories", "Go", "Records sequence of sightings per license plate, responds to queries.")
    Container(environmental, "Environmental Monitoring", "Python + FastAPI", "Stores weather metrics and detects extreme conditions.")
    Container(law_enforcement, "Law Enforcement", "Java + Spring Boot", "Detects infractions, generates immutable tickets.")
    Container(identity, "Identity and Registry", "Java + Spring Boot", "Source of truth for owners (license plate → email).")
    Container(notifications, "Notifications", "Node.js", "Sends fine emails and notifies Traffic Authority.")

    ' Storage containers
    ContainerDb(postgres, "PostgreSQL", "Relational database", "Stores infractions, tickets, owners.")
    ContainerDb(clickhouse, "ClickHouse", "Time-series database", "Traffic and weather metrics (high ingestion).")
    ContainerDb(redis, "Redis", "In-memory cache", "License plate-email relationship cache, license plate deduplication (hourly windows).")
}

' Relationships between containers and externals

' Sensors → Ingestion
Rel(sensor, ingestion, "Sends raw data (MQTT/HTTP)", "Binary JSON")

' Ingestion → Kafka
Rel(ingestion, kafka, "Publishes canonical events", "VehicleSighted, WeatherMetricsRecorded")

' Kafka → consumers (asynchronous)
Rel(kafka, traffic_analytics, "Consumes", "VehicleSighted")
Rel(kafka, trajectory, "Consumes", "VehicleSighted")
Rel(kafka, environmental, "Consumes", "WeatherMetricsRecorded")
Rel(kafka, law_enforcement, "Consumes", "VehicleSighted")
Rel(kafka, notifications, "Consumes", "InfractionTicketCreated, ExtremeWeatherAlertTriggered")

' Law → Identity (synchronous)
Rel(law_enforcement, identity, "Queries owner (gRPC)", "Timeout 500ms, circuit breaker")

' Law and Environmental publish events back to Kafka
Rel(law_enforcement, kafka, "Publishes", "InfractionTicketCreated")
Rel(environmental, kafka, "Publishes", "ExtremeWeatherAlertTriggered")

' Writes to databases
Rel(traffic_analytics, clickhouse, "Writes metrics", "Batch insertion")
Rel(trajectory, postgres, "Writes trajectories", "Upsert per license plate")
Rel(environmental, clickhouse, "Writes weather metrics", "Batch insertion")
Rel(law_enforcement, postgres, "Writes tickets", "ACID transaction")
Rel(identity, postgres, "Reads/writes owners", "CRUD")
Rel(notifications, redis, "Reads owner cache", "GET")
Rel(law_enforcement, redis, "License plate deduplication", "SETEX, SISMEMBER")

' Notifications to external systems
Rel(notifications, email_server, "Sends fine email", "SMTP")
Rel(notifications, traffic_authority, "Sends alerts and reports", "Kafka Events / Internal API")

' Users
Rel(officer, trajectory, "Queries trajectory (HTTPS)", "REST API")
Rel(officer, traffic_analytics, "Queries dashboards (HTTPS)", "REST API")
Rel(admin, identity, "Configures limits and thresholds", "Administrative UI")

' Style note
LAYOUT_TOP_DOWN()
LAYOUT_AS_SKETCH()

@enduml
```

## 3. Detailed explanation of each container

| Container | Technology | Responsibility | Scalability | State |
|------------|------------|----------------|---------------|--------|
| **IoT Ingestion** | Go | Receives raw data, normalizes proprietary formats, publishes to Kafka. | Horizontal (HPA by CPU/lag). | Stateless |
| **Apache Kafka** | Kafka + Zookeeper | Persistent event broker. 7-day retention for raw data, partitioned by `locationId`. | Partitioned + replicas. | Stateful (persistent) |
| **Traffic Analytics** | Java/Spring | Calculates aggregated metrics (total vehicles, unique, speeds). Uses Redis for deduplication. | Horizontal. | Stateless (state in Redis/ClickHouse) |
| **Trajectories** | Go | Stores sequence of sightings per license plate; responds to route queries (history). | Horizontal. | Stateless (state in PostgreSQL) |
| **Environmental Monitoring** | Python/FastAPI | Stores weather metrics and detects extreme conditions (thresholds). | Horizontal. | Stateless |
| **Law Enforcement** | Java/Spring | Evaluates speed vs limit, generates immutable ticket, queries Identity. | Horizontal. | Stateless |
| **Identity and Registry** | Java/Spring | Source of truth for owners. Exposes gRPC and REST API. | Horizontal (read-only replica). | Stateful (PostgreSQL) |
| **Notifications** | Node.js | Consumes fine and alert events, sends email and notifies internally. | Horizontal. | Stateless |
| **PostgreSQL** | PostgreSQL 16 | Relational storage: tickets, owners, trajectories (as JSON). | Primary-secondary replication. | Stateful |
| **ClickHouse** | ClickHouse | Traffic and weather metrics (time series). Partitioned by month. | Horizontal scaling (sharding). | Stateful |
| **Redis** | Redis 7 | License plate-email relationship cache (TTL 24h), license plate deduplication (hourly windows). | Replica cluster. | Ephemeral stateful |

## 4. Key communications and patterns

- **Asynchronous (Kafka)**: Producers (Ingestion, Law, Environmental) and consumers (all others). Full decoupling.
- **Synchronous (gRPC)**: Only between Law and Identity. With circuit breaker, timeout, cache.
- **Back-pressure**: Ingestion applies HTTP 503 if Kafka cannot accept messages (see resilience strategy).
- **Caching**: Notifications reads from Redis to avoid querying Identity for each fine.

## 5. Technology justification

- **Go** in ingestion and trajectories: high concurrency and low resource consumption to handle 500 events/second.
- **Java/Spring** in analytics, law and identity: mature ecosystem, JPA, resilience, transactions.
- **Python** in environmental: ease of integration with climate analysis libraries (pandas, numpy).
- **Node.js** in notifications: efficient for I/O operations (email sending).
- **ClickHouse** for metrics: insertion and time-based query performance, high compression.
- **PostgreSQL** for tickets and owners: ACID, referential integrity, legal immutability.
- **Redis** for cache and deduplication: atomic operations, low latency.

## 6. Scaling and resilience summary

- Each microservice is deployed as a Deployment in Kubernetes with HPA based on CPU and Kafka lag.
- Kafka is partitioned by `locationId` (ingestion) and `licensePlate` (trajectories).
- Databases with read replicas and automatic failover.
- Circuit breakers and retries in synchronous calls.
