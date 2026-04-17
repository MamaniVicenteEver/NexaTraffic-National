# Bounded Contexts

## 1. Purpose

This document defines the explicit boundaries of each domain model within the Traffic Monitoring System (TMS). Each context has its own ubiquitous language, data model, and unique responsibility, enabling independent evolution and decoupling.

## 2. List of Bounded Contexts

### 2.1. IoT Ingestion (IoT Gateway)

| Property | Description |
|-----------|-------------|
| **Responsibility** | Receive raw data from the 200 remote locations (ANPR cameras, speed sensors, weather stations), normalize it, and publish it to the event bus without loss. |
| **Key Events** | `VehicleSighted`, `WeatherMetricsRecorded`, `PlateNotRecognized` |
| **Boundary** | Does not process or store business logic. Only transforms proprietary formats to canonical. |
| **Anti-Corruption Layer** | Yes, to isolate external models from hardware manufacturers. |

### 2.2. Traffic Analysis (Traffic Analyzer)

| Property | Description |
|-----------|-------------|
| **Responsibility** | Calculate aggregated traffic metrics by location and time window: total vehicles, unique vehicles, average/maximum/minimum speeds. |
| **Key Events** | `TrafficMetricsAggregated` |
| **Boundary** | Does not know vehicle owner identity or infractions. Only works with anonymous data. |
| **Storage** | Time-Series Database (ClickHouse / TimescaleDB). |

### 2.3. Tracking and Trajectories (Trajectory Tracker)

| Property | Description |
|-----------|-------------|
| **Responsibility** | Record the sequence of sightings per license plate and reconstruct historical vehicle routes. |
| **Key Events** | `VehicleSighted` (consumed), read queries. |
| **Boundary** | Does not calculate metrics or detect infractions. Only stores the timeline of movements. |
| **Storage** | Graph database or wide-column database (e.g., Cassandra, Neo4j optional). |

### 2.4. Environmental Monitoring (Environmental Monitor)

| Property | Description |
|-----------|-------------|
| **Responsibility** | Store weather metrics (temperature, humidity, precipitation) and detect extreme conditions that exceed thresholds. |
| **Key Events** | `WeatherMetricsRecorded`, `ExtremeWeatherAlertTriggered` |
| **Boundary** | Does not mix with vehicular traffic. Weather alerts are independent of infractions. |
| **Storage** | Time-Series Database (can share the same TSDB as traffic). |

### 2.5. Law Enforcement

| Property | Description |
|-----------|-------------|
| **Responsibility** | Evaluate if a sighting exceeds the location's speed limit, generate an immutable infraction, and manage its lifecycle (notified, paid, contested). |
| **Key Events** | `SpeedLimitViolated`, `InfractionTicketCreated`, `FineStatusUpdated` |
| **Boundary** | Does not send emails or public notifications. Delegates communication to the Notifications context. |
| **Storage** | Relational database (PostgreSQL) with auditing and immutability. |

### 2.6. Identity & Registry

| Property | Description |
|-----------|-------------|
| **Responsibility** | Maintain the relationship between license plates and owners (contact data, identity). Source of truth for owner queries. |
| **Key Events** | (Does not publish its own events; is queried via synchronous gRPC/HTTP) |
| **Boundary** | Does not know about infractions or metrics. Only responds to "owner of plate X" queries. |
| **Storage** | Relational database (PostgreSQL) with encrypted personal data (PII). |

### 2.7. Notifications

| Property | Description |
|-----------|-------------|
| **Responsibility** | Send emails to owners for fines, and publish extreme weather alerts on social media / public portal. |
| **Key Events** | `InfractionTicketCreated` (consumed), `ExtremeWeatherAlertTriggered` (consumed) |
| **Boundary** | Does not generate fines or detect extreme weather. Only acts as a consumer and orchestrator of external channels. |
| **Storage** | Sending log (audit) in a lightweight database or logs. |

## 3. Context Summary

| Context | Main Role | Communication Type | Storage |
|----------|---------------|----------------------|----------------|
| IoT Ingestion | Input gateway | Events (Kafka) | None (only buffer) |
| Traffic Analysis | Metrics | Events (Kafka) | TSDB |
| Trajectories | Route history | Events + queries | Graph/NoSQL |
| Environmental | Weather data | Events (Kafka) | TSDB |
| Law Enforcement | Infractions and fines | Events + synchronous query | PostgreSQL |
| Identity & Registry | Owners | Synchronous (gRPC) | PostgreSQL |
| Notifications | External communication | Events (Kafka) | Log / audit |

## 4. Note on Independence

Each context can be developed, deployed, and scaled independently. Events in Kafka are the only weak coupling between producer and consumer contexts. Synchronous communication only occurs between `Law Enforcement` and `Identity & Registry` (owner query), and is handled with circuit breakers and caching to avoid cascading failures.
