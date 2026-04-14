# Justificación del Estilo Cloud‑Native y Microservicios

## 1. Decisión Estratégica: Cloud‑Native frente a Lift & Shift

Se ha optado por una arquitectura **cloud‑native** (construida expresamente para la nube) en lugar de un simple “lift & shift” de un monolito tradicional. Esta decisión responde a los siguientes requisitos no funcionales del SMT:

- **Volumen masivo de datos**: 4 millones de eventos diarios (pico de 500 eventos/segundo).
- **Necesidad de escalado elástico**: la carga varía por hora (horas punta) y por ubicación.
- **Tolerancia a fallos**: el sistema no puede detener la ingesta aunque fallen servicios secundarios (notificaciones, reportes).
- **Evolución independiente**: las reglas de negocio (límites de velocidad, umbrales climáticos) cambian sin afectar la ingesta.

El enfoque cloud‑native permite explotar al máximo los principios de **microservicios**, **contenedores**, **orquestación (Kubernetes)** y **event‑driven architecture (EDA)**.

## 2. Microservicios frente a Monolito Modular

| Aspecto | Monolito Modular | Microservicios (elección) |
|---------|------------------|----------------------------|
| **Escalabilidad** | Escala completa (todas las funciones juntas). | Escala independiente por contexto (ej. más réplicas de ingesta, pocas de notificaciones). |
| **Tolerancia a fallos** | Un error en un módulo puede colapsar todo el proceso. | Fallo aislado: si falla el *Fine Manager*, la ingesta y detección siguen operando. |
| **Despliegue** | Se despliega todo el sistema cada vez. | Despliegue por microservicio (actualizar reglas de infracción sin reiniciar sensores). |
| **Curva de aprendizaje** | Menor complejidad inicial. | Mayor complejidad (red, descubrimiento, consistencia eventual). |
| **Rendimiento en alta carga** | Cuello de botella en base de datos compartida y recursos de cómputo. | Balanceo de carga por servicio, cada uno con su propia base de datos optimizada. |

**Conclusión**: para un sistema que debe procesar 500 eventos/segundo y garantizar 99.99% de disponibilidad, el desacoplamiento en microservicios es obligatorio.

## 3. Comunicación entre Microservicios

Se han definido dos patrones de comunicación, justificados por la naturaleza de cada interacción:

### 3.1 Comunicación Asíncrona (Event‑Driven) – **Patrón dominante**

- **Tecnología**: Apache Kafka (backbone de eventos).
- **Uso**: Publicación de `VehicleSighted`, `WeatherMetricsRecorded`, `InfractionTicketCreated`, `ExtremeWeatherAlertTriggered`.
- **Ventajas**:
  - Desacoplamiento temporal: el productor no espera al consumidor.
  - Resiliencia: si un consumidor falla, los eventos persisten en Kafka y se procesan al recuperarse.
  - Replay de eventos: se puede reprocesar históricos para regenerar estado.
  - Escalabilidad: múltiples consumidores compiten por particiones.

### 3.2 Comunicación Síncrona (Request/Response) – **Solo donde es inevitable**

- **Tecnología**: gRPC (con timeout y circuit breaker).
- **Uso**: Consulta de propietario desde `Law Enforcement` a `Identity & Registry` (necesita el correo electrónico para notificar la multa).
- **Justificación de excepción**: La creación de la infracción requiere el dato de contacto en el mismo flujo transaccional; no es aceptable la consistencia eventual porque la multa debe notificarse en un plazo breve.
- **Mitigación de fragilidad**: Caché Redis de 24h, circuit breaker, reintentos con backoff.

## 4. Principios Cloud‑Native aplicados (12‑Factor)

| Factor | Implementación en NexaTraffic |
|--------|-------------------------------|
| **I. Código base único** | Un repositorio por microservicio (o monorepo con despliegues independientes). |
| **II. Dependencias explícitas** | Gestión con Go modules / Maven / npm. |
| **III. Configuración externa** | Variables de entorno para conexiones a Kafka, PostgreSQL, ClickHouse, Redis. |
| **IV. Servicios de respaldo** | Kafka, bases de datos, registro vehicular externo tratados como recursos adjuntos. |
| **V. Build, release, run** | Separación estricta (Docker + CI/CD). |
| **VI. Stateless processes** | Todos los microservicios son stateless; el estado está en las bases de datos o en Kafka. |
| **VII. Binding de puertos** | Cada servicio expone un puerto HTTP/gRPC. |
| **VIII. Concurrencia** | Escalado horizontal mediante procesos (pods de Kubernetes). |
| **IX. Disposability** | Health checks (`/health`, `/ready`) y graceful shutdown (manejo de SIGTERM). |
| **X. Paridad dev/prod** | Entornos de desarrollo, staging y producción lo más similares posible (contenedores). |
| **XI. Logs** | Logs estructurados (JSON) a stdout, agregados con Loki/ELK. |
| **XII. Procesos admin** | Scripts de migración de base de datos y tareas de mantenimiento como procesos puntuales. |

## 5. Trade‑offs asumidos

- **Complejidad operativa**: Se necesita orquestación (Kubernetes), monitorización de Kafka y gestión de múltiples bases de datos.
- **Latencia de red**: La comunicación asíncrona añade latencia de milisegundos (aceptable para el dominio).
- **Consistencia eventual**: Las métricas de tráfico y trayectorias no requieren consistencia fuerte; las infracciones sí son inmediatas gracias a la consulta síncrona.
- **Curva de aprendizaje**: El equipo debe conocer DDD, Kafka y Kubernetes.

## 6. Conclusión

La combinación de **microservicios**, **EDA con Kafka** y **principios cloud‑native** es la única que satisface simultáneamente los requisitos de escala (4M eventos/día), resiliencia (99.99% disponibilidad) y evolución independiente del SMT. Los trade‑offs son manejables con las estrategias de resiliencia documentadas.