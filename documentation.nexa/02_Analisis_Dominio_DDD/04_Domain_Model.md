# Modelo de Dominio: Entidades, Agregados, Value Objects y Eventos

## 1. Entidades

| Entidad | Identificador | Atributos clave | Contexto |
|---------|---------------|----------------|----------|
| `Vehicle` | `licensePlate` | (ninguno adicional, solo la placa) | Trayectorias, Ley, Identidad |
| `Location` | `locationId` | `speedLimitKph`, `address`, `coordinates` | Todos los contextos |
| `InfractionTicket` | `ticketId` | `licensePlate`, `locationId`, `speedKph`, `speedLimitKph`, `fineAmount`, `status`, `evidenceUrl`, `timestamp` | Aplicación de la Ley |
| `Owner` | `ownerId` | `name`, `email`, `licensePlates[]` | Identidad y Registro |

## 2. Agregados

| Agregado | Raíz | Entidades internas | Reglas de consistencia |
|----------|------|--------------------|------------------------|
| `TicketAggregate` | `InfractionTicket` | Ninguna | Una vez creado, el ticket es inmutable. Solo cambia de estado (notificado, pagado, impugnado). |
| `VehicleTrajectory` | `licensePlate` | Lista de `Sighting` (value object) | Los avistamientos se agregan en orden cronológico; no se pueden eliminar ni modificar. |

## 3. Value Objects

| Value Object | Atributos | Contexto de uso |
|--------------|-----------|-----------------|
| `Sighting` | `locationId`, `timestamp`, `speedKph` | Trayectorias |
| `Speed` | `value` (double), `unit` (KPH) | Ingesta, Ley |
| `Coordinates` | `latitude`, `longitude` | Ubicaciones |
| `WeatherReading` | `temperatureCelsius`, `humidityPercent`, `precipitation`, `windSpeedKph` | Ambiental |
| `Evidence` | `imageUrl`, `capturedAt` | Ley (dentro del ticket) |

## 4. Eventos de Dominio (con atributos clave)

| Evento | Atributos clave | Publicado por |
|--------|----------------|---------------|
| `VehicleSighted` | `eventId`, `locationId`, `licensePlate`, `speedKph`, `captureTimestamp` | Ingesta IoT |
| `WeatherMetricsRecorded` | `eventId`, `locationId`, `temperatureCelsius`, `humidityPercent`, `precipitation`, `measurementTimestamp` | Ingesta IoT |
| `PlateNotRecognized` | `eventId`, `locationId`, `captureTimestamp`, `imageUrl` (opcional) | Ingesta IoT |
| `SpeedLimitViolated` | `eventId`, `sightingId`, `licensePlate`, `locationId`, `speedKph`, `speedLimitKph`, `excessKph`, `violationTimestamp` | Aplicación de la Ley |
| `InfractionTicketCreated` | `eventId`, `ticketId`, `licensePlate`, `locationId`, `speedKph`, `speedLimitKph`, `fineAmount`, `currency`, `evidenceUrl`, `status` | Aplicación de la Ley |
| `ExtremeWeatherAlertTriggered` | `eventId`, `locationId`, `alertType`, `severity`, `value`, `threshold`, `message` | Ambiental |
| `OwnerNotifiedViaEmail` | `eventId`, `ticketId`, `ownerEmail`, `sentAt` | Notificaciones |

## 5. Reglas de Negocio (invariantes)

- **Infracción única**: Un mismo `sightingId` no puede generar más de un `InfractionTicketCreated`.
- **Inmutabilidad del ticket**: Una vez creado, `fineAmount` y `evidenceUrl` no cambian.
- **Límite de velocidad por ubicación**: Cada `Location` tiene un `speedLimitKph` que puede actualizarse (publicando evento `SpeedLimitUpdated`).