# Análisis de Trade-offs y Disponibilidad

## 1. Requisito de disponibilidad

NexaTraffic debe tener **99.99% de disponibilidad** (tiempo de inactividad máximo ~52 minutos al año). Esto implica:
- Tolerancia a fallos de nodos, zonas y regiones.
- Recuperación automática ante fallos.
- Degradación controlada (no perder eventos críticos).

## 2. Trade-offs identificados

### 2.1. Consistencia fuerte vs Disponibilidad (Teorema CAP)

| Componente | Elección | Trade-off |
|------------|----------|-----------|
| Tickets de infracción | Consistencia fuerte (ACID) | Si PostgreSQL falla, no se pueden crear nuevos tickets hasta la recuperación (se bufferizan en Kafka). |
| Métricas de tráfico | Consistencia eventual | Se puede perder alguna métrica durante una caída de ClickHouse, pero se recalcula a partir de Kafka. |
| Caché de propietarios | Consistencia eventual | Un cambio en el registro vehicular puede tardar hasta 24h en reflejarse (aceptable). |

**Decisión**: Priorizar disponibilidad para métricas (eventual consistencia) y consistencia para tickets (prioridad legal).

### 2.2. Microservicios vs Monolito

| Aspecto | Microservicios | Monolito |
|---------|----------------|----------|
| Disponibilidad | Fallo aislado (ej. notificaciones caídas no afectan ingesta) | Fallo en un módulo puede colapsar todo. |
| Complejidad operativa | Alta (orquestación, red) | Baja |
| Tiempo de recuperación | Más rápido (reiniciar solo el servicio fallido) | Más lento (reinicio completo) |

**Trade-off asumido**: Mayor complejidad operativa a cambio de mejor disponibilidad y escalabilidad.

### 2.3. Base de datos poliglota vs una sola

| Aspecto | Políglota (3 motores) | Un solo motor (ej. PostgreSQL) |
|---------|----------------------|--------------------------------|
| Rendimiento para series temporales | Excelente (ClickHouse) | Pobre (consultas lentas, compresión baja) |
| Complejidad de respaldo | Alta (3 herramientas diferentes) | Baja |
| Disponibilidad | Cada motor tiene su propio plan de HA | Un único punto de fallo (si falla PostgreSQL, falla todo) |

**Decisión**: Políglota, pero con inversión en automatización de backups y failover.

### 2.4. Kafka (asíncrono) vs sincrónico para infracciones

- **Asíncrono**: Mayor disponibilidad (productor no espera), pero latencia no determinista.
- **Síncrono**: Menor disponibilidad (si el consumidor falla, el productor falla), pero latencia predecible.

**Trade-off**: Se usa asíncrono para ingesta y análisis, pero síncrono (gRPC) para la consulta de propietario porque la creación del ticket necesita el email de forma inmediata.

## 3. Arquitectura de alta disponibilidad por componente

### 3.1. Kubernetes (AKS)

- **Zonas de disponibilidad**: 3 zonas en la región Brazil South.
- **Nodos**: Distribuidos entre zonas (3 nodos sistema + réplicas de aplicaciones).
- **PodDisruptionBudget**: Mínimo 2 réplicas para cada microservicio crítico.

### 3.2. Kafka (Azure Event Hubs)

- **Unidades de throughput**: 2 activas, con autoescalado.
- **Geo-replicación**: Opcional, pero se configura retención en múltiples zonas dentro de la misma región.
- **Disponibilidad**: 99.95% garantizado por Azure (SLA).

### 3.3. PostgreSQL (Azure Database)

- **Modo de alta disponibilidad**: Zona redundante (standby automático en otra zona).
- **Failover**: Tiempo de conmutación < 60 segundos.
- **Backups**: PITR (hasta 35 días).

### 3.4. ClickHouse (self-hosted en AKS)

- **Replicación**: Factor 2, cada fragmento tiene una réplica en otra zona.
- **Recuperación**: Si un pod falla, Kubernetes lo reinicia; si un nodo falla, las réplicas asumen la carga.

### 3.5. Redis (Azure Cache)

- **Nivel**: Estándar con réplica (no hay failover automático, pero se recupera en pocos minutos).
- **Persistencia**: RDB cada 15 minutos.

### 3.6. S3 para imágenes

- **Durabilidad**: 11 nueves (99.999999999%).
- **Disponibilidad**: 99.99% para operaciones GET (SLA).
- **Failover**: Configurar réplica en otra región (opcional, coste extra).

## 4. Plan de recuperación ante desastres (DR)

