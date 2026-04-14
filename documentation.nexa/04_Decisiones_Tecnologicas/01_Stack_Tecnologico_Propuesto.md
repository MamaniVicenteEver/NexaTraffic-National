# Stack Tecnológico Propuesto para NexaTraffic

## 1. Visión general

El siguiente stack ha sido seleccionado para cumplir con los requisitos de rendimiento (4M eventos/día, pico 500 ev/seg), escalabilidad elástica, resiliencia y costo optimizado. Se priorizan tecnologías de código abierto con soporte cloud nativo.

## 2. Tecnologías por capa

### 2.1. Lenguajes y frameworks por microservicio

| Microservicio | Lenguaje | Framework / Librerías clave | Justificación |
|---------------|----------|----------------------------|----------------|
| **Ingesta IoT** | Go 1.21+ | Gorilla Mux (HTTP), Paho MQTT, Sarama (Kafka) | Alta concurrencia, bajo consumo de CPU/memoria, excelente para I/O bound. |
| **Análisis de Tráfico** | Java 17 | Spring Boot 3, Kafka Streams, Redis Client | Ecosistema maduro para stream processing, integración con ClickHouse. |
| **Trayectorias** | Go 1.21+ | Gin (REST), pgx (PostgreSQL), Sarama | Lecturas y escrituras rápidas, manejo eficiente de conexiones a DB. |
| **Monitoreo Ambiental** | Python 3.11 | FastAPI, aiokafka, SQLAlchemy | Rapidez de desarrollo, bibliotecas científicas (pandas, numpy) para detección de umbrales. |
| **Aplicación de la Ley** | Java 17 | Spring Boot, Resilience4j, gRPC, JPA | Transaccionalidad ACID, circuit breaker, integración con Identity. |
| **Identidad y Registro** | Java 17 | Spring Boot, gRPC, Spring Data JPA | Fuente de verdad, requiere alta consistencia y transacciones. |
| **Notificaciones** | Node.js 20 | Express, nodemailer, KafkaJS | Eficiente para I/O asíncrono (envío de correos). |

### 2.2. Infraestructura y orquestación

| Componente | Tecnología | Justificación |
|------------|------------|----------------|
| **Orquestación** | Kubernetes (AKS - Azure Kubernetes Service) | Administrado, integración con Azure, escalado automático, balanceo de carga. |
| **Container runtime** | Docker + containerd | Estándar, imágenes ligeras. |
| **Registro de imágenes** | Azure Container Registry (ACR) | Almacenamiento seguro y cercano a AKS. |
| **Service mesh** | Istio (opcional) o simple Ingress NGINX | Por simplicidad inicial, se usa NGINX Ingress; Istio se añadiría si se requiere mTLS granular. |

### 2.3. Almacenamiento y mensajería

| Tipo | Tecnología | Despliegue | Justificación |
|------|------------|------------|----------------|
| **Broker de eventos** | Apache Kafka (Confluent Cloud o Azure Event Hubs con Kafka API) | Managed (Azure Event Hubs) para reducir overhead operativo | Alta disponibilidad, retención configurable, integración nativa con AKS. |
| **Base de datos relacional** | PostgreSQL 16 (Azure Database for PostgreSQL Flexible Server) | Managed, alta disponibilidad con zona redundante | ACID, soporte para particionamiento, bajo costo. |
| **Base de datos de series temporales** | ClickHouse (servicio administrado por Altinity o self-hosted en AKS) | Self-hosted en AKS (por control de costos) | Máxima compresión y velocidad para métricas. |
| **Caché / deduplicación** | Redis 7 (Azure Cache for Redis) | Managed, nivel estándar con clúster | Baja latencia, persistencia opcional. |
| **Almacenamiento de objetos (imágenes)** | AWS S3 (o Azure Blob Storage) | AWS S3 por durabilidad y bajo costo | Almacenamiento de evidencia fotográfica (inmutable). Se usará S3 con ciclo de vida. |

### 2.4. CI/CD y observabilidad

| Herramienta | Propósito | Justificación |
|-------------|-----------|----------------|
| **GitHub Actions** | CI/CD | Integración con repositorio, pipelines declarativos, bajo costo. |
| **Terraform** | Infraestructura como código | Gestión de AKS, bases de datos, redes. |
| **Prometheus + Grafana** | Métricas y dashboards | Estándar cloud-native, exportadores para Kafka, PostgreSQL, etc. |
| **Loki** | Agregación de logs | Bajo costo, compatible con Grafana. |
| **Tempo (opcional)** | Trazas distribuidas | Para debugging de latencia en flujos críticos. |

## 3. Decisión de nube: Azure (AKS) + AWS S3 para imágenes

### 3.1. Por qué Azure para computación

