# Resilience and Back-pressure Strategy

## 1. Objective

Ensure that NexaTraffic can handle traffic spikes, component failures, and saturation without losing data or degrading critical service (ingestion and violation detection).

## 2. Back-pressure in Ingestion

### 2.1. Saturation Scenario

The `Receiver Service` (IoT Ingestion) receives up to 500 events/second. If the Kafka producer or Kafka itself slows down (e.g., due to a hot partition), the receiver cannot accept all messages.

### 2.2. Implemented Mechanism

- **Limited internal buffer**: A circular queue (Go channel) with a capacity for 10,000 messages.
- **Usage monitoring**: If the buffer reaches 80% of its capacity, the service starts returning **HTTP 429 (Too Many Requests)** or **503 (Service Unavailable)** to the sensors.
- **Response with suggested backoff**: The error body includes `"Retry-After: 5"` (seconds).

**Response Example**:
```json
{
  "error": "Ingestion buffer full",
  "retry_after_seconds": 5,
  "details": "Kafka producer lag detected"
}
```

### 2.3. Requirement for IoT Sensors

Sensors must implement **exponential backoff retries** (1s, 2s, 4s, up to 30s) and local storage in case of prolonged failure. This requirement is part of the integration contract.

## 3. Handling Traffic Spikes (Autoscaling)

### 3.1. Kubernetes Horizontal Pod Autoscaler (HPA)

| Microservice | Scaling Metric | Threshold | Replica Range |
|---------------|---------------------|--------|-------------------|
| IoT Ingestion | CPU > 70% or Kafka producer lag > 1000 | 70% | 3 - 20 |
| Traffic Analysis | Kafka lag (consumer group) > 5000 messages | 5000 | 2 - 15 |
| Violation Detector | CPU > 65% | 65% | 2 - 10 |
| Notifications | Email queue length (internal queue) > 1000 | 1000 | 1 - 5 |

### 3.2. Event-Based Scaling (KEDA)

For Kafka consumers, we use **KEDA** (Kubernetes Event-Driven Autoscaler) which scales based on lag per partition:

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: violation-detector-scaler
spec:
  scaleTargetRef:
    name: violation-detector
  triggers:
    - type: kafka
      metadata:
        topic: vehicle-sightings
        lagThreshold: "1000"
        consumerGroup: violation-group
```

## 4. Resilience to External Service Failures

### 4.1. Circuit Breaker for Identity & Registry Calls

The synchronous communication between `Law Enforcement` and `Identity` is the most fragile point. We implement **Resilience4j** (Java) with:

- **Timeout**: 500 ms.
- **Circuit Breaker**:
  - Closed state: normal calls.
  - If 50% of calls fail in 10 seconds → moves to **open** (rejects calls immediately for 5 seconds).
  - Then moves to **half-open** (allows one test call).
- **Fallback**: If the circuit breaker is open or times out, the Redis cache (`owner:{plate}`) with a 24h TTL is used.
- **Last resort fallback**: If there is no cache, the ticket is created in `PENDING_NOTIFICATION` status and a batch process retries every hour.

### 4.2. Dead Letter Queue (DLQ) for Failed Events

Each Kafka consumer (e.g., Violation Detector, Notifications) configures a **DLQ**:

- If an event fails after 3 retries (with backoff of 1s, 2s, 4s), it is published to a `dlq-{consumer-group}` topic.
- A manual or automated process (operations dashboard) can inspect and re-inject events.

### 4.3. Kafka Outage

- **Health check** in each service: the `/ready` endpoint verifies that the Kafka producer/consumer is connected.
- If Kafka does not respond, the pod is marked as `NotReady` and Kubernetes does not send traffic (in the case of services that also expose a synchronous API).
- **Producer retries**: Configuration `retries=5`, `retry.backoff.ms=100`.

## 5. Database Outages

| Database | Strategy | Estimated RTO | RPO |
|---------------|------------|--------------|-----|
| PostgreSQL | Primary + secondary replica (automatic failover with Patroni or Cloud managed) | < 1 minute | < 5 seconds (WAL shipping) |
| ClickHouse | Cluster with replication (factor 2) | < 2 minutes | < 10 seconds |
| Redis | Redis Sentinel or Cluster (3 nodes) | < 30 seconds | Zero (ephemeral data, recalculated) |

### 5.1. Controlled Degradation

If PostgreSQL goes down:
- Ingestion and violation detection **continue to function** (only the ticket is stored in a local buffer or in Kafka with a specific topic).
- When PostgreSQL recovers, a replay process persists the pending tickets.

## 6. Resilience Testing (Chaos Engineering)

Experiments are defined in the staging environment:

| Experiment | Tool | Frequency |
|-------------|-------------|-------------|
| Kill a Kafka pod | Chaos Mesh | Weekly |
| Inject 2s latency in Identity call | Toxiproxy | Weekly |
| CPU saturation in Ingestion (stress) | `stress-ng` | Monthly |
| PostgreSQL outage (failover) | Cloud provider API | Monthly |

**Success Metrics**:
- No events are lost (verify Kafka offsets).
- Recovery Time Objective (RTO) < 2 minutes.
- Monitoring alerts trigger correctly.

## 7. Monitoring and Alerts for Resilience

| Metric | Threshold | Action |
|---------|--------|--------|
| Kafka lag (consumer group) | > 10,000 messages for 5 min | Scale consumers (KEDA) |
| HTTP 5xx error rate in Ingestion | > 1% in 1 min | Review back-pressure, scale producers |
| Identity circuit breaker open | Duration > 30 sec | Alert on-call team |
| DLQ usage | Any message in `dlq-*` | Manual review within 24h |
| PostgreSQL p99 response time | > 200 ms | Scale replica or review queries |

## 8. Strategy Summary by Component

| Component | Back-pressure | Circuit breaker | Retries | DLQ | Autoscaling |
|------------|---------------|----------------|---------|-----|--------------|
| IoT Ingestion | ✅ (HTTP 503) | ❌ (not applicable) | N/A (sensor) | ❌ | ✅ (HPA) |
| Violation Detector | ❌ (consumer) | ❌ | ✅ (Kafka consumer) | ✅ | ✅ (KEDA) |
| Fine Manager | ❌ | ✅ (gRPC) | ✅ (gRPC) | N/A | ✅ (HPA) |
| Identity & Registry | ❌ | ❌ (is provider) | N/A | ❌ | ✅ (replicas) |
| Notifications | ❌ | ✅ (SMTP) | ✅ (email) | ✅ | ✅ (KEDA) |
| Databases | ❌ | N/A | N/A | N/A | ❌ (replication) |

## 9. Conclusion

The combination of back-pressure, circuit breakers, DLQ, autoscaling, and chaos testing ensures that NexaTraffic maintains **99.99% availability** even under spikes of 500 events/second and component failures. The strategies are aligned with cloud-native system resilience principles.
