# Detailed Scope of the NexaTraffic System

## 1. In-Scope

The design and implementation of the Traffic Monitoring System (TMS) encompasses the following functional and non-functional capabilities:

### 1.1 Core Functionalities

| Epic | Features |
|-------|----------------|
| **IoT Telemetry Ingestion** | Reception of data from 200 remote locations (ANPR cameras, speed sensors, weather stations) via MQTT/HTTP protocols. Transformation of proprietary formats to a canonical event model. |
| **Traffic Metrics** | Continuous calculation per location and time window: total vehicles, unique vehicles (distinct plates), average speed, maximum speed, minimum speed. |
| **Weather Metrics** | Recording of temperature, humidity, precipitation (rain/snow) associated with each location and timestamp. |
| **Trajectory Queries** | History of locations visited by a vehicle (license plate) within a specified time period (e.g., "the car with plate X visited locations A, B, C this month"). |
| **Violation Detection** | Real-time alerts when a vehicle exceeds the configured speed limit for the location. Generation of an immutable violation ticket including plate, photograph (evidence), recorded speed, location, and timestamp. |
| **Notifications** | Sending an email to the vehicle owner (via integration with an external vehicle registry) with the fine details. Publishing extreme weather alerts on social media / public portal. |
| **Visualization and Reports** | National dashboard with traffic heat maps, volume charts by city/county, and historical violation reports by license plate. |

### 1.2 Quality Attributes (Non-Functional Requirements)

| Attribute | Target Metric | Strategy |
|----------|------------------|-------------|
| Performance | p99 latency < 200ms from ingestion to violation generation. | In-memory processing, streaming with Kafka, Go/Java consumers. |
| Scalability | Support 4M events/day (peak of 500 events/second) with automatic horizontal scaling. | Kubernetes HPA based on CPU and Kafka lag. |
| Availability | 99.99% annual uptime. | Multi-zone architecture, Kafka replication (factor 3), high-availability databases. |
| Durability | Zero loss of critical events (violations). | Kafka with acks=all and replication; idempotent consumers with DLQ. |
| Security | Encryption in transit (TLS 1.3) and at rest (AES-256). Inter-service authentication (mTLS). | Istio service mesh or native Kubernetes configuration. |

## 2. Out-of-Scope

The following items are explicitly excluded from the TMS software design:

- **Edge hardware and firmware**: The development of optical character recognition (OCR) algorithms within the cameras. It is assumed the license plate is already decoded in the event payload.
- **Fine payment gateway**: The financial settlement of violations will be managed by an external governmental or banking system.
- **Physical node maintenance**: Alerts regarding electrical damage or sensor failures at the 200 locations.
- **Native mobile application**: The scope is limited to a responsive web portal (dashboard) and REST APIs for integrations.

## 3. Assumptions and External Dependencies

1. **Network connectivity**: The 200 remote locations have a minimum network link (broadband or 4G/5G) allowing data transmission to the Ingestion Gateway, with support for local retries in case of temporary disconnection (edge buffer).

2. **Master vehicle registry**: The TMS has access (via a high-availability API or asynchronous replication) to a national database that links the license plate number with the owner's email and identity. A maximum latency of 100ms for this query is assumed.

3. **Format standardization**: Regardless of the hardware manufacturer (Hikvision, Axis, etc.), data will be ingested or transformed by a *Protocol Adapter* into a canonical event schema (JSON/Protobuf) defined by NexaTraffic.

4. **External notification services**: Email providers (SMTP) and social media APIs (Twitter, Facebook) are available with their respective rate limits.

## 4. Known Gaps (Summary)

For a detailed analysis and mitigation plans, see the document `04_Initial_Proposal.md`. The main identified gaps are:

- Lack of a dynamic configuration context for speed limits and weather thresholds.
- Absence of defined data retention and temporal partitioning policies.
- Need for idempotence in Kafka consumers to avoid duplicate fines.
- Unspecified back-pressure for the Receiver Service in case of broker saturation.
