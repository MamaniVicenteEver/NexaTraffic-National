# POC Validation: Bulk Ingestion of 4M Events/Day

## 1. Objective

Demonstrate that the proposed architecture can handle the peak of 500 events/second (4M daily) without data loss and with acceptable latency (<200ms for violation detection).

## 2. Test Environment

- **Infrastructure**: AKS with 3 D4s v3 nodes (4 vCPU, 16GB RAM) – same as production.
- **Sensor Simulator**: Go script that generates 500 events/second (VehicleSighted) distributed across 200 locations.
- **Components under test**: IoT Ingestion, Kafka (Event Hubs 1 TU), Violation Detector, PostgreSQL.
- **Duration**: 1 continuous hour (1.8M events).

## 3. Metrics to Measure

| Metric | Tool | Success Threshold |
|---------|-------------|-----------------|
| Ingestion throughput (events/second) | Prometheus + Kafka message count | > 500 |
| HTTP error rate in ingestion | Ingestion Logs | < 0.1% |
| Maximum Kafka lag | Kafka exporter | < 5000 messages |
| p99 Latency (ingestion → violation) | Event timestamps | < 250 ms |
| CPU usage on nodes | Azure Monitor | < 80% |
| Event loss | Compare initial and final offsets | 0% |

## 4. Procedure

1. Deploy the system in a `poc-load` namespace.
2. Start the simulator with 200 threads (one per location).
3. Run for 1 hour, recording metrics every 10 seconds.
4. Upon completion, verify all events were consumed and there are no messages in the DLQ.
5. Measure the latency of the first 1000 tickets generated.

## 5. Expected Results (Simulated)

| Metric | Expected Value | Complies? |
|---------|----------------|----------|
| Maximum Throughput | 520 ev/sec | ✅ |
| HTTP error rate | 0.05% (due to momentary back-pressure) | ✅ |
| Maximum Lag | 3,200 messages | ✅ |
| p99 Latency | 210 ms | ✅ |
| Maximum CPU | 75% | ✅ |
| Loss | 0 | ✅ |

## 6. Corrective Actions if Not Met

- **High error rate**: Increase Ingestion replicas, review buffer.
- **Lag > 10,000**: Scale Violation Detector, increase Kafka partitions.
- **Latency > 500ms**: Review Identity query, implement cache.

## 7. Required Evidence

- Screenshots of Grafana showing metrics.
- Kafka offset logs.
- Record of tickets generated vs events received.

The POC will be executed in week 10 (after implementing M5) and its results will be attached to the final report.
