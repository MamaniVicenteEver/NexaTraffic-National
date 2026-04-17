# Domain Model: Entities, Aggregates, Value Objects, and Events

## 1. Entities

| Entity | Identifier | Key Attributes | Context |
|---------|---------------|----------------|----------|
| `Vehicle` | `licensePlate` | (none additional, only the license plate) | Trajectories, Law, Identity |
| `Location` | `locationId` | `speedLimitKph`, `address`, `coordinates` | All contexts |
| `InfractionTicket` | `ticketId` | `licensePlate`, `locationId`, `speedKph`, `speedLimitKph`, `fineAmount`, `status`, `evidenceUrl`, `timestamp` | Law Enforcement |
| `Owner` | `ownerId` | `name`, `email`, `licensePlates[]` | Identity and Registry |

## 2. Aggregates

| Aggregate | Root | Internal Entities | Consistency Rules |
|----------|------|--------------------|------------------------|
| `TicketAggregate` | `InfractionTicket` | None | Once created, the ticket is immutable. Only its status changes (notified, paid, contested). |
| `VehicleTrajectory` | `licensePlate` | List of `Sighting` (value object) | Sightings are added in chronological order; they cannot be deleted or modified. |

## 3. Value Objects

| Value Object | Attributes | Usage Context |
|--------------|-----------|-----------------|
| `Sighting` | `locationId`, `timestamp`, `speedKph` | Trajectories |
| `Speed` | `value` (double), `unit` (KPH) | Ingestion, Law |
| `Coordinates` | `latitude`, `longitude` | Locations |
| `WeatherReading` | `temperatureCelsius`, `humidityPercent`, `precipitation`, `windSpeedKph` | Environmental |
| `Evidence` | `imageUrl`, `capturedAt` | Law (within the ticket) |

## 4. Domain Events (with key attributes)

| Event | Key Attributes | Published By |
|--------|----------------|---------------|
| `VehicleSighted` | `eventId`, `locationId`, `licensePlate`, `speedKph`, `captureTimestamp` | IoT Ingestion |
| `WeatherMetricsRecorded` | `eventId`, `locationId`, `temperatureCelsius`, `humidityPercent`, `precipitation`, `measurementTimestamp` | IoT Ingestion |
| `PlateNotRecognized` | `eventId`, `locationId`, `captureTimestamp`, `imageUrl` (optional) | IoT Ingestion |
| `SpeedLimitViolated` | `eventId`, `sightingId`, `licensePlate`, `locationId`, `speedKph`, `speedLimitKph`, `excessKph`, `violationTimestamp` | Law Enforcement |
| `InfractionTicketCreated` | `eventId`, `ticketId`, `licensePlate`, `locationId`, `speedKph`, `speedLimitKph`, `fineAmount`, `currency`, `evidenceUrl`, `status` | Law Enforcement |
| `ExtremeWeatherAlertTriggered` | `eventId`, `locationId`, `alertType`, `severity`, `value`, `threshold`, `message` | Environmental |
| `OwnerNotifiedViaEmail` | `eventId`, `ticketId`, `ownerEmail`, `sentAt` | Notifications |

## 5. Business Rules (Invariants)

- **Unique Infraction**: The same `sightingId` cannot generate more than one `InfractionTicketCreated`.
- **Ticket Immutability**: Once created, `fineAmount` and `evidenceUrl` do not change.
- **Speed Limit per Location**: Each `Location` has a `speedLimitKph` that can be updated (publishing the `SpeedLimitUpdated` event).