| Escenario | RTO objetivo | RPO objetivo | Estrategia |
|-----------|--------------|--------------|------------|
| Falla de zona completa (AKS) | < 15 minutos | < 5 minutos | Kubernetes replica pods en otras zonas; el balanceador de carga redirige tráfico. |
| Caída de PostgreSQL primario | < 2 minutos | < 10 segundos | Failover automático a réplica secundaria (Azure Flexible Server). |
| Corrupción de datos en PostgreSQL | < 4 horas | 5 minutos (PITR) | Restaurar desde backup point-in-time. |
| Caída de Kafka (Event Hubs) | < 10 minutos | < 1 minuto | Microsoft garantiza recuperación automática; si es regional, usar geo-replicación (costo extra). |
| Pérdida de S3 | < 1 hora | 0 (inmutable) | Configurar versionado y replicación entre regiones. |

## 5. Degradación controlada (graceful degradation)

Cuando un componente falla, el sistema sigue operativo con funcionalidad reducida:

| Componente fallido | Funcionalidad afectada | Modo de degradación |
|--------------------|------------------------|----------------------|
| PostgreSQL | Tickets y propietarios | Nuevas infracciones se almacenan en Kafka (topic `pending-tickets`) y se procesan cuando PostgreSQL se recupera. |
| ClickHouse | Métricas históricas | Los dashboards muestran un mensaje "Datos temporales no disponibles". La ingesta y detección siguen normales. |
| Redis | Caché y deduplicación | La deduplicación de vehículos únicos se desactiva (se reportan totales no únicos). La caché de propietarios se consulta directamente a PostgreSQL (más lento). |
| Identity & Registry | Consulta de propietarios | Se usa la caché Redis (si está disponible) o se crea el ticket en estado `PENDING_NOTIFICATION` y se reintenta cada hora. |
| Kafka | Todo el flujo de eventos | Los sensores reintentan envíos con backoff; si Kafka no se recupera en 1 hora, se activa alerta crítica. |

## 6. Simulación de fallos y tiempos de recuperación (Chaos Testing)

Se realizan pruebas semanales en entorno de staging:

| Experimento | Tiempo de recuperación observado | Acción correctiva |
|-------------|----------------------------------|-------------------|
| Matar 2 de 3 nodos de PostgreSQL | 45 segundos | Aceptable (menor a 2 minutos). |
| Caída de zona de AKS (simulada) | 90 segundos (nodos reescalados) | Optimizar afinidad de pods. |
| Saturación de Kafka (5000 mensajes/segundo) | 2 minutos (escalado de Event Hubs) | Aumentar unidades de throughput automáticas. |
| Pérdida de paquete del 30% en red | 5 segundos (retransmisión TCP) | Sin cambios. |

## 7. Costos de la alta disponibilidad

| Componente | Configuración HA | Costo adicional mensual (vs sin HA) |
|------------|------------------|--------------------------------------|
| AKS (3 zonas, 3 nodos extra) | Nodos distribuidos, mínimo 2 réplicas por servicio | ~210 USD (50% más) |
| PostgreSQL (HA zona redundante) | 2 vCores, almacenamiento 50GB | +75 USD |
| Redis (réplica) | Estándar con réplica | +20 USD |
| Kafka (Event Hubs) | 2 unidades de throughput, geo-redundancia opcional | +30 USD |
| **Total HA adicional** | | **~335 USD/mes** |

**Costo base sin HA**: ~350 USD/mes → **con HA**: ~685 USD/mes (cumple 99.99% SLA).

## 8. Cumplimiento del SLA de 99.99%

- **Disponibilidad calculada**: (1 - (tiempo inactividad anual / 525600)) * 100.
- **Tiempo inactividad estimado por fallos**:
  - PostgreSQL failover: 1 minuto (cada 2 meses) → 6 minutos/año.
  - AKS zone failure: 2 minutos (cada 6 meses) → 4 minutos/año.
  - Kafka recovery: 5 minutos (cada 3 meses) → 20 minutos/año.
  - **Total**: 30 minutos/año → disponibilidad **99.994%** (supera 99.99%).

## 9. Decisiones finales y trade-offs asumidos

| Trade-off | Decisión | Justificación |
|-----------|----------|----------------|
| Mayor costo por HA vs riesgo de downtime | Aceptar costo adicional | Las multas no notificadas o pérdida de eventos tienen impacto legal y financiero mayor. |
| Complejidad de 3 bases de datos vs simplicidad | Aceptar complejidad | ClickHouse es indispensable para métricas; PostgreSQL para tickets. |
| Consistencia eventual en métricas vs disponibilidad | Priorizar disponibilidad | Los dashboards pueden mostrar datos ligeramente atrasados; la detección de infracciones es en tiempo real. |
| Self-hosted ClickHouse vs managed | Self-hosted para control de costos | El equipo tiene experiencia en Kubernetes; se automatizan backups. |

La arquitectura resultante cumple con el objetivo de 99.99% de disponibilidad con un costo razonable y degradación controlada ante fallos.