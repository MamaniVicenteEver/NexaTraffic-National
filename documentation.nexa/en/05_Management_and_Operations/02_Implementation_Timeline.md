# Implementation Timeline by Phases (7 weeks of development + 1 week of demo)

## 1. Temporal Structure

The project is developed over **7 weeks of intensive work** (one week per milestone) plus a **final week for demonstration and adjustments**. Each week has concrete deliverables and acceptance criteria.

```
Week:        1     2     3     4     5     6     7     8
Development: M1    M2    M3    M4    M5    M6    M7    Demo
             [====][====][====][====][====][====][====]
Final Delivery:                                    [====]
```

## 2. Weekly Activity Breakdown

| Week | Milestone | Main Activities | Deliverables | Success Criteria |
|--------|-----------|-------------------------|-------------|--------------------|
| 1 | M1 - System Definition | - Develop vision, scope, glossary.<br>- Identify actors, ingestion and query flows.<br>- Define initial data model (metrics, events).<br>- List assumptions and gaps. | System definition document (PDF/MD).<br>Simple flow diagram.<br>List of gaps. | Review and approval by the instructor. |
| 2 | M2 - Cloud-native Architecture | - Design C4 diagrams (container level).<br>- Identify services (ingestion, processing, API, alerts).<br>- Justify monolith vs microservices, sync vs async.<br>- Document statelessness, scalability, resilience. | C4 diagrams.<br>Justification document.<br>Trade-off matrix. | Coherence with scale requirements. |
| 3 | M3 - 12-Factor Base Service | - Implement service with `/health` endpoint and one functional endpoint (e.g., `/metrics`).<br>- Use configuration via environment variables.<br>- Logs to stdout, stateless design.<br>- Create `.env.example` file. | Functional code (Go/Java).<br>`.env.example`.<br>Execution instructions. | Service passes local tests; complies with applicable 12 factors. |
| 4 | M4 - Containerization and Deployment | - Write Dockerfile.<br>- Run container locally.<br>- Deploy to cloud environment (AKS or Docker Compose).<br>- Configure variables external to the container. | Docker image.<br>Execution evidence (screenshot or URL).<br>Configuration document. | Reproducible container, build/run separation. |
| 5 | M5 - Events and Data | - Simulate event producer (traffic metrics, violations, weather).<br>- Implement consumer.<br>- Persist data in justified DB (PostgreSQL or TSDB).<br>- Demonstrate asynchronous flow. | Producer/consumer code.<br>Evidence of asynchronous flow (logs).<br>Database schema. | Asynchronous flow functions without event loss. |
| 6 | M6 - Observability and Resilience | - Expose system metrics (Prometheus).<br>- Implement advanced health checks (liveness/readiness).<br>- Generate structured logs (JSON).<br>- Simulate load or multiple instances. | Metrics evidence (Grafana).<br>Interpretable logs.<br>Resilience strategy document. | System responds to simulated failures (e.g., dependency failure). |
| 7 | M7 - CI/CD + AI + Reflection | - Diagram pipeline (build, test, deploy).<br>- Document critical use of AI.<br>- Develop final conclusions (trade-offs, limitations). | Pipeline diagram (GitHub Actions).<br>Reflection on AI.<br>Integrated final document. | Documented pipeline; coherent reflection. |
| 8 | Demo and Final Delivery | - Prepare presentation.<br>- Conduct live (or recorded) demo of key milestones.<br>- Deliver all artifacts (code, documentation, images). | Presentation (PPT/PDF).<br>Repository link.<br>Demo video (optional). | Instructor approval. |

## 3. Critical Milestones and Deadlines (example)

| Milestone | Deadline (week) | Dependencies |
|------|----------------------|--------------|
| Requirements Freeze | End of week 1 | M1 approval |
| Approved Architectural Design | End of week 2 | M1 completed |
| First Executable Code | End of week 3 | M2 completed |
| Container Deployed in Cloud | End of week 4 | M3 completed |
| Asynchronous Event Flow Working | End of week 5 | M4 completed |
| Operational Metrics and Logs | End of week 6 | M5 completed |
| Documented CI/CD Pipeline | End of week 7 | M6 completed |
| Final Demo | End of week 8 | All of the above |

## 4. Temporal Risk Management

| Risk | Probability | Impact | Mitigation | Contingency Week |
|--------|--------------|---------|-------------|------------------------|
| Delay in base service implementation (M3) | Medium | High | Use data mocks and random generators; simplify endpoint to only `/health`. | Week 3 (extend by 1 day) |
| Kafka Integration Issues (M5) | High | Medium | Dedicate 2 extra days in week 5; have a simulated broker (Redis or in-memory queue) as backup. | Week 5 |
| Cloud Deployment Failure (M4) | Medium | High | Have a local environment with Docker Compose as plan B; document both. | Week 4 |
| Instructor Unavailability for Review | Low | Medium | Submit deliverables 48h in advance; record asynchronous demo. | Any week |
| Excessive Workload (individual project) | Medium | Medium | Prioritize critical functionality (ingestion + violation) over enhancements (trajectories, weather). | Weeks 5-6 |

**Buffer**: Week 8 (demo) is also reserved for polishing details. If all goes well, the demo is held on day 1 of week 8 and the rest is used for final documentation.

## 5. Resource Allocation (simulated for individual project)

- **Architect / Lead Developer**: 100% dedication all weeks.
- **Tools**: GitHub Codespaces or local machine with Docker, Azure free tier or student credits.
- **External Reviews**: 1 hour weekly with the instructor.

## 6. Weekly Deliverables (checklist)

Week 1:
- [ ] Vision, scope, glossary document.
- [ ] List of assumptions and gaps.
- [ ] Ingestion and query flow diagram.

Week 2:
- [ ] C4 diagram container level.
- [ ] Justification for microservices and EDA.
- [ ] Trade-off matrix.

Week 3:
- [ ] Repository with base service code.
- [ ] `/health` endpoint and one business endpoint (e.g., mock `/metrics`).
- [ ] `.env.example` file.
- [ ] Logs to stdout (evidence).

Week 4:
- [ ] Dockerfile.
- [ ] Image in registry (Docker Hub or ACR).
- [ ] Local deployment (docker-compose up) and in cloud (AKS or similar).
- [ ] Functional URL or screenshot.

Week 5:
- [ ] Event producer (sensor simulator).
- [ ] Event consumer (e.g., log printer).
- [ ] Persistence in PostgreSQL (tickets) or ClickHouse (metrics).
- [ ] Evidence of asynchronous flow (Kafka screen or logs).

Week 6:
- [ ] `/metrics` endpoint exposed (Prometheus).
- [ ] Advanced health checks (`/health` and `/ready`).
- [ ] Structured logs (JSON) captured.
- [ ] Load simulation with multiple instances (or stress script).

Week 7:
- [ ] CI/CD pipeline diagram (GitHub Actions).
- [ ] Written reflection on AI use.
- [ ] Final conclusions (trade-offs, limitations).

Week 8:
- [ ] Demo presentation (10-15 min).
- [ ] Video or link to final repository.
- [ ] All artifacts uploaded to the course platform.
