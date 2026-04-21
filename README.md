# NexaTraffic: National Smart Grid & Traffic Monitoring System

<div style="display: flex; justify-content: center; gap: 10px;">
  <img style="width: 45%; aspect-ratio: 4/3; object-fit: cover;" alt="NexaTraffic System Overview" src="documentation.nexa/assets/img4.png" />
  <img style="width: 45%; aspect-ratio: 4/3; object-fit: cover;" alt="NexaTraffic Architecture Map" src="documentation.nexa/assets/img2.png" />
</div>

<div align="center">
  <img src="https://img.shields.io/badge/Architecture-Cloud--Native-0055FF" alt="Cloud Native" />
  <img src="https://img.shields.io/badge/Backbone-Apache_Kafka-EB1C24" alt="Kafka" />
  <img src="https://img.shields.io/badge/Language-Go_%7C_Java-00ADD8" alt="Languages" />
  <img src="https://img.shields.io/badge/Orchestration-Kubernetes-326CE5" alt="Kubernetes" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL_%7C_ClickHouse-336791" alt="Databases" />
  <img src="https://img.shields.io/badge/Design-DDD-6DB33F" alt="DDD" />
</div>

## Overview

NexaTraffic is a high‑performance national traffic monitoring platform designed for intelligent urban mobility management. The system integrates telemetry from 200 remote locations, processing an average of 4 million daily vehicle events through a distributed event‑driven architecture.

The solution guarantees elastic scalability, fault tolerance, and real‑time processing for violation detection, trajectory tracking, and weather analysis.

## Dashboard Preview (Mockup)

Below are two screenshots of the administrative dashboard under development. The first shows a system overview with key indicators and a heat map; the second illustrates the real‑time violation monitoring section.

<div align="center">
  <img width="100%" alt="Dashboard overview" src="https://github.com/user-attachments/assets/00c71a61-948c-4dc9-8e20-0de4a1cdefef" />
  <img width="100%" alt="Violations section" src="https://github.com/user-attachments/assets/8abeea1d-b57b-40e9-93bd-28b35cba15c0" />
</div>

*These images are representative of the current prototype and will be refined during the final implementation.*

## Architecture Documentation

Select a section to explore the technical details of the system.

### 01 Context and Requirements

- [Vision Overview](./01_Vision_Overview.md) – Strategic context and objectives.
- [Detailed Scope](./02_Detailed_Scope.md) – Features, boundaries, and assumptions.
- [Technical Glossary](./03_Technical_Glossary.md) – Domain definitions and terminology.
- [Initial Proposal and Gaps](./04_Initial_Proposal_and_Gaps.md) – Uncertainty analysis and mitigations.

### 02 Domain Analysis (DDD)

- [Event Storming](../02_Domain_Analysis_DDD/01_Event_Storming.md) – Business event timeline.
- [Bounded Contexts](../02_Domain_Analysis_DDD/02_Bounded_Contexts.md) – System decomposition into bounded contexts.
- [Context Map](../02_Domain_Analysis_DDD/03_Context_Map.md) – Relationships and protocols between contexts.
- [Domain Model](../02_Domain_Analysis_DDD/04_Domain_Model.md) – Entities, aggregates, value objects, and events.
- [Domain Use Cases](../02_Domain_Analysis_DDD/05_Domain_Use_Cases.md) – Critical flows with canonical JSON.

### 03 Architectural Design

- [Cloud‑Native Justification](../03_Architectural_Design/01_Cloud_Native_Justification.md) – Microservices vs. monolith, EDA, 12‑factor.
- [C4 Level 1: Context](../03_Architectural_Design/02_C4_Level1_Context.md) – External interactions (PlantUML).
- [C4 Level 2: Containers](../03_Architectural_Design/03_C4_Level2_Containers.md) – Distributed infrastructure (PlantUML).
- [C4 Level 3: Components](../03_Architectural_Design/04_C4_Level3_Components.md) – Internal service logic (PlantUML).
- [Kafka Sequence Diagrams](../03_Architectural_Design/05_Kafka_Sequence_Diagrams.md) – Asynchronous flows.
- [Polyglot Persistence](../03_Architectural_Design/06_Polyglot_Persistence_Strategy.md) – Storage strategy.
- [Resilience & Back‑pressure](../03_Architectural_Design/07_Resilience_Backpressure_Strategy.md) – Fault tolerance and flow control.

### 04 Technology Decisions

- [Proposed Tech Stack](../04_Technology_Decisions/01_Proposed_Technology_Stack.md) – Languages, frameworks, infrastructure, and costs.
- [Elastic Scalability](../04_Technology_Decisions/02_Elastic_Scalability_Strategy.md) – Autoscaling policies and KEDA.
- [Trade‑offs & Availability](../04_Technology_Decisions/03_Tradeoffs_Availability_Analysis.md) – CAP analysis, HA, graceful degradation.

### 05 Management & Operations

- [Risk Matrix](../05_Management_and_Operations/01_Risk_Matrix.md) – Risk identification and mitigation.
- [Implementation Timeline](../05_Management_and_Operations/02_Implementation_Timeline.md) – 7 weeks + demo.
- [POC Validation](../05_Management_and_Operations/03_POC_Validation.md) – Simulated load tests.
- [CI/CD & AI Reflection](../05_Management_and_Operations/04_CICD_AI_Reflection.md) – GitHub Actions pipeline and AI usage.

### Final Conclusions

- [Conclusions & Reflection](../07_Conclusions.md) – Summary, trade‑offs, limitations, and lessons learned.
---

## Key Quality Attributes

| Attribute         | Target Metric       | Strategy                                               |
| ----------------- | ------------------- | ------------------------------------------------------ |
| **Performance**   | Latency < 200ms     | In‑memory processing with Redis and Go.                |
| **Scalability**   | 15,400+ Users       | Kubernetes orchestration and auto‑scaling.             |
| **Availability**  | 99.99%              | Multi‑region architecture and fault isolation.         |

## Technology Stack

- **Backend:** Java Spring Boot (transactional services) and Go (high‑throughput ingestion).
- **Messaging:** Apache Kafka (event streaming backbone).
- **Persistence:** PostgreSQL (relational data), ClickHouse (massive analytics), Redis (cache).
- **Infrastructure:** Docker, Kubernetes, Helm.
- **Analytics:** Python (traffic data modeling).

---

**Author:** Ever Mamani Vicente  
**Project:** Capstone - Software Architecture 4  
**Institution:** Universidad Jala  
**Date:** April 2026
