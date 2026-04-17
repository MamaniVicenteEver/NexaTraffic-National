# Technical and Business Glossary

To ensure ubiquitous language among architects, developers, and domain experts, the following terms applicable to the entire NexaTraffic project are defined.

## Business Terms (Domain)

| Term | Definition |
|---------|-------------|
| **Remote Location (Node)** | Specific geographic point on the road network equipped with at least one speed sensor, an ANPR camera, and optionally a weather station. There are 200 nodes in the system. |
| **Sighting** | Temporal record of a vehicle passing a Remote Location. Contains at minimum: license plate, timestamp, instantaneous speed, and location. |
| **Trajectory** | Chronological collection of sightings associated with the same license plate over a period of time. Allows reconstruction of the route followed by a vehicle. |
| **Immutable Infraction** | Legal record of a speeding violation. It is immutable because once generated and packaged with its photographic evidence (cryptographic hash), it cannot be altered in the database. |
| **Extreme Weather** | State derived from telemetry (temperature < 0°C with precipitation, rain > 50 mm/h, etc.) that exceeds the defined safety thresholds for a location. |
| **Infraction Ticket** | Entity that groups: license plate, recorded speed, legal zone limit, photograph, timestamp, location, and notification status. |
| **Registered Owner** | Natural or legal person associated with a license plate in the National Vehicle Registry. They are the recipient of fine notifications. |

## Architectural and Technological Terms

| Term | Definition |
|---------|-------------|
| **Cloud-Native** | Development approach that exploits cloud computing to build resilient, scalable, and observable applications, using microservices, containers, orchestration, and state declaration. |
| **12-Factor App** | Methodology for building Software-as-a-Service (SaaS) applications that emphasizes: single codebase, declared dependencies, external configuration, decoupled backends, strict build/release/run stages, stateless processes, port binding, concurrency, disposability, dev/prod parity, logs as event streams, and admin processes. |
| **Bounded Context** | Conceptual boundary in DDD within which a particular domain model is consistent and applicable. Each microservice typically implements a bounded context. |
| **Event-Driven Architecture (EDA)** | Pattern where components communicate by producing, detecting, and reacting to state change events. Decouples producers and consumers. |
| **Anti-Corruption Layer (ACL)** | Translation layer that protects the internal domain model from contamination by external models (e.g., proprietary IoT camera formats). |
| **Time-Series Database (TSDB)** | Database optimized for storing and querying time-indexed data (traffic metrics, weather). Examples: ClickHouse, TimescaleDB, InfluxDB. |
| **Kafka Lag** | Difference between the latest offset produced in a topic and the offset consumed by a consumer group. High lag indicates a processing bottleneck. |
| **Idempotence** | Property of an operation that can be applied multiple times without changing the result beyond the first application. Critical for avoiding duplicates in event processing. |
| **Dead Letter Queue (DLQ)** | Kafka topic (or queue) where events that cannot be processed after several retries are redirected for later analysis without blocking the main flow. |
| **Back-pressure** | Mechanism by which a receiving system signals the sender to reduce the sending rate when it is saturated. In HTTP, it is implemented with 429/503 codes. |

## Acronyms and Initialisms

| Acronym | Meaning |
|-------|-------------|
| ANPR | Automatic Number Plate Recognition |
| DDD | Domain-Driven Design |
| DLQ | Dead Letter Queue |
| EDA | Event-Driven Architecture |
| HPA | Horizontal Pod Autoscaler (Kubernetes) |
| IoT | Internet of Things |
| mTLS | Mutual Transport Layer Security |
| PII | Personally Identifiable Information |
| RPO | Recovery Point Objective |
| RTO | Recovery Time Objective |
| SMT | Traffic Monitoring System |
| TSDB | Time-Series Database |
