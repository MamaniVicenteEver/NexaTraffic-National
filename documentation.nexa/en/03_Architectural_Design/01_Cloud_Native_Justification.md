# Justification of Cloud‑Native and Microservices Style

## 1. Strategic Decision: Cloud‑Native vs. Lift & Shift

A **cloud‑native** architecture (built specifically for the cloud) has been chosen over a simple "lift & shift" of a traditional monolith. This decision responds to the following non-functional requirements of the SMT:

- **Massive data volume**: 4 million daily events (peak of 500 events/second).
- **Need for elastic scaling**: load varies by hour (peak hours) and by location.
- **Fault tolerance**: the system cannot stop ingestion even if secondary services (notifications, reports) fail.
- **Independent evolution**: business rules (speed limits, weather thresholds) change without affecting ingestion.

The cloud‑native approach allows for maximum exploitation of **microservices**, **containers**, **orchestration (Kubernetes)**, and **event‑driven architecture (EDA)** principles.

## 2. Microservices vs. Modular Monolith

| Aspect | Modular Monolith | Microservices (choice) |
|---------|------------------|----------------------------|
| **Scalability** | Full scaling (all functions together). | Independent scaling per context (e.g., more ingestion replicas, few notification replicas). |
| **Fault Tolerance** | An error in one module can crash the entire process. | Isolated failure: if the *Fine Manager* fails, ingestion and detection continue to operate. |
| **Deployment** | The entire system is deployed every time. | Deployment per microservice (update infraction rules without restarting sensors). |
| **Learning Curve** | Lower initial complexity. | Higher complexity (network, discovery, eventual consistency). |
| **Performance under High Load** | Bottleneck in shared database and compute resources. | Load balancing per service, each with its own optimized database. |

**Conclusion**: for a system that must process 500 events/second and guarantee 99.99% availability, decoupling into microservices is mandatory.

## 3. Communication Between Microservices

Two communication patterns have been defined, justified by the nature of each interaction:

### 3.1 Asynchronous Communication (Event‑Driven) – **Dominant pattern**

- **Technology**: Apache Kafka (event backbone).
- **Usage**: Publishing of `VehicleSighted`, `WeatherMetricsRecorded`, `InfractionTicketCreated`, `ExtremeWeatherAlertTriggered`.
- **Advantages**:
  - Temporal decoupling: the producer does not wait for the consumer.
  - Resilience: if a consumer fails, events persist in Kafka and are processed upon recovery.
  - Event replay: historical data can be reprocessed to regenerate state.
  - Scalability: multiple consumers compete for partitions.

### 3.2 Synchronous Communication (Request/Response) – **Only where unavoidable**

- **Technology**: gRPC (with timeout and circuit breaker).
- **Usage**: Owner lookup from `Law Enforcement` to `Identity & Registry` (needs the email to notify the fine).
- **Exception justification**: Creating the infraction requires the contact data within the same transactional flow; eventual consistency is not acceptable because the fine must be notified within a short timeframe.
- **Fragility mitigation**: 24h Redis cache, circuit breaker, retries with backoff.

## 4. Applied Cloud‑Native Principles (12‑Factor)

| Factor | Implementation in NexaTraffic |
|--------|-------------------------------|
| **I. Single Codebase** | One repository per microservice (or monorepo with independent deployments). |
| **II. Explicit Dependencies** | Management with Go modules / Maven / npm. |
| **III. External Configuration** | Environment variables for connections to Kafka, PostgreSQL, ClickHouse, Redis. |
| **IV. Backing Services** | Kafka, databases, external vehicle registry treated as attached resources. |
| **V. Build, release, run** | Strict separation (Docker + CI/CD). |
| **VI. Stateless processes** | All microservices are stateless; state is in databases or Kafka. |
| **VII. Port binding** | Each service exposes an HTTP/gRPC port. |
| **VIII. Concurrency** | Horizontal scaling via processes (Kubernetes pods). |
| **IX. Disposability** | Health checks (`/health`, `/ready`) and graceful shutdown (SIGTERM handling). |
| **X. Dev/prod parity** | Development, staging, and production environments as similar as possible (containers). |
| **XI. Logs** | Structured logs (JSON) to stdout, aggregated with Loki/ELK. |
| **XII. Admin processes** | Database migration scripts and maintenance tasks as one-off processes. |

## 5. Accepted Trade‑offs

- **Operational complexity**: Orchestration (Kubernetes), Kafka monitoring, and management of multiple databases are required.
- **Network latency**: Asynchronous communication adds milliseconds of latency (acceptable for the domain).
- **Eventual consistency**: Traffic metrics and trajectories do not require strong consistency; infractions are immediate thanks to the synchronous query.
- **Learning curve**: The team must know DDD, Kafka, and Kubernetes.

## 6. Conclusion

The combination of **microservices**, **EDA with Kafka**, and **cloud‑native principles** is the only one that simultaneously satisfies the SMT's requirements for scale (4M events/day), resilience (99.99% availability), and independent evolution. The trade‑offs are manageable with the documented resilience strategies.
