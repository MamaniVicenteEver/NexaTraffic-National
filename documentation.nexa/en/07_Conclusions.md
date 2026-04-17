# Final Project Conclusions for NexaTraffic

## 1. Summary of the implemented solution (design)

NexaTraffic is a national traffic monitoring system based on a cloud-native, event-driven architecture. It is designed to process 4 million daily events from 200 remote locations (ANPR cameras, speed sensors, weather stations). The solution consists of 7 microservices (bounded contexts) orchestrated in Kubernetes, with Apache Kafka as the asynchronous messaging backbone and polyglot persistence (PostgreSQL, ClickHouse, Redis). Resilience, elastic scalability, and high availability (99.99%) have been prioritized.

## 2. Evaluation of milestone completion

| Milestone | Status | Key Deliverables | Observations |
|-----------|--------|-------------------|----------------|
| M1 - System Definition | Completed | Vision, scope, glossary, initial proposal, gaps. | 8 technical gaps were identified and mitigations proposed. |
| M2 - Cloud-native Architecture | Completed | C4 diagrams (levels 1,2,3), justification for microservices vs monolith, EDA, trade-offs. | Justification includes cost and scalability analysis. |
| M3 - 12-Factor Base Service | Partial (design) | Stack and principles defined, but no functional code implementation. | Actual coding of a service with /health and logs remains pending. |
| M4 - Containerization and Deployment | Partial (strategy) | Dockerfile, AKS described, but no evidence of a working image. | Design includes blue-green and external configuration. |
| M5 - Events and Data | Completed (design) | Canonical JSON, asynchronous flows, simulated Kafka producer/consumer, persistence. | Event contracts are fully defined. |
| M6 - Observability and Resilience | Completed (design) | Metrics (Prometheus), health checks, structured logs, back-pressure, circuit breakers. | Includes back-pressure and DLQ strategy. |
| M7 - CI/CD + AI | Completed | GitHub Actions pipeline (diagram), reflection on AI, build/run separation. | Pipeline described with clear stages and justified tools. |

**Final Note**: The project is a comprehensive architectural design ready for implementation. Milestones requiring functional code and actual deployment remain as future work, but the documentation covers all necessary aspects for its construction.

## 3. Main trade-offs assumed

| Decision | Trade-off | Acceptance | Mitigation |
|----------|-----------|------------|-------------|
| Microservices vs modular monolith | Higher operational complexity (orchestration, network) in exchange for independent scalability. | Accepted | Deployment automated with CI/CD and health checks used. |
| Polyglot persistence (3 engines) | Cost of managing multiple databases. | Accepted | Self-hosted ClickHouse on AKS reduces cost; automated backups. |
| Asynchronous communication (Kafka) vs synchronous | Non-deterministic latency, but greater resilience. | Accepted | Only one synchronous flow (query to Identity) with circuit breaker. |
| Back-pressure with HTTP 503 | Sensors must implement retries; risk of loss if they don't. | Accepted with contract | Exponential backoff specified in the integration contract. |
| Kafka lag-based autoscaling | Momentary over-scaling may occur. | Accepted | Metrics stabilized with 2-5 minute windows. |

## 4. Limitations of the designed architecture

- **Lack of functional implementation**: There is no executable code or deployed containers. The design is a blueprint, not an operating system.
- **Load tests not executed**: The mass ingestion POC is planned but not performed; results are simulated.
- **Dependency on external vehicle registry**: If it fails or is slow, fines may remain in a pending state.
- **Distributed debugging complexity**: With 7 microservices and Kafka, tracing an error requires tools like Jaeger (not implemented).
- **ClickHouse scaling**: Shard rebalancing is manual and requires expertise.

## 5. Lessons learned during the design

- **Domain-Driven Design (DDD)** is indispensable for decomposing complex domains and avoiding anemic models. Well-defined bounded contexts reduce coupling.
- **Event-driven architecture** with Kafka provides real decoupling but demands idempotency, DLQ, and lag monitoring.
- **Containerization and orchestration** (Kubernetes) are necessary to meet high SLAs but add a significant learning curve.
- **Documentation in Markdown + PlantUML diagrams** facilitates collaboration and version control; it is preferable to proprietary tools.
- **Using AI as an assistant** accelerates documentation generation, but it must always be reviewed by a human to avoid hallucinations and biases.

## 6. Recommendations for future iterations or real implementation

1. **Implement a minimal functional prototype** with three services: IoT Ingest, Kafka, Violation Detector, and PostgreSQL. This will validate the critical chain.
2. **Execute the load test** (POC) with 500 events/second for 1 hour to measure real latency and lag.
3. **Automate ClickHouse scaling** using the Altinity operator for Kubernetes.
4. **Add distributed tracing** with OpenTelemetry + Jaeger to monitor end-to-end flows.
5. **Migrate to ClickHouse Cloud** if the team lacks database administration experience, accepting a higher cost.
6. **Establish a Service Level Agreement (SLA)** with the external vehicle registry provider guaranteeing 99.9% availability.

## 7. Final reflection

NexaTraffic demonstrates that it is possible to design a high-scale system following cloud-native and DDD principles, even without fully implementing the code. The generated documentation (29 markdown files) serves as a detailed blueprint that any development team could follow to build the real system. The project meets the academic objectives of the capstone, and the unimplemented areas are clearly identified as viable future work.
