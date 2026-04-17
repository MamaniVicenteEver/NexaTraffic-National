# Proposed Technology Stack for NexaTraffic

## 1. Overview

The following stack has been selected to meet the performance requirements (4M events/day, peak 500 ev/sec), elastic scalability, resilience, and optimized cost. Cloud-native open-source technologies with support are prioritized.

## 2. Technologies by Layer

### 2.1. Languages and Frameworks per Microservice

| Microservice | Language | Key Framework / Libraries | Justification |
|---------------|----------|----------------------------|----------------|
| **IoT Ingestion** | Go 1.21+ | Gorilla Mux (HTTP), Paho MQTT, Sarama (Kafka) | High concurrency, low CPU/memory consumption, excellent for I/O bound. |
| **Traffic Analysis** | Java 17 | Spring Boot 3, Kafka Streams, Redis Client | Mature ecosystem for stream processing, integration with ClickHouse. |
| **Trajectories** | Go 1.21+ | Gin (REST), pgx (PostgreSQL), Sarama | Fast reads and writes, efficient connection handling to DB. |
| **Environmental Monitoring** | Python 3.11 | FastAPI, aiokafka, SQLAlchemy | Rapid development, scientific libraries (pandas, numpy) for threshold detection. |
| **Law Enforcement** | Java 17 | Spring Boot, Resilience4j, gRPC, JPA | ACID transactions, circuit breaker, integration with Identity. |
| **Identity and Registry** | Java 17 | Spring Boot, gRPC, Spring Data JPA | Source of truth, requires high consistency and transactions. |
| **Notifications** | Node.js 20 | Express, nodemailer, KafkaJS | Efficient for asynchronous I/O (email sending). |

### 2.2. Infrastructure and Orchestration

| Component | Technology | Justification |
|------------|------------|----------------|
| **Orchestration** | Kubernetes (AKS - Azure Kubernetes Service) | Managed, Azure integration, auto-scaling, load balancing. |
| **Container runtime** | Docker + containerd | Standard, lightweight images. |
| **Image registry** | Azure Container Registry (ACR) | Secure storage close to AKS. |
| **Service mesh** | Istio (optional) or simple Ingress NGINX | For initial simplicity, NGINX Ingress is used; Istio would be added if granular mTLS is required. |

### 2.3. Storage and Messaging

| Type | Technology | Deployment | Justification |
|------|------------|------------|----------------|
| **Event Broker** | Apache Kafka (Confluent Cloud or Azure Event Hubs with Kafka API) | Managed (Azure Event Hubs) to reduce operational overhead | High availability, configurable retention, native integration with AKS. |
| **Relational Database** | PostgreSQL 16 (Azure Database for PostgreSQL Flexible Server) | Managed, high availability with zone redundancy | ACID, support for partitioning, low cost. |
| **Time Series Database** | ClickHouse (managed service by Altinity or self-hosted in AKS) | Self-hosted in AKS (for cost control) | Maximum compression and speed for metrics. |
| **Cache / Deduplication** | Redis 7 (Azure Cache for Redis) | Managed, standard tier with cluster | Low latency, optional persistence. |
| **Object Storage (Images)** | AWS S3 (or Azure Blob Storage) | AWS S3 for durability and low cost | Storage of photographic evidence (immutable). S3 with lifecycle will be used. |

### 2.4. CI/CD and Observability

| Tool | Purpose | Justification |
|-------------|-----------|----------------|
| **GitHub Actions** | CI/CD | Repository integration, declarative pipelines, low cost. |
| **Terraform** | Infrastructure as Code | Management of AKS, databases, networks. |
| **Prometheus + Grafana** | Metrics and dashboards | Cloud-native standard, exporters for Kafka, PostgreSQL, etc. |
| **Loki** | Log aggregation | Low cost, compatible with Grafana. |
| **Tempo (optional)** | Distributed traces | For latency debugging in critical flows. |

## 3. Cloud Decision: Azure (AKS) + AWS S3 for Images

### 3.1. Why Azure for Compute

