# Casos de Uso de Dominio (Flujos Críticos)

## 1. Ingesta de Avistamiento Vehicular

**Actor**: Sensor IoT / Cámara ANPR  
**Flujo**:
1. Sensor captura placa, velocidad y timestamp. No toma foto.
2. Envía payload crudo al Gateway.
3. Gateway normaliza y publica `VehicleSighted`.

**Evento canónico**:
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

**Variante placa no legible**:
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

## 2. Detección de Infracción por Exceso de Velocidad

**Actor**: Sistema (automático)  
**Flujo**:
1. `Violation Detector` consume `VehicleSighted`.
2. Compara `speedKph` con el límite de la ubicación.
3. Si excede, publica `SpeedLimitViolated`.
4. `Evidence Packager` solicita la foto al sensor y publica `InfractionTicketCreated`.

**Evento intermedio**:
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

**Evento final (infracción)**:
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

## 3. Registro de Métricas Climáticas

**Actor**: Estación meteorológica  
**Flujo**:
1. Estación envía datos cada 5 minutos.
2. Gateway normaliza y publica `WeatherMetricsRecorded`.

**Evento canónico**:
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

## 4. Alerta por Clima Extremo

**Actor**: Sistema (automático)  
**Flujo**:
1. `Extreme Weather Detector` evalúa `WeatherMetricsRecorded`.
2. Si supera umbral, publica `ExtremeWeatherAlertTriggered`.
3. `Public Alert Broadcaster` envía alerta a redes sociales / portal.

**Evento de alerta**:
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
    "message": "Lluvia intensa en zona este, riesgo de inundaciones."
  }
}
```

---

## 5. Consulta de Trayectoria de Vehículo

**Actor**: Usuario del SMT (operador, policía)  
**Flujo** (lectura):
1. Usuario ingresa placa y rango de fechas.
2. Sistema consulta almacén de trayectorias.
3. Devuelve lista ordenada de ubicaciones.

**Ejemplo de respuesta**:
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

## Nota final

Estos flujos cubren el 100% de los requisitos funcionales del SMT. Los eventos y estructuras JSON definen los contratos inmutables entre contextos. No se incluyen detalles de implementación (bases de datos, APIs) ni artefactos de gestión de proyectos.
```