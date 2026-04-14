# Matriz de Riesgos Arquitectónicos

## 1. Metodología

Se identifican riesgos técnicos y de proyecto, se evalúa su probabilidad e impacto, y se definen mitigaciones. La matriz se revisa en cada hito.

## 2. Matriz de Riesgos

| ID | Riesgo | Probabilidad (1-5) | Impacto (1-5) | Prioridad | Mitigación | Responsable |
|----|--------|--------------------|---------------|-----------|-------------|-------------|
| R01 | Saturación de Kafka por pico de 500 eventos/segundo | 3 | 5 | Alta | Particionado correcto, back-pressure, autoescalado de consumidores, monitoreo de lag. | Arquitecto de datos |
| R02 | Pérdida de eventos por fallo de Kafka | 2 | 5 | Alta | Replicación factor 3, acks=all, configuración de retención, backups de topics críticos. | DevOps |
| R03 | Caída de PostgreSQL primario | 2 | 4 | Alta | Failover automático (HA zona redundante), buffer de tickets en Kafka, PITR. | DBA |
| R04 | Latencia excesiva en consulta de propietario (>500ms) | 3 | 3 | Media | Caché Redis (TTL 24h), circuit breaker, timeout de 500ms, réplica de lectura. | Backend |
| R05 | Duplicación de multas por falta de idempotencia | 2 | 5 | Alta | Tabla de processed_event_ids en Redis, verificación antes de procesar. | Backend |
| R06 | Escalado lento de pods (más de 5 minutos) | 2 | 3 | Media | Configurar HPA con métricas adecuadas, precalentar réplicas en horas punta. | DevOps |
| R07 | Fallo del registro vehicular externo | 3 | 4 | Alta | Circuit breaker, caché, estado PENDING_NOTIFICATION y reintentos batch. | Backend |
| R08 | Fuga de datos personales (PII) | 1 | 5 | Alta | Cifrado en tránsito (TLS), en reposo (AES-256), minimizar PII, auditoría. | Security |
| R09 | Complejidad operativa de ClickHouse self-hosted | 3 | 2 | Baja | Automatización de backups, monitorización, plan de migración a managed si crece. | DevOps |
| R10 | Desviación del cronograma por cambios de requisitos | 3 | 3 | Media | Sprints cortos, prototipado temprano, congelar requisitos en milestone 3. | Project Manager |

## 3. Plan de acción para riesgos críticos (prioridad alta)

- **R01 (Saturación Kafka)**: Realizar prueba de carga con 600 eventos/segundo antes del despliegue.
- **R02 (Pérdida eventos)**: Configurar monitoreo de offsets y alertas si el lag supera 10.000.
- **R04 (Latencia identidad)**: Implementar caché Redis y probar con simulación de fallo.
- **R07 (Registro externo caído)**: Ejecutar chaos test cortando conectividad al registro vehicular.

## 4. Seguimiento

La matriz se actualiza cada dos semanas durante la implementación. Los riesgos con prioridad alta requieren plan de mitigación detallado antes del inicio del sprint correspondiente.