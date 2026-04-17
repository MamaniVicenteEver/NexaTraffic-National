# Architectural Risk Matrix

## 1. Methodology

Technical and project risks are identified, their probability and impact are assessed, and mitigations are defined. The matrix is reviewed at each milestone.

## 2. Risk Matrix

| ID | Risk | Probability (1-5) | Impact (1-5) | Priority | Mitigation | Responsible |
|----|--------|--------------------|---------------|-----------|-------------|-------------|
| R01 | Kafka saturation due to a peak of 500 events/second | 3 | 5 | High | Proper partitioning, back-pressure, consumer auto-scaling, lag monitoring. | Data Architect |
| R02 | Event loss due to Kafka failure | 2 | 5 | High | Replication factor 3, acks=all, retention configuration, backups of critical topics. | DevOps |
| R03 | Primary PostgreSQL failure | 2 | 4 | High | Automatic failover (HA redundant zone), ticket buffer in Kafka, PITR. | DBA |
| R04 | Excessive latency in owner query (>500ms) | 3 | 3 | Medium | Redis cache (TTL 24h), circuit breaker, 500ms timeout, read replica. | Backend |
| R05 | Fine duplication due to lack of idempotency | 2 | 5 | High | processed_event_ids table in Redis, verification before processing. | Backend |
| R06 | Slow pod scaling (more than 5 minutes) | 2 | 3 | Medium | Configure HPA with appropriate metrics, pre-warm replicas during peak hours. | DevOps |
| R07 | External vehicle registry failure | 3 | 4 | High | Circuit breaker, cache, PENDING_NOTIFICATION status and batch retries. | Backend |
| R08 | Personal data (PII) leakage | 1 | 5 | High | Encryption in transit (TLS), at rest (AES-256), minimize PII, auditing. | Security |
| R09 | Operational complexity of self-hosted ClickHouse | 3 | 2 | Low | Backup automation, monitoring, migration plan to managed service if it grows. | DevOps |
| R10 | Schedule deviation due to requirement changes | 3 | 3 | Medium | Short sprints, early prototyping, freeze requirements at milestone 3. | Project Manager |

## 3. Action Plan for Critical Risks (High Priority)

- **R01 (Kafka Saturation)**: Perform a load test with 600 events/second before deployment.
- **R02 (Event Loss)**: Configure offset monitoring and alerts if lag exceeds 10,000.
- **R04 (Identity Latency)**: Implement Redis cache and test with failure simulation.
- **R07 (External Registry Down)**: Execute a chaos test by cutting connectivity to the vehicle registry.

## 4. Follow-up

The matrix is updated every two weeks during implementation. Risks with high priority require a detailed mitigation plan before the start of the corresponding sprint.
