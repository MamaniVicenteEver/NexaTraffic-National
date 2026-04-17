# Polyglot Persistence Strategy

## 1. Justification for the Polyglot Approach

The Traffic Monitoring System (TMS) handles **four data types with very different characteristics**:

| Data Type | Volume | Access Pattern | Consistency Requirements | Required Latency |
|-----------|--------|----------------|--------------------------|------------------|
| Raw Events (sightings, weather) | 4M/day (peak 500 ev/sec) | Massive writes, almost no reads (only replay) | None (can be lost after processing) | Write: <10ms |
| Aggregated Metrics (traffic, historical weather) | 2M records/day (aggregated) | High writes, analytical reads (time ranges, aggregations) | Eventual consistency | Read: <200ms |
| Infractions and tickets | ~10,000/day (only those exceeding limit) | Transactional writes, exact reads by ID or plate | **Strong (ACID)**, legal immutability | Read/Write: <100ms |
| Plate → Owner relationships | 1M records (master) | Frequent reads (every infraction), infrequent writes | Strong (referential) | Read: <50ms (cache) |
| Trajectories (sequence of sightings) | 4M/day | Massive writes, range reads by plate and time | Eventual consistency, strict order | Read: <300ms |

**No single database engine** optimizes all these patterns simultaneously. Therefore, we adopt a **polyglot persistence** approach:

- **PostgreSQL** → Relational data with ACID (tickets, owners).
- **ClickHouse** → Time series for aggregated metrics (high insertion and query performance).
- **Redis** → Low-latency cache and deduplication.
- **Kafka** → Transient storage for raw events (7 days).
- **S3 / MinIO** (optional) → Evidence photo archive.

## 2. Engine 1: PostgreSQL (Transactional and Master Data)

### 2.1. Main Schema

```sql
-- Locations table (master)
CREATE TABLE locations (
    location_id INTEGER PRIMARY KEY,
    address TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    speed_limit_kph INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Owners table (encrypted PII)
CREATE TABLE owners (
    owner_id UUID PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    encrypted_phone TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Many-to-many relationship (one owner can have multiple vehicles)
CREATE TABLE vehicle_ownership (
    license_plate TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES owners(owner_id),
    is_primary BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (license_plate, owner_id)
);

-- Tickets table (immutable)
CREATE TABLE infraction_tickets (
    ticket_id TEXT PRIMARY KEY,
    license_plate TEXT NOT NULL,
    location_id INTEGER NOT NULL REFERENCES locations(location_id),
    speed_kph DECIMAL(5,1) NOT NULL,
    speed_limit_kph INTEGER NOT NULL,
    fine_amount DECIMAL(10,2) NOT NULL,
    currency CHAR(3) DEFAULT 'BOB',
    evidence_url TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING_NOTIFICATION', 'NOTIFIED', 'PAID', 'APPEALED')),
    created_at TIMESTAMP DEFAULT NOW(),
    notified_at TIMESTAMP,
    paid_at TIMESTAMP
);

-- Critical indexes
CREATE INDEX idx_tickets_plate ON infraction_tickets(license_plate);
CREATE INDEX idx_tickets_created ON infraction_tickets(created_at);
```

### 2.2. PostgreSQL Justification

- **ACID**: Necessary for infraction tickets (legal value, cannot be duplicated or lost).
- **Referential Integrity**: Locations and owners must exist before creating a ticket.
- **Transactions**: Creating a ticket involves writing to multiple tables (ticket, status log).
- **Maturity and backup tools**: PITR (Point-In-Time Recovery) for legal auditing.

### 2.3. Scaling Strategy

- **Read replica** for trajectory queries and dashboards.
- **Partitioning by year** in the `infraction_tickets` table (old fines are archived).
- **Connection pooling** (PgBouncer) to handle peaks of up to 200 connections.

## 3. Engine 2: ClickHouse (Time Series for Metrics)

### 3.1. Traffic Metrics Schema

```sql
CREATE TABLE traffic_metrics (
    location_id UInt32,
    hour DateTime,
    total_vehicles UInt32,
    unique_vehicles UInt32,
    avg_speed Float32,
    max_speed Float32,
    min_speed Float32
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (location_id, hour);
```

### 3.2. Weather Metrics Schema

```sql
CREATE TABLE weather_metrics (
    location_id UInt32,
    timestamp DateTime,
    temperature_celsius Float32,
    humidity_percent UInt8,
    precipitation Enum8('NONE'=0, 'RAIN'=1, 'SNOW'=2, 'HAIL'=3),
    wind_speed_kph Float32
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (location_id, timestamp);
```

