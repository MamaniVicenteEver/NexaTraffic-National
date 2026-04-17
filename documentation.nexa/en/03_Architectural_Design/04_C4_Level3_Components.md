# C4 View Level 3: Internal Components (PlantUML)

## 1. Description

Level 3 decomposes a specific container into its internal components (classes, modules, services). For NexaTraffic, we take the **Law Enforcement** container as it is the core of the most critical business logic. An example of **IoT Ingestion** is also shown.

## 2. Law Enforcement Component Diagram (PlantUML)

```plantuml
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Component.puml

' Title
title Internal Components - Law Enforcement (Law Enforcement Application)

' Parent container
Container_Boundary(law_enforcement, "Law Enforcement Container") {

    ' Internal components
    Component(violation_detector, "Violation Detector", "Java + Kafka Consumer", "Consumes VehicleSighted, evaluates speed limit.")
    Component(speed_limit_cache, "Speed Limit Cache", "Caffeine / Redis", "Local cache of limits per location, updated by configuration events.")
    Component(evidence_packager, "Evidence Packager", "Java + Kafka Producer", "Generates immutable ticket, requests photo from sensor (if available).")
    Component(fine_manager, "Fine Manager", "Java + gRPC Client", "Manages the fine lifecycle (status: pending, notified, paid).")
    Component(ticket_repository, "Ticket Repository", "Spring Data JPA", "Persists tickets in PostgreSQL.")
    Component(identity_client, "Identity Client", "gRPC + Circuit Breaker", "Queries owner by license plate with resilience (timeout, retries).")
    Component(kafka_producer, "Kafka Producer", "Spring Kafka", "Publishes InfractionTicketCreated to the event bus.")
}

' External components to the container (systems or containers)
System_Ext(kafka, "Kafka Topic: vehicle-sightings")
System_Ext(identity_service, "Identity & Registry Container (gRPC)")
System_Ext(postgres_db, "PostgreSQL (tickets)")
System_Ext(config_kafka, "Kafka Topic: speed-limit-updated")
System_Ext(kafka_out, "Kafka Topic: infraction-tickets")

' Relationships
Rel(violation_detector, speed_limit_cache, "Reads speed limit", "in memory")
Rel(violation_detector, kafka, "Consumes VehicleSighted", "Kafka consumer")
Rel(violation_detector, evidence_packager, "Triggers (if violation)", "internal event")

Rel(evidence_packager, fine_manager, "Delegates ticket creation", "method call")
Rel(evidence_packager, kafka_producer, "Requests publication", "InfractionTicketCreated event")

Rel(fine_manager, ticket_repository, "Persists ticket", "JPA")
Rel(fine_manager, identity_client, "Gets owner", "gRPC")

Rel(identity_client, identity_service, "Calls gRPC", "circuit breaker")
Rel(ticket_repository, postgres_db, "Writes/reads", "JDBC")
Rel(kafka_producer, kafka_out, "Publishes event", "Kafka producer")

' External configuration component (updates cache)
Rel(config_kafka, speed_limit_cache, "Updates limit", "SpeedLimitUpdated event")

@enduml
```

## 3. Explanation of each component (Law Enforcement)

| Component | Responsibility | Technology | State |
|------------|----------------|------------|--------|
| **Violation Detector** | Consumes `VehicleSighted`, compares speed with location limit (from cache). If exceeded, emits an internal event to Evidence Packager. | Kafka Consumer (Spring), Caffeine cache | Stateless |
| **Speed Limit Cache** | Maintains in memory the speed limits per `locationId`. Updated by listening to `SpeedLimitUpdated` events from Kafka. | Caffeine + Redis (fallback) | Stateful (ephemeral) |
| **Evidence Packager** | Receives the violation, assembles the ticket (ticketId, evidence, optional photo) and passes it to Fine Manager. | Java POJO | Stateless |
| **Fine Manager** | Orchestrates ticket creation: assigns initial status, invokes Identity Client, persists with Ticket Repository, and finally publishes the event. | Spring Service | Stateless |
| **Ticket Repository** | Data access layer for tickets (JPA). Allows auditing and immutability (write-only, no updates). | Spring Data JPA | Stateless (DB connection) |
| **Identity Client** | Resilient gRPC client: timeout 500ms, circuit breaker (Resilience4j), retries with backoff. | gRPC Stub + Resilience4j | Stateless |
| **Kafka Producer** | Publishes `InfractionTicketCreated` to the output topic for Notifications to consume. | Spring Kafka | Stateless |

