# Estrategia de Persistencia Políglota

## 1. Justificación del enfoque poliglota

El Sistema de Monitoreo de Tráfico (SMT) maneja **cuatro tipos de datos con características muy diferentes**:

| Tipo de dato | Volumen | Patrón de acceso | Requisitos de consistencia | Latencia requerida |
|--------------|---------|------------------|----------------------------|--------------------|
| Eventos crudos (avistamientos, clima) | 4M/día (pico 500 ev/seg) | Escritura masiva, lectura casi nula (solo replay) | Ninguna (se pueden perder después de procesados) | Escritura: <10ms |
| Métricas agregadas (tráfico, clima histórico) | 2M registros/día (agregados) | Escritura alta, lecturas analíticas (rangos de tiempo, agregaciones) | Consistencia eventual | Lectura: <200ms |
| Infracciones y tickets | ~10.000/día (solo las que exceden límite) | Escritura transaccional, lecturas exactas por ID o placa | **Fuerte (ACID)**, inmutabilidad legal | Lectura/escritura: <100ms |
| Relaciones placa → propietario | 1M registros (maestro) | Lecturas frecuentes (cada infracción), escrituras poco frecuentes | Fuerte (referencial) | Lectura: <50ms (caché) |
| Trayectorias (secuencia de avistamientos) | 4M/día | Escritura masiva, lecturas de rango por placa y tiempo | Consistencia eventual, orden estricto | Lectura: <300ms |

**Ningún motor de base de datos único** optimiza todos estos patrones simultáneamente. Por tanto, adoptamos una **persistencia poliglota**:

- **PostgreSQL** → Datos relacionales con ACID (tickets, propietarios).
- **ClickHouse** → Series temporales para métricas agregadas (alto rendimiento de inserción y consulta).
- **Redis** → Caché de baja latencia y deduplicación.
- **Kafka** → Almacenamiento transitorio de eventos crudos (7 días).
- **S3 / MinIO** (opcional) → Archivo de fotos de evidencia.

## 2. Motor 1: PostgreSQL (datos transaccionales y maestros)

### 2.1. Esquema principal

```sql
-- Tabla de ubicaciones (maestro)
CREATE TABLE locations (
    location_id INTEGER PRIMARY KEY,
    address TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    speed_limit_kph INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de propietarios (PII cifrada)
CREATE TABLE owners (
    owner_id UUID PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    encrypted_phone TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Relación muchos a muchos (un propietario puede tener varios vehículos)
CREATE TABLE vehicle_ownership (
    license_plate TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES owners(owner_id),
    is_primary BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (license_plate, owner_id)
);

-- Tabla de tickets (inmutable)
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

-- Índices críticos
CREATE INDEX idx_tickets_plate ON infraction_tickets(license_plate);
CREATE INDEX idx_tickets_created ON infraction_tickets(created_at);
```

### 2.2. Justificación de PostgreSQL

- **ACID**: Necesario para tickets de infracción (valor legal, no pueden duplicarse ni perderse).
- **Integridad referencial**: Las ubicaciones y propietarios deben existir antes de crear un ticket.
- **Transacciones**: La creación de un ticket implica escritura en varias tablas (ticket, log de estado).
- **Madurez y herramientas de respaldo**: PITR (Point-In-Time Recovery) para auditoría legal.

### 2.3. Estrategia de escalado

- **Réplica de lectura** para consultas de trayectoria y dashboards.
- **Particionamiento por año** en la tabla `infraction_tickets` (las multas antiguas se archivan).
- **Connection pooling** (PgBouncer) para manejar picos de hasta 200 conexiones.

## 3. Motor 2: ClickHouse (series temporales para métricas)

### 3.1. Esquema de métricas de tráfico

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

### 3.2. Esquema de métricas climáticas

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

### 3.3. Justificación de ClickHouse

- **Inserción masiva**: Soporta más de 500.000 inserciones/segundo (nuestro pico es 500 eventos/segundo, holgado).
- **Compresión**: Reduce espacio hasta 10 veces (los datos de tráfico repetitivos se comprimen bien).
- **Consultas analíticas rápidas**: Promedios, máximos, mínimos por hora/día con latencia < 100ms.
- **Particionamiento por mes**: Facilita la eliminación de datos antiguos (TTL).

### 3.4. Estrategia de retención

```sql
-- Eliminar métricas de tráfico más antiguas de 5 años
ALTER TABLE traffic_metrics MODIFY TTL hour + INTERVAL 5 YEAR;
-- Eliminar métricas climáticas más antiguas de 2 años
ALTER TABLE weather_metrics MODIFY TTL timestamp + INTERVAL 2 YEAR;
```