### 3.3. ClickHouse Justification

- **Massive insertion**: Supports over 500,000 insertions/second (our peak is 500 events/second, comfortably).
- **Compression**: Reduces space up to 10 times (repetitive traffic data compresses well).
- **Fast analytical queries**: Averages, maximums, minimums per hour/day with latency < 100ms.
- **Partitioning by month**: Facilitates deletion of old data (TTL).

### 3.4. Retention Strategy

```sql
-- Delete traffic metrics older than 5 years
ALTER TABLE traffic_metrics MODIFY TTL hour + INTERVAL 5 YEAR;
-- Delete weather metrics older than 2 years
ALTER TABLE weather_metrics MODIFY TTL timestamp + INTERVAL 2 YEAR;
```

## 4. Engine 3: Redis (Cache and Deduplication)

### 4.1. Specific Uses

| Key | Type | TTL | Purpose |
|-----|------|-----|---------|
| `speed_limit:{locationId}` | String | Infinite (updated by event) | Speed limit cache for Violation Detector. |
| `owner:{licensePlate}` | Hash (email, name) | 24 hours | Owner cache for notifications. |
| `dedup:plate:{hour}:{licensePlate}` | Set (or String) | 1 hour | Deduplication of unique vehicles per hour (fixed window). |
| `sighting:processed:{eventId}` | String (bit) | 7 days | Idempotency in Kafka consumers. |

### 4.2. Redis Justification

- **Sub-millisecond latency** (< 1ms) for critical operations (deduplication check, limit reading).
- **Atomic operations** (SETNX, SISMEMBER) to avoid race conditions in deduplication.
- **Efficient data structures** (HyperLogLog for approximate unique counting, although we use exact set for precision).

### 4.3. Fault Tolerance

- **Redis Sentinel** or **Cluster** with replicas.
- If Redis fails, the system continues operating with degradation:
  - Unique vehicle deduplication is disabled (total is reported, not uniques).
  - Owner cache fails, queries go directly to PostgreSQL (slower but operational).

## 5. Engine 4: Apache Kafka (Transient Storage for Raw Events)

### 5.1. Topics and Retention

| Topic | Partitions | Retention | Purpose |
|-------|------------|-----------|---------|
| `vehicle-sightings` | 20 (by locationId) | 7 days | Raw sightings. |
| `weather-metrics` | 10 (by locationId) | 30 days | Weather data. |
| `infraction-tickets` | 5 (by ticketId) | 1 year | Fine events (for reprocessing). |
| `extreme-alerts` | 3 | 90 days | Weather alerts. |
| `dlq-*` | 1 | 30 days | Dead Letter Queue for failed events. |

### 5.2. Kafka as Storage Justification

- **Event replay**: If a consumer fails or a new version is deployed, it can reprocess from the last offset.
- **Temporary persistence**: Prevents event loss if the consumer is down.
- **Decoupling**: Producers do not need to know about consumers.

## 6. Optional Engine: Object Storage (S3 / MinIO) for Evidence

- **Use**: Store infraction photos (evidence). Each ticket has a URL `s3://nexatraffic/tickets/{ticketId}.jpg`.
- **Justification**: Images are large binaries (200KB-2MB), inefficient in SQL BLOBs. S3 offers low cost and high durability.
- **Retention policy**: Photos are kept while the ticket is active + 5 years (configurable with lifecycle).

## 7. Summary of Responsibilities by Data Type

| Data | Primary Engine | Secondary Engine (cache) | Retention |
|------|----------------|--------------------------|-----------|
| Raw Event (VehicleSighted) | Kafka (7d) | (none) | 7 days |
| Aggregated Traffic Metric | ClickHouse | (none) | 5 years |
| Infraction Ticket | PostgreSQL | Redis (status cache) | Indefinite |
| Owner (PII) | PostgreSQL | Redis (24h) | Indefinite (legal) |
| Trajectory (sequence) | PostgreSQL (JSON table) | (none) | 2 years |
| Photographic Evidence | S3/MinIO | Optional CDN | 5 years |

## 8. Cost and Operational Considerations

- **ClickHouse** requires machines with lots of RAM and SSD disk. 64GB RAM nodes are recommended to handle 5 years of data.
- **PostgreSQL** can run on more modest instances (16GB RAM) with a read replica.
- **Redis** in cluster mode (3 nodes) for high availability.
- **Kafka** with 3 brokers (replication factor=3) to avoid losing events.

The polyglot combination increases operational complexity, but it is the only way to simultaneously meet the latency, volume, and consistency requirements.
