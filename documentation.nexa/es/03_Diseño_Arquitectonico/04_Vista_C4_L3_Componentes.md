# Vista C4 Nivel 3: Componentes Internos (PlantUML)

## 1. Descripción

El nivel 3 descompone un contenedor específico en sus componentes internos (clases, módulos, servicios). Para NexaTraffic, tomamos el contenedor **Aplicación de la Ley (Law Enforcement)** por ser el núcleo de la lógica de negocio más crítica. También se muestra un ejemplo de **Ingesta IoT**.

## 2. Diagrama de componentes de Law Enforcement (PlantUML)

```plantuml
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Component.puml

' Título
title Componentes Internos - Law Enforcement (Aplicación de la Ley)

' Contenedor padre
Container_Boundary(law_enforcement, "Law Enforcement Container") {

    ' Componentes internos
    Component(violation_detector, "Violation Detector", "Java + Kafka Consumer", "Consume VehicleSighted, evalúa límite de velocidad.")
    Component(speed_limit_cache, "Speed Limit Cache", "Caffeine / Redis", "Caché local de límites por ubicación, actualizada por eventos de configuración.")
    Component(evidence_packager, "Evidence Packager", "Java + Kafka Producer", "Genera ticket inmutable, solicita foto al sensor (si está disponible).")
    Component(fine_manager, "Fine Manager", "Java + gRPC Client", "Gestiona el ciclo de vida de la multa (estado: pendiente, notificada, pagada).")
    Component(ticket_repository, "Ticket Repository", "Spring Data JPA", "Persiste tickets en PostgreSQL.")
    Component(identity_client, "Identity Client", "gRPC + Circuit Breaker", "Consulta propietario por placa con resiliencia (timeout, reintentos).")
    Component(kafka_producer, "Kafka Producer", "Spring Kafka", "Publica InfractionTicketCreated hacia el bus de eventos.")
}

' Componentes externos al contenedor (sistemas o contenedores)
System_Ext(kafka, "Kafka Topic: vehicle-sightings")
System_Ext(identity_service, "Identity & Registry Container (gRPC)")
System_Ext(postgres_db, "PostgreSQL (tickets)")
System_Ext(config_kafka, "Kafka Topic: speed-limit-updated")
System_Ext(kafka_out, "Kafka Topic: infraction-tickets")

' Relaciones
Rel(violation_detector, speed_limit_cache, "Lee límite de velocidad", "en memoria")
Rel(violation_detector, kafka, "Consume VehicleSighted", "Kafka consumer")
Rel(violation_detector, evidence_packager, "Dispara (si violación)", "evento interno")

Rel(evidence_packager, fine_manager, "Delega creación de ticket", "llamada de método")
Rel(evidence_packager, kafka_producer, "Solicita publicación", "evento InfractionTicketCreated")

Rel(fine_manager, ticket_repository, "Persiste ticket", "JPA")
Rel(fine_manager, identity_client, "Obtiene propietario", "gRPC")

Rel(identity_client, identity_service, "Llama gRPC", "circuit breaker")
Rel(ticket_repository, postgres_db, "Escribe/lee", "JDBC")
Rel(kafka_producer, kafka_out, "Publica evento", "Kafka producer")

' Componente externo de configuración (actualiza caché)
Rel(config_kafka, speed_limit_cache, "Actualiza límite", "evento SpeedLimitUpdated")

@enduml
```

## 3. Explicación de cada componente (Law Enforcement)

| Componente | Responsabilidad | Tecnología | Estado |
|------------|----------------|------------|--------|
| **Violation Detector** | Consume `VehicleSighted`, compara velocidad con límite de la ubicación (desde caché). Si excede, emite un evento interno a Evidence Packager. | Kafka Consumer (Spring), caché Caffeine | Stateless |
| **Speed Limit Cache** | Mantiene en memoria los límites de velocidad por `locationId`. Se actualiza escuchando eventos `SpeedLimitUpdated` de Kafka. | Caffeine + Redis (fallback) | Stateful (efímero) |
| **Evidence Packager** | Recibe la violación, arma el ticket (ticketId, evidencia, foto opcional) y lo pasa al Fine Manager. | Java POJO | Stateless |
| **Fine Manager** | Orquesta la creación del ticket: asigna estado inicial, invoca Identity Client, persiste con Ticket Repository, y finalmente publica el evento. | Spring Service | Stateless |
| **Ticket Repository** | Capa de acceso a datos para tickets (JPA). Permite auditoría e inmutabilidad (solo escritura, no actualización). | Spring Data JPA | Stateless (conexión a DB) |
| **Identity Client** | Cliente gRPC resiliente: timeout 500ms, circuit breaker (Resilience4j), reintentos con backoff. | gRPC Stub + Resilience4j | Stateless |
| **Kafka Producer** | Publica `InfractionTicketCreated` al topic de salida para que Notificaciones lo consuma. | Spring Kafka | Stateless |

