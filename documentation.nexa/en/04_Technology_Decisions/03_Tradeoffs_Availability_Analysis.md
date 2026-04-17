# Trade-off Analysis and Availability

## 1. Availability Requirement

NexaTraffic must have **99.99% availability** (maximum downtime ~52 minutes per year). This implies:
- Tolerance to node, zone, and region failures.
- Automatic recovery from failures.
- Controlled degradation (no loss of critical events).

## 2. Identified Trade-offs

### 2.1. Strong Consistency vs Availability (CAP Theorem)

| Component | Choice | Trade-off |
|------------|----------|-----------|
| Infraction Tickets | Strong consistency (ACID) | If PostgreSQL fails, new tickets cannot be created until recovery (they are buffered in Kafka). |
| Traffic Metrics | Eventual consistency | Some metrics may be lost during a ClickHouse outage, but they are recalculated from Kafka. |
| Owner Cache | Eventual consistency | A change in the vehicle registry may take up to 24h to be reflected (acceptable). |

**Decision**: Prioritize availability for metrics (eventual consistency) and consistency for tickets (legal priority).

### 2.2. Microservices vs Monolith

| Aspect | Microservices | Monolith |
|---------|----------------|----------|
| Availability | Isolated failure (e.g., notification service down does not affect ingestion) | Failure in one module can collapse everything. |
| Operational Complexity | High (orchestration, network) | Low |
| Recovery Time | Faster (restart only the failed service) | Slower (full restart) |

**Accepted Trade-off**: Higher operational complexity in exchange for better availability and scalability.

### 2.3. Polyglot Database vs Single Database

| Aspect | Polyglot (3 engines) | Single engine (e.g., PostgreSQL) |
|---------|----------------------|--------------------------------|
| Performance for time series | Excellent (ClickHouse) | Poor (slow queries, low compression) |
| Backup Complexity | High (3 different tools) | Low |
| Availability | Each engine has its own HA plan | A single point of failure (if PostgreSQL fails, everything fails) |

**Decision**: Polyglot, but with investment in backup and failover automation.

### 2.4. Kafka (asynchronous) vs Synchronous for Infractions

- **Asynchronous**: Higher availability (producer does not wait), but non-deterministic latency.
- **Synchronous**: Lower availability (if the consumer fails, the producer fails), but predictable latency.

**Trade-off**: Asynchronous is used for ingestion and analysis, but synchronous (gRPC) is used for owner lookup because ticket creation needs the email immediately.

## 3. High Availability Architecture by Component

### 3.1. Kubernetes (AKS)

- **Availability Zones**: 3 zones in the Brazil South region.
- **Nodes**: Distributed across zones (3 system nodes + application replicas).
- **PodDisruptionBudget**: Minimum 2 replicas for each critical microservice.

### 3.2. Kafka (Azure Event Hubs)

- **Throughput Units**: 2 active, with auto-scaling.
- **Geo-replication**: Optional, but retention is configured across multiple zones within the same region.
- **Availability**: 99.95% guaranteed by Azure (SLA).

### 3.3. PostgreSQL (Azure Database)

- **High Availability Mode**: Zone redundant (automatic standby in another zone).
- **Failover**: Switchover time < 60 seconds.
- **Backups**: PITR (up to 35 days).

### 3.4. ClickHouse (self-hosted on AKS)

- **Replication**: Factor 2, each shard has a replica in another zone.
- **Recovery**: If a pod fails, Kubernetes restarts it; if a node fails, replicas assume the load.

### 3.5. Redis (Azure Cache)

- **Tier**: Standard with replica (no automatic failover, but recovers in a few minutes).
- **Persistence**: RDB every 15 minutes.

### 3.6. S3 for Images

- **Durability**: 11 nines (99.999999999%).
- **Availability**: 99.99% for GET operations (SLA).
- **Failover**: Configure replication in another region (optional, extra cost).

## 4. Disaster Recovery (DR) Plan

