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
- [Vision Overview](https://github.com/MamaniVicenteEver/NexaTraffic-National/blob/main/documentation.nexa/en/01_Contexto_Y_Requisitos/01_Vision_General.md) – Strategic context and objectives.
- [Detailed Scope](https://github.com/MamaniVicenteEver/NexaTraffic-National/blob/main/documentation.nexa/en/01_Contexto_Y_Requisitos/02_Alcance_Detallado.md) – Features, boundaries, and assumptions.
- [Technical Glossary](https://github.com/MamaniVicenteEver/NexaTraffic-National/blob/main/documentation.nexa/en/01_Contexto_Y_Requisitos/03_Glosario_Tecnico.md) – Domain definitions and terminology.
- [Initial Proposal and Gaps](https://github.com/MamaniVicenteEver/NexaTraffic-National/blob/main/documentation.nexa/en/01_Contexto_Y_Requisitos/04_Propuesta_Inicial.md) – Uncertainty analysis and mitigations.

### 02 Domain Analysis (DDD)
- [Event Storming](https://github.com/MamaniVicenteEver/NexaTraffic-National/blob/main/documentation.nexa/en/02_Analisis_Dominio_DDD/01_Event_Storming.md) – Business event timeline.
- [Bounded Contexts](https://github.com/MamaniVicenteEver/NexaTraffic-National/blob/main/documentation.nexa/en/02_Analisis_Dominio_DDD/02_Bounded_Contexts.md) – System decomposition into bounded contexts.
- [Context Map](https://github.com/MamaniVicenteEver/NexaTraffic-National/blob/main/documentation.nexa/en/02_Analisis_Dominio_DDD/03_Context_Map.md) – Relationships and protocols between contexts.
- [Domain Model](https://github.com/MamaniVicenteEver/NexaTraffic-National/blob/main/documentation.nexa/en/02_Analisis_Dominio_DDD/04_Domain_Model.md) – Entities, aggregates, value objects, and events.
- [Domain Use Cases](https://github.com/MamaniVicenteEver/NexaTraffic-National/blob/main/documentation.nexa/en/02_Analisis_Dominio_DDD/05_Domain_Use_Cases.md) – Critical flows with canonical JSON.

### 03 Architectural Design
- [Cloud‑Native Justification](https://github.com/MamaniVicenteEver/NexaTraffic-National/blob/main/documentation.nexa/en/03_Diseño_Arquitectonico/01_Justificacion_Estilo_Cloud_Native.md) – Microservices vs. monolith, EDA, 12‑factor.
- [C4 Level 1: Context](https://github.com/MamaniVicenteEver/NexaTraffic-National/blob/main/documentation.nexa/en/03_Diseño_Arquitectonico/02_Vista_C4_L1_Contexto.md) – External interactions (PlantUML).
- [C4 Level 2: Containers](https://github.com/MamaniVicenteEver/NexaTraffic-National/blob/main/documentation.nexa/en/03_Diseño_Arquitectonico/03_Vista_C4_L2_Contenedores.md) – Distributed infrastructure (PlantUML).
- [C4 Level 3: Components](https://github.com/MamaniVicenteEver/NexaTraffic-National/blob/main/documentation.nexa/en/03_Diseño_Arquitectonico/04_Vista_C4_L3_Componentes.md) – Internal service logic (PlantUML).
- [Kafka Sequence Diagrams](https://github.com/MamaniVicenteEver/NexaTraffic-National/blob/main/documentation.nexa/en/03_Diseño_Arquitectonico/05_Diagramas_Secuencia_Kafka_Flows.md) – Asynchronous flows.
- [Polyglot Persistence](https://github.com/MamaniVicenteEver/NexaTraffic-National/blob/main/documentation.nexa/en/03_Diseño_Arquitectonico/06_Estrategia_Persistencia_Poliglota.md) – Storage strategy.
- [Resilience & Back‑pressure](https://github.com/MamaniVicenteEver/NexaTraffic-National/blob/main/documentation.nexa/en/03_Diseño_Arquitectonico/07_Estrategia_Resiliencia_Backpressure.md) – Fault tolerance and flow control.

### 04 Technology Decisions
- [Proposed Tech Stack](https://github.com/MamaniVicenteEver/NexaTraffic-National/blob/main/documentation.nexa/en/04_Decisiones_Tecnologicas/01_Stack_Tecnologico_Propuesto.md) – Languages, frameworks, infrastructure, and costs.
- [Elastic Scalability](https://github.com/MamaniVicenteEver/NexaTraffic-National/blob/main/documentation.nexa/en/04_Decisiones_Tecnologicas/02_Estrategia_Escalabilidad_Elastic.md) – Autoscaling policies and KEDA.
- [Trade‑offs & Availability](https://github.com/MamaniVicenteEver/NexaTraffic-National/blob/main/documentation.nexa/en/04_Decisiones_Tecnologicas/03_Analisis_Trade_offs_Disponibilidad.md) – CAP analysis, HA, graceful degradation.

### 05 Management & Operations
- [Risk Matrix](https://github.com/MamaniVicenteEver/NexaTraffic-National/blob/main/documentation.nexa/en/05_Gestion_Y_Operacion/01_Matriz_de_Riesgos_Arquitectonicos.md) – Risk identification and mitigation.
- [Implementation Timeline](https://github.com/MamaniVicenteEver/NexaTraffic-National/blob/main/documentation.nexa/en/05_Gestion_Y_Operacion/02_Cronograma_Implementacion_Fases.md) – 7 weeks + demo.
- [POC Validation](https://github.com/MamaniVicenteEver/NexaTraffic-National/blob/main/documentation.nexa/en/05_Gestion_Y_Operacion/03_Validacion_POC_Ingesta_Masiva.md) – Simulated load tests.
- [CI/CD & AI Reflection](https://github.com/MamaniVicenteEver/NexaTraffic-National/blob/main/documentation.nexa/en/05_Gestion_Y_Operacion/04_CI_CD_y_Reflexion_IA.md) – GitHub Actions pipeline and AI usage.

### Final Conclusions
- [Conclusions & Reflection](https://github.com/MamaniVicenteEver/NexaTraffic-National/blob/main/documentation.nexa/en/07_Conclusiones.md) – Summary, trade‑offs, limitations, and lessons learned.

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
