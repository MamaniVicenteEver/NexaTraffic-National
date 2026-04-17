# Domain Use Cases (Critical Flows)

## 1. Vehicle Sighting Ingestion

**Actor**: IoT Sensor / ANPR Camera  
**Flow**:
1. Sensor captures license plate, speed, and timestamp. Does not take a photo.
2. Sends raw payload to the Gateway.
3. Gateway normalizes and publishes `VehicleSighted`.

**Canonical event**:
```json
{
  "eventId": "veh-sight-123e4567",
  "eventType": "VehicleSighted",
  "timestamp": 1744567890123,
  "data": {
    "locationId": 45,
    "licensePlate": "ABC123",
    "speedKph": 95.5,
    "captureTimestamp": 1744567890000
  }
}
```

**Unreadable plate variant**:
```json
{
  "eventId": "plate-err-123e4567",
  "eventType": "PlateNotRecognized",
  "timestamp": 1744567890123,
  "data": {
    "locationId": 45,
    "captureTimestamp": 1744567890000,
    "imageUrl": "s3://nexatraffic/errors/45_1744567890.jpg"
  }
}
```

---

## 2. Speeding Violation Detection

**Actor**: System (automatic)  
**Flow**:
1. `Violation Detector` consumes `VehicleSighted`.
2. Compares `speedKph` with the location's speed limit.
3. If exceeded, publishes `SpeedLimitViolated`.
4. `Evidence Packager` requests the photo from the sensor and publishes `InfractionTicketCreated`.

**Intermediate event**:
```json
{
  "eventId": "viol-123e4567",
  "eventType": "SpeedLimitViolated",
  "timestamp": 1744567890123,
  "data": {
    "sightingId": "veh-sight-123e4567",
    "licensePlate": "ABC123",
    "locationId": 45,
    "speedKph": 95.5,
    "speedLimitKph": 80,
    "excessKph": 15.5,
    "violationTimestamp": 1744567890000
  }
}
```

**Final event (infraction)**:
```json
{
  "eventId": "ticket-123e4567",
  "eventType": "InfractionTicketCreated",
  "timestamp": 1744567895000,
  "data": {
    "ticketId": "INF-2025-000123",
    "licensePlate": "ABC123",
    "locationId": 45,
    "speedKph": 95.5,
    "speedLimitKph": 80,
    "fineAmount": 150.00,
    "currency": "BOB",
    "evidenceUrl": "s3://nexatraffic/tickets/INF-2025-000123.jpg",
    "status": "PENDING_NOTIFICATION"
  }
}
```

---

## 3. Weather Metrics Registration

**Actor**: Weather station  
**Flow**:
1. Station sends data every 5 minutes.
2. Gateway normalizes and publishes `WeatherMetricsRecorded`.

**Canonical event**:
```json
{
  "eventId": "weather-123e4567",
  "eventType": "WeatherMetricsRecorded",
  "timestamp": 1744567890123,
  "data": {
    "locationId": 45,
    "temperatureCelsius": 22.5,
    "humidityPercent": 78.0,
    "precipitation": "RAIN",
    "windSpeedKph": 15.2,
    "measurementTimestamp": 1744567800000
  }
}
```

---

## 4. Extreme Weather Alert

**Actor**: System (automatic)  
**Flow**:
1. `Extreme Weather Detector` evaluates `WeatherMetricsRecorded`.
2. If threshold is exceeded, publishes `ExtremeWeatherAlertTriggered`.
3. `Public Alert Broadcaster` sends alert to social networks / portal.

**Alert event**:
```json
{
  "eventId": "alert-123e4567",
  "eventType": "ExtremeWeatherAlertTriggered",
  "timestamp": 1744567890123,
  "data": {
    "locationId": 45,
    "alertType": "HEAVY_RAIN",
    "severity": "HIGH",
    "value": 55.2,
    "threshold": 50.0,
    "message": "Heavy rain in the eastern zone, risk of flooding."
  }
}
```

---

## 5. Vehicle Trajectory Query

**Actor**: SMT User (operator, police)  
**Flow** (read):
1. User enters license plate and date range.
2. System queries the trajectory store.
3. Returns an ordered list of locations.

**Example response**:
```json
{
  "licensePlate": "ABC123",
  "period": { "from": "2025-04-01T00:00:00Z", "to": "2025-04-07T23:59:59Z" },
  "trajectory": [
    { "locationId": 45, "timestamp": "2025-04-01T08:15:00Z", "speedKph": 60 },
    { "locationId": 78, "timestamp": "2025-04-01T09:45:00Z", "speedKph": 95 },
    { "locationId": 102, "timestamp": "2025-04-01T11:20:00Z", "speedKph": 110 }
  ]
}
```

---

## Final Note

These flows cover 100% of the SMT's functional requirements. The events and JSON structures define the immutable contracts between contexts. Implementation details (databases, APIs) and project management artifacts are not included.