| Factor | Azure (AKS) | AWS (EKS) | GCP (GKE) |
|--------|-------------|-----------|------------|
| **Cost per node** (3 nodes, D4s v3) | ~0.192 USD/hour | ~0.20 USD/hour | ~0.21 USD/hour |
| **Integration with managed PostgreSQL** | Excellent (Azure Database) | RDS (similar cost) | Cloud SQL (similar cost) |
| **Kafka Support** | Azure Event Hubs (Kafka API) | MSK (more expensive) | Confluent Cloud |
| **Suggested Region** | Brazil South (Sao Paulo) - low latency for Bolivia | N/A | N/A |

**Decision**: **Azure** is chosen for compute and relational/Redis databases due to better cost-benefit ratio in Latin America and ease of integration with open-source tools.

### 3.2. Why AWS S3 for Images

- **Durability**: 99.999999999% (11 nines).
- **Cost**: 0.023 USD/GB month (standard) vs Azure Blob Hot Tier 0.024 USD/GB.
- **Lifecycle**: Will be configured to move images to S3 Glacier Deep Archive after 1 year (cost 0.00099 USD/GB month).
- **Egress**: Images are served via CDN (CloudFront) to reduce transfer costs.

**Alternative** (if a single provider is preferred): Use Azure Blob Storage with lifecycle management (similar cost). Documented as an option, but S3 is maintained due to team preference.

## 4. Estimated Monthly Costs (Production Mode)

| Resource | Specification | Estimated Cost (USD/month) |
|---------|----------------|--------------------------|
| AKS (3 nodes D4s v3, 4 vCPU, 16GB RAM) | 720 hours | ~420 |
| Azure Database PostgreSQL (2 vCores, 50GB storage) | Flexible Server, HA | ~150 |
| Azure Cache for Redis (1GB, standard) | 2 replicas | ~60 |
| ClickHouse self-hosted in AKS (3 pods, shared resources) | within AKS nodes | 0 (included) |
| AWS S3 (100GB photos + 10GB metadata) | Standard + CDN | ~3 + 0.50 (requests) |
| Azure Event Hubs (Kafka) | 1 throughput unit (1 MB/s ingress) | ~50 |
| **Total estimated** | | **~683 USD/month** |

*Costs can be reduced using spot instances for non-critical loads (notification batch).*

## 5. Specific Optimizations

### 5.1. Image Optimization in S3

- **Format**: WebP (superior compression to JPEG). Automatic conversion in the `Evidence Packager`.
- **Dimensions**: Reduction to 1280x720 pixels (sufficient for license plate identification).
- **Lifecycle**:
  - 0-30 days: S3 Standard (frequent access for legal queries).
  - 30-365 days: S3 Standard-Infrequent Access (cost -50%).
  - Greater than 1 year: S3 Glacier Deep Archive (cost -95%).
- **CDN**: Amazon CloudFront with 7-day cache for recent ticket images.

### 5.2. Cost Optimization in AKS

- **Nodes**: Use `spot instances` for stateless services like `Traffic Analysis` and `Notifications` (savings 60-70%).
- **Autoscaling**: Scale to zero overnight (if demand allows) for test environments. In production, minimum 2 replicas.
- **Reservations**: Purchase 1-year reservations for system nodes (savings ~40%).

### 5.3. ClickHouse Optimization

- **Compression**: Use `ZSTD(3)` codec for metric tables (reduces space by 70%).
- **Partitioning**: By month; old data is moved to cold storage (e.g., S3 via ClickHouse S3 engine).

## 6. Summary of Justified Decisions

| Decision | Discarded Alternative | Reason |
|----------|------------------------|--------|
| Go for ingestion | Java (higher memory consumption) | Go handles higher concurrency with fewer resources. |
| Azure AKS | EKS, GKE | Regional cost and ease of managed PostgreSQL. |
| S3 for images | Azure Blob Storage | Slightly lower price and mature lifecycle tools. |
| Kafka (Event Hubs) | Self-managed in AKS | Reduces operational overhead; guaranteed HA. |
| ClickHouse self-hosted | ClickHouse Cloud | More economical for predictable volumes. |

This stack meets the scale, resilience, and cost requirements, allowing evolution towards serverless (Azure Functions) for low-load components in the future.