| Scenario | Target RTO | Target RPO | Strategy |
|-----------|--------------|--------------|------------|
| Complete zone failure (AKS) | < 15 minutes | < 5 minutes | Kubernetes replicates pods in other zones; load balancer redirects traffic. |
| Primary PostgreSQL outage | < 2 minutes | < 10 seconds | Automatic failover to secondary replica (Azure Flexible Server). |
| Data corruption in PostgreSQL | < 4 hours | 5 minutes (PITR) | Restore from point-in-time backup. |
| Kafka outage (Event Hubs) | < 10 minutes | < 1 minute | Microsoft guarantees automatic recovery; if regional, use geo-replication (extra cost). |
| S3 loss | < 1 hour | 0 (immutable) | Configure versioning and cross-region replication. |

## 5. Controlled Degradation (Graceful Degradation)

When a component fails, the system remains operational with reduced functionality:

| Failed Component | Affected Functionality | Degradation Mode |
|--------------------|------------------------|----------------------|
| PostgreSQL | Tickets and owners | New infractions are stored in Kafka (topic `pending-tickets`) and processed when PostgreSQL recovers. |
| ClickHouse | Historical metrics | Dashboards display a "Temporary data unavailable" message. Ingestion and detection continue normally. |
| Redis | Cache and deduplication | Vehicle unique deduplication is disabled (non-unique totals are reported). Owner cache is queried directly from PostgreSQL (slower). |
| Identity & Registry | Owner lookup | Redis cache is used (if available) or the ticket is created in `PENDING_NOTIFICATION` status and retried every hour. |
| Kafka | Entire event flow | Sensors retry sends with backoff; if Kafka does not recover in 1 hour, a critical alert is triggered. |

## 6. Failure Simulation and Recovery Times (Chaos Testing)

Weekly tests are performed in the staging environment:

| Experiment | Observed Recovery Time | Corrective Action |
|-------------|----------------------------------|-------------------|
| Kill 2 of 3 PostgreSQL nodes | 45 seconds | Acceptable (less than 2 minutes). |
| AKS zone failure (simulated) | 90 seconds (nodes rescaled) | Optimize pod affinity. |
| Kafka saturation (5000 messages/second) | 2 minutes (Event Hubs scaling) | Increase automatic throughput units. |
| 30% packet loss on network | 5 seconds (TCP retransmission) | No changes. |

## 7. High Availability Costs

| Component | HA Configuration | Additional Monthly Cost (vs without HA) |
|------------|------------------|--------------------------------------|
| AKS (3 zones, 3 extra nodes) | Distributed nodes, minimum 2 replicas per service | ~210 USD (50% more) |
| PostgreSQL (Zone redundant HA) | 2 vCores, 50GB storage | +75 USD |
| Redis (replica) | Standard with replica | +20 USD |
| Kafka (Event Hubs) | 2 throughput units, optional geo-redundancy | +30 USD |
| **Total Additional HA** | | **~335 USD/month** |

**Base cost without HA**: ~350 USD/month → **with HA**: ~685 USD/month (meets 99.99% SLA).

## 8. 99.99% SLA Compliance

- **Calculated Availability**: (1 - (annual downtime / 525600)) * 100.
- **Estimated Downtime from Failures**:
  - PostgreSQL failover: 1 minute (every 2 months) → 6 minutes/year.
  - AKS zone failure: 2 minutes (every 6 months) → 4 minutes/year.
  - Kafka recovery: 5 minutes (every 3 months) → 20 minutes/year.
  - **Total**: 30 minutes/year → availability **99.994%** (exceeds 99.99%).

## 9. Final Decisions and Accepted Trade-offs

| Trade-off | Decision | Justification |
|-----------|----------|----------------|
| Higher HA cost vs downtime risk | Accept additional cost | Fines for non-notification or loss of events have greater legal and financial impact. |
| Complexity of 3 databases vs simplicity | Accept complexity | ClickHouse is essential for metrics; PostgreSQL for tickets. |
| Eventual consistency in metrics vs availability | Prioritize availability | Dashboards can show slightly delayed data; infraction detection is real-time. |
| Self-hosted ClickHouse vs managed | Self-hosted for cost control | The team has Kubernetes experience; backups are automated. |

The resulting architecture meets the 99.99% availability objective with reasonable cost and controlled degradation in case of failures.
