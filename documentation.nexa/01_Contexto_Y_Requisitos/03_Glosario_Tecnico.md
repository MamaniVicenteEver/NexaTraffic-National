# Glosario Técnico y de Negocio

Para asegurar la ubicuidad del lenguaje entre arquitectos, desarrolladores y expertos del dominio, se definen los siguientes términos aplicables a todo el proyecto NexaTraffic.

## Términos de Negocio (Dominio)

| Término | Definición |
|---------|-------------|
| **Ubicación Remota (Nodo)** | Punto geográfico específico en la red vial equipado con al menos un sensor de velocidad, una cámara ANPR y opcionalmente una estación meteorológica. Existen 200 nodos en el sistema. |
| **Avistamiento (Sighting)** | Registro temporal de un vehículo al pasar por una Ubicación Remota. Contiene mínimamente: placa, timestamp, velocidad instantánea y ubicación. |
| **Trayectoria (Trajectory)** | Colección cronológica de avistamientos asociados a una misma placa durante un período de tiempo. Permite reconstruir la ruta seguida por un vehículo. |
| **Infracción Inmutable** | Registro legal de un exceso de velocidad. Es inmutable porque una vez generado y empaquetado con su evidencia fotográfica (hash criptográfico), no puede ser alterado en la base de datos. |
| **Clima Extremo** | Estado derivado de la telemetría (temperatura < 0°C con precipitación, lluvia > 50 mm/h, etc.) que supera los umbrales de seguridad definidos para una ubicación. |
| **Ticket de Infracción** | Entidad que agrupa: placa, velocidad registrada, límite legal de la zona, fotografía, timestamp, ubicación y estado de notificación. |
| **Propietario Registrado** | Persona física o jurídica asociada a una placa en el Registro Vehicular Nacional. Es el destinatario de las notificaciones de multa. |

## Términos Arquitectónicos y Tecnológicos

| Término | Definición |
|---------|-------------|
| **Cloud-Native** | Enfoque de desarrollo que explota la computación en la nube para construir aplicaciones resilientes, escalables y observables, utilizando microservicios, contenedores, orquestación y declaración de estado. |
| **12-Factor App** | Metodología para construir aplicaciones como servicio (SaaS) que enfatiza: base de código única, dependencias declaradas, configuración externa, respaldos desacoplados, build/release/run estrictos, procesos stateless, binding de puertos, concurrencia, disposabilidad, paridad dev/prod, logs como flujo de eventos y procesos admin. |
| **Bounded Context (Contexto Delimitado)** | Frontera conceptual en DDD dentro de la cual un modelo de dominio particular es consistente y aplicable. Cada microservicio típicamente implementa un bounded context. |
| **Event-Driven Architecture (EDA)** | Patrón donde los componentes se comunican mediante la producción, detección y reacción a eventos de cambio de estado. Desacopla productores y consumidores. |
| **Anti-Corruption Layer (ACL)** | Capa de traducción que protege el modelo de dominio interno de la contaminación por modelos externos (ej. formatos propietarios de cámaras IoT). |
| **Time-Series Database (TSDB)** | Base de datos optimizada para almacenar y consultar datos indexados por tiempo (métricas de tráfico, clima). Ejemplos: ClickHouse, TimescaleDB, InfluxDB. |
| **Lag de Kafka** | Diferencia entre el desplazamiento (offset) más reciente producido en un topic y el offset consumido por un grupo de consumidores. Un lag alto indica cuello de botella en el procesamiento. |
| **Idempotencia** | Propiedad de una operación que puede aplicarse múltiples veces sin cambiar el resultado más allá de la primera aplicación. Crítica para evitar duplicados en procesamiento de eventos. |
| **Dead Letter Queue (DLQ)** | Topic de Kafka (o cola) donde se redirigen los eventos que no pueden ser procesados después de varios reintentos, para su análisis posterior sin bloquear el flujo principal. |
| **Back-pressure** | Mecanismo por el cual un sistema receptor indica al emisor que reduzca la tasa de envío cuando está saturado. En HTTP se implementa con códigos 429/503. |

## Siglas y Acrónimos

| Sigla | Significado |
|-------|-------------|
| ANPR | Automatic Number Plate Recognition (Reconocimiento Automático de Matrículas) |
| DDD | Domain-Driven Design |
| DLQ | Dead Letter Queue |
| EDA | Event-Driven Architecture |
| HPA | Horizontal Pod Autoscaler (Kubernetes) |
| IoT | Internet of Things |
| mTLS | Mutual Transport Layer Security |
| PII | Personally Identifiable Information |
| RPO | Recovery Point Objective |
| RTO | Recovery Time Objective |
| SMT | Sistema de Monitoreo de Tráfico |
| TSDB | Time-Series Database |