## 4. Motor 3: Redis (caché y deduplicación)

### 4.1. Usos específicos

| Clave | Tipo | TTL | Propósito |
|-------|------|-----|-----------|
| `speed_limit:{locationId}` | String | Infinito (se actualiza por evento) | Caché de límites de velocidad para Violation Detector. |
| `owner:{licensePlate}` | Hash (email, name) | 24 horas | Caché de propietarios para notificaciones. |
| `dedup:plate:{hour}:{licensePlate}` | Set (o String) | 1 hora | Deduplicación de vehículos únicos por hora (ventana fija). |
| `sighting:processed:{eventId}` | String (bit) | 7 días | Idempotencia en consumidores de Kafka. |

### 4.2. Justificación de Redis

- **Latencia submilisegundo** (< 1ms) para operaciones críticas (verificación de deduplicación, lectura de límites).
- **Operaciones atómicas** (SETNX, SISMEMBER) para evitar condiciones de carrera en deduplicación.
- **Estructuras de datos eficientes** (HyperLogLog para conteo aproximado de únicos, aunque usamos set exacto por precisión).

### 4.3. Tolerancia a fallos

- **Redis Sentinel** o **Cluster** con réplicas.
- Si Redis falla, el sistema sigue funcionando con degradación:
  - La deduplicación de vehículos únicos se desactiva (se reporta total, no únicos).
  - La caché de propietarios falla, se consulta directamente a PostgreSQL (más lento pero operativo).

## 5. Motor 4: Apache Kafka (almacenamiento transitorio de eventos crudos)

### 5.1. Topics y retención

| Topic | Particiones | Retención | Propósito |
|-------|-------------|-----------|-----------|
| `vehicle-sightings` | 20 (por locationId) | 7 días | Avistamientos crudos. |
| `weather-metrics` | 10 (por locationId) | 30 días | Datos climáticos. |
| `infraction-tickets` | 5 (por ticketId) | 1 año | Eventos de multas (para reprocesamiento). |
| `extreme-alerts` | 3 | 90 días | Alertas climáticas. |
| `dlq-*` | 1 | 30 días | Dead Letter Queue para eventos fallidos. |

### 5.2. Justificación de Kafka como almacenamiento

- **Replay de eventos**: Si un consumidor falla o se despliega una nueva versión, puede reprocesar desde el último offset.
- **Persistencia temporal**: Evita la pérdida de eventos si el consumidor está caído.
- **Desacoplamiento**: Los productores no necesitan conocer los consumidores.

## 6. Motor opcional: Almacenamiento de objetos (S3 / MinIO) para evidencias

- **Uso**: Guardar las fotos de infracción (evidencia). Cada ticket tiene una URL `s3://nexatraffic/tickets/{ticketId}.jpg`.
- **Justificación**: Las imágenes son binarias grandes (200KB-2MB), no eficientes en BLOB de SQL. S3 ofrece bajo costo y alta durabilidad.
- **Política de retención**: Las fotos se conservan mientras el ticket esté activo + 5 años (configurable con lifecycle).

## 7. Resumen de responsabilidades por tipo de dato

| Dato | Motor principal | Motor secundario (caché) | Retención |
|------|----------------|--------------------------|-----------|
| Evento crudo (VehicleSighted) | Kafka (7d) | (ninguno) | 7 días |
| Métrica agregada de tráfico | ClickHouse | (ninguno) | 5 años |
| Ticket de infracción | PostgreSQL | Redis (caché de estado) | Indefinido |
| Propietario (PII) | PostgreSQL | Redis (24h) | Indefinido (legal) |
| Trayectoria (secuencia) | PostgreSQL (tabla JSON) | (ninguno) | 2 años |
| Evidencia fotográfica | S3/MinIO | CDN opcional | 5 años |

## 8. Consideraciones de costo y operación

- **ClickHouse** requiere máquinas con mucha RAM y disco SSD. Se recomienda nodos de 64GB RAM para manejar 5 años de datos.
- **PostgreSQL** puede ejecutarse en instancias más modestas (16GB RAM) con réplica de lectura.
- **Redis** en modo cluster (3 nodos) para alta disponibilidad.
- **Kafka** con 3 brokers (replication factor=3) para no perder eventos.

La combinación poliglota aumenta la complejidad operativa, pero es la única forma de cumplir con los requisitos de latencia, volumen y consistencia simultáneamente.
