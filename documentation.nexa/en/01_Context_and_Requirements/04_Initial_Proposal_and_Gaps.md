# Initial Project Proposal for NexaTraffic

## 1. Executive Summary

This document constitutes the initial technical proposal for the design and implementation of the **National Traffic Monitoring System (SMT)**, named NexaTraffic. The solution is based on a cloud-native, event-driven architecture deployed on Kubernetes, with the capacity to process 4 million daily events from 200 remote locations.

The main technical and requirement gaps are identified, and concrete lines of action are proposed to mitigate them in the subsequent phases of the project.

## 2. Documented Technical and Requirement Gaps

The gaps detected during the analysis of the provided requirements are listed below. Each gap includes a justification, potential impact, and resolution strategy.

### 2.1 Gap: Dynamic configuration of speed limits and weather thresholds

**Description**: The requirements specify that violations must be generated when a vehicle exceeds the "speed limit" of a location, but it does not define how these limits are stored, updated, or distributed. The management of thresholds for "extreme weather" is also not specified.

**Impact**: Without a centralized and dynamic configuration source, each instance of the *Violation Detector* would need to restart to change a limit, or inconsistency between replicas would occur.

**Resolution Strategy**:
- Create a **Configuration Context** (new bounded context) that exposes a CRUD API and publishes `SpeedLimitUpdated` and `WeatherThresholdUpdated` events to Kafka.
- All consumer services (*Violation Detector*, *Extreme Weather Detector*) listen to these events and maintain an updated local cache.
- The limit per location is versioned and audited.

### 2.2 Gap: Idempotency in event consumers

**Description**: Kafka guarantees *at-least-once* delivery. If a consumer fails after processing an event but before committing the offset, the same event will be resent. Without idempotency mechanisms, multiple violations can be generated for the same sighting.

**Impact**: Duplicate fines, legal inconsistency, and citizen complaints.

**Resolution Strategy**:
- Each consumer (e.g., *Violation Detector*) maintains a table (in Redis or PostgreSQL) of `processed_event_ids` with the unique event ID and a TTL.
- Before processing, it checks if the ID already exists; if so, it skips the event and commits the offset.
- Event IDs are generated in the *Protocol Adapter* as UUIDv7 (time-sortable).

### 2.3 Gap: Undefined data retention and partitioning policies

**Description**: "Retain data for 5 years" is mentioned in the README, but there is no specification of which data is retained for how long (raw, aggregated, trajectories, violations). A partitioning strategy to handle growth is also not defined.

**Impact**: Unlimited storage growth, degraded query performance, and high costs.

**Resolution Strategy**:
- **Raw events (Kafka)**: Configurable time-based retention (e.g., 7 days) via `log.retention.hours`.
- **Aggregated metrics (ClickHouse)**: Tables partitioned by month, with a TTL (Time-To-Live) of 5 years for hourly metrics. Minute-level metrics are retained for 30 days.
- **Trajectories (PostgreSQL/Graph)**: Kept for 2 years, then archived to cold storage (S3 Glacier).
- **Violations**: Indefinite due to legal requirements, but implement partitioning by year and plan for archiving after 7 years.

### 2.4 Gap: Absence of a back-pressure mechanism in ingestion

**Description**: The *Receiver Service* receives data from 200 locations via HTTP/MQTT. If the Kafka cluster becomes saturated or the producer slows down, there is no defined mechanism for the receiver to instruct the IoT sensors to reduce the sending rate.

**Impact**: Data loss (timeouts, full buffers) or service collapse due to memory.

**Resolution Strategy**:
- The *Receiver Service* implements a **circuit breaker** and a **limited buffer** (circular queue). When the Kafka producer responds with an error or high latency, the service returns HTTP 503 (Service Unavailable) or MQTT does not accept publications.
- IoT sensors must implement retry logic with exponential backoff (manufacturer's responsibility, but specified in the integration contract).

### 2.5 Gap: Lack of specification for sensor data format

**Description**: "Proprietary format" and a "Protocol Adapter" are mentioned, but a concrete schema (JSON Schema / Protobuf) for the internal canonical model is not defined.

**Impact**: Ambiguity in adapter development and risk of incorrect interpretations.

**Resolution Strategy**:
- Define a **Protobuf schema** (backwards-compatible evolution) for canonical events:
  ```protobuf
  message VehicleSighting {
    string sighting_id = 1;
    string license_plate = 2;
    int64 timestamp_unix_ms = 3;
    uint32 location_id = 4;
    double speed_kph = 5;
    bytes evidence_image = 6; // Compressed JPEG
  }
  ```
- For weather:
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
- The Protocol Adapter transforms each manufacturer's formats to these protos.

### 2.6 Gap: Owner query as a non-resilient synchronous point

**Description**: The *Fine Manager* must query the *Vehicle Registry* (via gRPC) to obtain the owner's email. If the registry fails, the fine cannot be notified, and no alternative behavior is defined.

**Impact**: Blockage in notification generation; possible retention of unsent fines.

**Resolution Strategy**:
- Implement **Circuit Breaker pattern** (Resilience4j in Java, go-resiliency in Go) with a 500ms timeout.
- Last-mile local cache: store the relationship (license plate → email) in Redis with a 24-hour TTL. If the registry fails, the cache is used.
- If there is no cache and the registry fails, the fine is persisted in a `PENDING_NOTIFICATION` state and a batch process retries every hour.

## 3. Action Plan to Mitigate Gaps

| Gap | Priority | Mitigation Milestone | Suggested Responsible |
|--------|-----------|--------------------|----------------------|
| Dynamic configuration | High | Milestone 2 (design) + Milestone 5 (event implementation) | Architect |
| Idempotency | High | Milestone 5 (Kafka consumers) | Backend Developer |
| Retention policies | Medium | Milestone 2 (design) and Milestone 6 (operation) | Data Architect |
| Back-pressure | High | Milestone 3 (base service) | Ingestion Developer |
| Data format | Medium | Milestone 1 (definition) | Integration Architect |
| Registry query resilience | High | Milestone 3 + Milestone 6 | Backend Developer |

## 4. Conclusions of the Initial Proposal

The proposed architecture for NexaTraffic is solid and aligned with cloud-native principles. The identified gaps are manageable through the described strategies, which will be implemented progressively in the corresponding milestones. It is recommended to prioritize the definition of the **Configuration Context** and **idempotency** before the first real load test.

This document will be updated as gaps are resolved and new ones are discovered during implementation.
