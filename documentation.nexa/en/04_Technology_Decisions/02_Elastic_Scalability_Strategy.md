# Elastic Scalability Strategy

## 1. Objective

Ensure that NexaTraffic can handle load spikes (up to 500 events/second) and progressive increases in locations (from 200 to 500 in the future) without service degradation, optimizing costs through automatic scaling.

## 2. Base Sizing

- **Normal load**: 4M events/day → ~46 events/second average.
- **Peak hour spikes**: 500 events/second (10-12 times the average).
- **Locations**: 200 initial, planned growth to 500.

## 3. Horizontal Scaling by Microservice

### 3.1. General Strategy

All microservices are **stateless** and deployed as Deployments in Kubernetes. **Horizontal Pod Autoscaler (HPA)** and **KEDA** are used for metric-based scaling.

### 3.2. Scaling Policy Table

| Microservice | Scaling Metric | Threshold | Replica Range | Stabilization (seconds) |
|---------------|---------------------|--------|-------------------|---------------------------|
| **IoT Ingestion** | CPU (target 70%) + Kafka producer lag (target < 1000) | 70% | 3 - 20 | 60 |
| **Traffic Analysis** | Consumer group lag (vehicle-sightings) | > 5000 messages | 2 - 15 | 120 |
| **Trajectories** | CPU (target 65%) | 65% | 2 - 10 | 60 |
| **Environmental Monitoring** | Consumer group lag (weather-metrics) | > 2000 messages | 1 - 5 | 90 |
| **Law Enforcement** | CPU + Lag (vehicle-sightings) | 70% or lag > 2000 | 2 - 12 | 60 |
| **Identity and Registry** | CPU + RPS (gRPC) | 60% or RPS > 500 | 2 - 8 | 120 |
| **Notifications** | Email queue length (internal queue) | > 1000 pending | 1 - 6 | 30 |

### 3.3. Example HPA Configuration (Kubernetes)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ingestion-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ingestion
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Pods
    pods:
      metric:
        name: kafka_producer_lag
      target:
        type: AverageValue
        averageValue: 1000
```

## 4. Event-Based Scaling (KEDA) for Kafka Consumers

KEDA allows scaling to zero when there are no messages, saving resources during off-peak hours (e.g., 2am - 5am).

**Example for Violation Detector**:

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: violation-detector-scaler
spec:
  scaleTargetRef:
    name: violation-detector
  pollingInterval: 30
  cooldownPeriod: 300
  minReplicaCount: 2
  maxReplicaCount: 12
  triggers:
  - type: kafka
    metadata:
      topic: vehicle-sightings
      bootstrapServers: my-kafka-brokers:9092
      consumerGroup: violation-group
      lagThreshold: "1000"
```

## 5. Data Infrastructure Scaling

### 5.1. Kafka (Azure Event Hubs)

- **Throughput units**: Auto-scaling based on data ingress (configure `auto-inflate` in Event Hubs).
- **Partitions**: 20 partitions are defined for `vehicle-sightings` (one for every 10 initial locations). Growth to 500 locations will require increasing partitions (planned manual repartitioning).

### 5.2. PostgreSQL

- **Read replicas**: For trajectory queries and dashboards. A replica is added when the primary's CPU exceeds 60% for 10 minutes.
- **Vertical scaling**: Azure Flexible Server allows changing vCores without downtime. Database size is monitored.

### 5.3. ClickHouse

- **Sharding**: Sharding by `location_id` is implemented to distribute write load.
- **Replication**: Factor 2 for fault tolerance. Scaling is performed by adding new nodes to the cluster (manual rebalancing).

### 5.4. Redis

- **Cluster**: 3 primary nodes + replicas. Scaling is done via Azure's managed plan (increasing memory capacity).

## 6. Vertical Scaling Strategy (when horizontal is not possible)

| Component | Horizontal Limit | Vertical Scaling Plan |
|------------|-------------------|---------------------------|
| PostgreSQL | Up to 16 vCores in Flexible Server | Monitor IOPS; if it exceeds 5000, migrate to Hyperscale (Citus). |
| ClickHouse | Machines with 64GB RAM | Add nodes (sharding) instead of scaling vertically. |
| Kafka | Limited partitions | Rebalance topics or add more throughput units. |

## 7. Maximum Peak Simulation (500 events/second)

| Resource | Estimated Demand | Minimum Capacity | Slack |
|---------|------------------|------------------|---------|
| Ingestion (Go) | 500 req/sec | 3 pods (each ~200 req/sec) | 20% |
| Kafka (Event Hubs) | 500 msgs/sec, 1KB each | 1 TU (1 MB/s) sufficient | 50% |
| Violation Detector | 500 ev/sec processed | 4 pods (each 150 ev/sec) | 20% |
| PostgreSQL (ticket writing) | 500 transactions/sec (peak) | 4 vCores, 50GB IOPS | 30% |

**Conclusion**: With 3 AKS nodes (4 vCPU each) and auto-scaling, the peak can be handled without degradation.

## 8. Predictive Scaling (time-based)

A **cron-scaler** (using KEDA with calendar) is implemented to anticipate known peaks:

- **Peak hours (7-9am, 5-7pm)**: Increase minimum replicas for Ingestion to 10, Violation Detector to 6.
- **Weekends**: Reduce minimum replicas by half (lower traffic).

```yaml
triggers:
- type: cron
  metadata:
    timezone: "America/La_Paz"
    start: "0 7 * * *"
    end: "0 9 * * *"
    desiredReplicas: "10"
```

## 9. Scalability Monitoring

| Metric | Tool | Alert Threshold |
|---------|-------------|------------------|
| Pod scaling time | Prometheus + HPA metrics | Greater than 5 minutes |
| Maximum Kafka lag | Prometheus Kafka exporter | Greater than 20,000 messages |
| CPU usage on nodes | Azure Monitor | Greater than 80% |
| Maximum replica count reached | Kubernetes API | Alert if exceeding 80% of configured maximum. |

## 10. Costs of Elastic Scaling

- **Benefit**: During off-peak hours (6 hours daily), the number of replicas is reduced by 50%, saving ~30% of compute costs.
- **Example**: With 3 base replicas (cost 420 USD/month), the savings from elastic scaling are ~126 USD/month.

The elastic scalability strategy ensures that NexaTraffic meets performance requirements without over-provisioning fixed resources, dynamically adapting to demand.