## 4. Diagrama de componentes de Ingesta IoT (PlantUML)

```plantuml
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Component.puml

title Componentes Internos - Ingesta IoT

Container_Boundary(ingestion, "Ingesta IoT Container") {

    Component(http_receiver, "HTTP/MQTT Receiver", "Go + Gorilla Mux / Paho MQTT", "Recibe payloads crudos de sensores.")
    Component(protocol_adapter, "Protocol Adapter", "Go", "Traduce formatos propietarios a canónico (Anti-Corruption Layer).")
    Component(validation, "Validator", "Go", "Valida campos obligatorios (placa, velocidad, timestamp).")
    Component(kafka_producer, "Kafka Producer", "Go (Sarama)", "Publica evento canónico en Kafka con idempotencia.")
    Component(backpressure, "Backpressure Controller", "Go + Channel buffer", "Limita la cola interna; devuelve 503 si está saturado.")
}

System_Ext(sensors, "Sensores IoT (200 ubicaciones)")
System_Ext(kafka, "Kafka Topics: vehicle-sightings, weather-metrics")

Rel(sensors, http_receiver, "Envía datos (MQTT/HTTP)", "JSON binario")
Rel(http_receiver, backpressure, "Pasa payload si hay capacidad", "canal interno")
Rel(backpressure, protocol_adapter, "Entrega payload", "llamada")
Rel(protocol_adapter, validation, "Normaliza y valida", "estructura canónica")
Rel(validation, kafka_producer, "Envía evento validado", "llamada")
Rel(kafka_producer, kafka, "Publica", "Kafka producer con acks=all")

' Nota de backpressure
Note on backpressure : Si la cola interna > 1000 mensajes, el Receiver responde HTTP 503.
@enduml
```

## 5. Explicación de componentes de Ingesta IoT

| Componente | Responsabilidad | Tecnología | Notas |
|------------|----------------|------------|-------|
| **HTTP/MQTT Receiver** | Expone endpoints para que los sensores envíen datos. Soporta reintentos. | Go + Gorilla Mux / Paho MQTT | Stateless |
| **Backpressure Controller** | Buffer limitado (cola circular). Si se llena, el Receiver devuelve 503 Service Unavailable. | Go channel | Stateful (memoria) |
| **Protocol Adapter** | Traduce formatos de distintos fabricantes (Hikvision, Axis, etc.) al modelo canónico. | Go | Stateless (ACL) |
| **Validator** | Verifica que los campos requeridos no sean nulos, rangos de velocidad, formato de placa. | Go | Stateless |
| **Kafka Producer** | Publica el evento normalizado con idempotencia (enable.idempotence=true). | Sarama | Stateless |

## 6. Flujo de datos completo (Law Enforcement)

1. `VehicleSighted` llega a Kafka topic `vehicle-sightings`.
2. `Violation Detector` consume el evento.
3. Consulta `Speed Limit Cache` para obtener el límite de la ubicación.
4. Si `speed > limit`, se activa `Evidence Packager`.
5. `Evidence Packager` construye el ticket y llama a `Fine Manager`.
6. `Fine Manager` invoca `Identity Client` para obtener el email del propietario (con circuit breaker y caché Redis).
7. Persiste el ticket en PostgreSQL mediante `Ticket Repository`.
8. Publica `InfractionTicketCreated` a Kafka mediante `Kafka Producer`.
9. Notificaciones consumirá ese evento para enviar el correo.

## 7. Resumen de decisiones de diseño en componentes

- **Inmutabilidad del ticket**: Una vez persistido, no se puede modificar. Cualquier cambio de estado (pagado, impugnado) es un nuevo evento.
- **Caché de límites de velocidad**: Se actualiza mediante eventos `SpeedLimitUpdated` para evitar consultas a base de datos en cada detección.
- **Backpressure en ingesta**: Protege a Kafka de picos masivos; los sensores deben reintentar con backoff exponencial.
- **Circuit breaker en Identity Client**: Evita que fallos en el registro vehicular bloqueen la generación de multas; fallback a caché o estado pendiente.
