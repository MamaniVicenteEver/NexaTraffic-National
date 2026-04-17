# NexaTraffic System Overview

## 1. Problem Context

Modern vehicular traffic management and national road safety require a platform capable of processing massive volumes of data in real-time. Currently, the capture, aggregation, and analysis of vehicular and climate telemetry face critical challenges in scalability, heterogeneous integration, and fault tolerance.

The Traffic Monitoring System (TMS) must orchestrate information from **200 remote locations** distributed across the national territory. Each location generates an average of **20,000 vehicle records per day**, representing a constant flow of approximately **4 million daily events** (peaks of up to 500 events/second). Traditional monolithic systems cannot handle this throughput without incurring bottlenecks, excessive latency in violation generation, or loss of critical information.

## 2. Proposed Solution: NexaTraffic

NexaTraffic is a **Cloud-Native** platform designed for the ingestion, processing, and analysis of traffic telemetry and environmental variables in real-time. Built on the principles of the **12-Factor App methodology**, the architecture abandons "lift-and-shift" models in favor of a distributed ecosystem based on **microservices** and an **Event-Driven Architecture (EDA)**.

### 2.1 Value Proposition

The system bases its value on four architectural pillars:

1.  **Massive and Decoupled Ingestion**: Capability to receive incessant flows of IoT data (ANPR cameras, speed sensors, weather stations) ensuring traffic peaks do not saturate processing capabilities.
2.  **Real-Time Rule Processing**: Instantaneous evaluation of speed limits by location, generation of immutable violations, and automation of notifications to owners.
3.  **Geospatial and Historical Intelligence**: Algorithmic reconstruction of vehicle trajectories and visualization of traffic volume correlated with extreme weather conditions.
4.  **Operational Resilience**: Containerized and orchestrated architecture (Kubernetes) ensuring the failure of one component (e.g., reporting portal) does not stop the critical event logging flow.

### 2.2 Strategic Objectives

- **Performance**: Extreme latency < 200ms in the ingestion-violation detection pipeline.
- **Scalability**: Support for 15,400 concurrent users on dashboards and APIs.
- **Availability**: 99.99% uptime (four nines) through multi-zone replication.
- **Data Retention**: Storage of aggregated metrics for 5 years, raw events for 30 days.

## 3. Guiding Architectural Principles

- **Domain-Driven Design (DDD)** to delimit contexts and maintain a ubiquitous language.
- **Event-Driven Architecture** with Apache Kafka as the backbone for asynchronous messaging.
- **Statelessness** in all processing services.
- **External configuration** via environment variables (12-Factor).
- **Native Observability** with metrics, structured logs, and distributed tracing.

## 4. Relationship with Capstone Milestones

This overview supports the deliverables for Milestones 1 and 2 (system definition and high-level architecture). Functional and non-functional details are developed in the *Detailed Scope* document, and identified gaps are documented in the *Initial Proposal*.