| Factor | Azure (AKS) | AWS (EKS) | GCP (GKE) |
|--------|-------------|-----------|------------|
| **Costo por nodo** (3 nodos, D4s v3) | ~0.192 USD/hora | ~0.20 USD/hora | ~0.21 USD/hora |
| **Integración con PostgreSQL managed** | Excelente (Azure Database) | RDS (costo similar) | Cloud SQL (costo similar) |
| **Soporte para Kafka** | Azure Event Hubs (Kafka API) | MSK (más caro) | Confluent Cloud |
| **Región sugerida** | Brazil South (Sao Paulo) - baja latencia para Bolivia | N/A | N/A |

**Decisión**: Se elige **Azure** para el cómputo y bases de datos relacionales/Redis por mejor relación costo-beneficio en Latinoamérica y facilidad de integración con herramientas de código abierto.

### 3.2. Por qué AWS S3 para imágenes

- **Durabilidad**: 99.999999999% (11 nueves).
- **Costo**: 0.023 USD/GB mes (estándar) vs Azure Blob Hot Tier 0.024 USD/GB.
- **Ciclo de vida**: Se configurará para mover imágenes a S3 Glacier Deep Archive después de 1 año (costo 0.00099 USD/GB mes).
- **Egreso**: Las imágenes se sirven vía CDN (CloudFront) para reducir costo de transferencia.

**Alternativa** (si se prefiere un solo proveedor): Usar Azure Blob Storage con lifecycle management (costo similar). Se documenta como opción, pero se mantiene S3 por preferencia del equipo.

## 4. Estimación de costos mensuales (modo producción)

| Recurso | Especificación | Costo estimado (USD/mes) |
|---------|----------------|--------------------------|
| AKS (3 nodos D4s v3, 4 vCPU, 16GB RAM) | 720 horas | ~420 |
| Azure Database PostgreSQL (2 vCores, 50GB almacenamiento) | Flexible Server, HA | ~150 |
| Azure Cache for Redis (1GB, estándar) | 2 réplicas | ~60 |
| ClickHouse self-hosted en AKS (3 pods, recursos compartidos) | dentro de los nodos AKS | 0 (incluido) |
| AWS S3 (100GB fotos + 10GB metadatos) | Standard + CDN | ~3 + 0.50 (requests) |
| Azure Event Hubs (Kafka) | 1 unidad de throughput (1 MB/s entrada) | ~50 |
| **Total estimado** | | **~683 USD/mes** |

*Los costos pueden reducirse usando instancias spot para cargas no críticas (batch de notificaciones).*

## 5. Optimizaciones específicas

### 5.1. Optimización de imágenes en S3

- **Formato**: WebP (compresión superior a JPEG). Conversión automática en el `Evidence Packager`.
- **Dimensiones**: Reducción a 1280x720 píxeles (suficiente para identificar placa).
- **Ciclo de vida**:
  - 0-30 días: S3 Standard (acceso frecuente para consultas legales).
  - 30-365 días: S3 Standard-Infrequent Access (costo -50%).
  - Mayor a 1 año: S3 Glacier Deep Archive (costo -95%).
- **CDN**: Amazon CloudFront con caché de 7 días para imágenes de tickets recientes.

### 5.2. Optimización de costos en AKS

- **Nodos**: Usar `spot instances` para servicios stateless como `Análisis de Tráfico` y `Notificaciones` (ahorro 60-70%).
- **Autoescalado**: Escalar a cero durante la noche (si la demanda lo permite) para entornos de prueba. En producción, mínimo 2 réplicas.
- **Reservas**: Comprar reservas de 1 año para nodos de sistema (ahorro ~40%).

### 5.3. Optimización de ClickHouse

- **Compresión**: Usar códec `ZSTD(3)` para tablas de métricas (reduce espacio 70%).
- **Particionamiento**: Por mes; datos antiguos se mueven a almacenamiento frío (ej. S3 mediante ClickHouse S3 engine).

## 6. Resumen de decisiones justificadas

| Decisión | Alternativa descartada | Razón |
|----------|------------------------|--------|
| Go para ingesta | Java (más consumo de memoria) | Go maneja mayor concurrencia con menos recursos. |
| Azure AKS | EKS, GKE | Costo regional y facilidad de PostgreSQL managed. |
| S3 para imágenes | Azure Blob Storage | Precio ligeramente menor y herramientas de ciclo de vida maduras. |
| Kafka (Event Hubs) | Auto-gestionado en AKS | Reduce overhead operativo; HA garantizada. |
| ClickHouse self-hosted | ClickHouse Cloud | Más económico para volúmenes predecibles. |

Este stack cumple con los requisitos de escala, resiliencia y costo, permitiendo evolucionar hacia serverless (Azure Functions) para componentes de baja carga en el futuro. 