## 4. IoT Ingestion Component Diagram (PlantUML)

```plantuml
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Component.puml

title Internal Components - IoT Ingestion

Container_Boundary(ingestion, "IoT Ingestion Container") {

    Component(http_receiver, "HTTP/MQTT Receiver", "Go + Gorilla Mux / Paho MQTT", "Receives raw payloads from sensors.")
    Component(protocol_adapter, "Protocol Adapter", "Go", "Translates proprietary formats to canonical (Anti-Corruption Layer).")
    Component(validation, "Validator", "Go", "Validates mandatory fields (license plate, speed, timestamp).")
    Component(kafka_producer, "Kafka Producer", "Go (Sarama)", "Publishes canonical event to Kafka with idempotency.")
    Component(backpressure, "Backpressure Controller", "Go + Channel buffer", "Limits internal queue; returns 503 if saturated.")
}

System_Ext(sensors, "IoT Sensors (200 locations)")
System_Ext(kafka, "Kafka Topics: vehicle-sightings, weather-metrics")

Rel(sensors, http_receiver, "Sends data (MQTT/HTTP)", "binary JSON")
Rel(http_receiver, backpressure, "Passes payload if capacity", "internal channel")
Rel(backpressure, protocol_adapter, "Delivers payload", "call")
Rel(protocol_adapter, validation, "Normalizes and validates", "canonical structure")
Rel(validation, kafka_producer, "Sends validated event", "call")
Rel(kafka_producer, kafka, "Publishes", "Kafka producer with acks=all")

' Backpressure note
Note on backpressure : If internal queue > 1000 messages, the Receiver responds HTTP 503.
@enduml
```

## 5. Explanation of IoT Ingestion Components

| Component | Responsibility | Technology | Notes |
|------------|----------------|------------|-------|
| **HTTP/MQTT Receiver** | Exposes endpoints for sensors to send data. Supports retries. | Go + Gorilla Mux / Paho MQTT | Stateless |
| **Backpressure Controller** | Limited buffer (circular queue). If full, the Receiver returns 503 Service Unavailable. | Go channel | Stateful (memory) |
| **Protocol Adapter** | Translates formats from different vendors (Hikvision, Axis, etc.) to the canonical model. | Go | Stateless (ACL) |
| **Validator** | Verifies that required fields are not null, speed ranges, license plate format. | Go | Stateless |
| **Kafka Producer** | Publishes the normalized event with idempotency (enable.idempotence=true). | Sarama | Stateless |

## 6. Complete Data Flow (Law Enforcement)

1. `VehicleSighted` arrives at Kafka topic `vehicle-sightings`.
2. `Violation Detector` consumes the event.
3. Queries `Speed Limit Cache` to get the location limit.
4. If `speed > limit`, `Evidence Packager` is activated.
5. `Evidence Packager` builds the ticket and calls `Fine Manager`.
6. `Fine Manager` invokes `Identity Client` to get the owner's email (with circuit breaker and Redis cache).
7. Persists the ticket in PostgreSQL via `Ticket Repository`.
8. Publishes `InfractionTicketCreated` to Kafka via `Kafka Producer`.
9. Notifications will consume that event to send the email.

## 7. Summary of Design Decisions in Components

- **Ticket Immutability**: Once persisted, it cannot be modified. Any state change (paid, contested) is a new event.
- **Speed Limit Cache**: Updated via `SpeedLimitUpdated` events to avoid database queries on each detection.
- **Ingestion Backpressure**: Protects Kafka from massive spikes; sensors must retry with exponential backoff.
- **Circuit Breaker in Identity Client**: Prevents failures in the vehicle registry from blocking fine generation; fallback to cache or pending state.
