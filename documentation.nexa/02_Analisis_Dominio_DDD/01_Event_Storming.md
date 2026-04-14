# Event Storming: Eventos de Dominio, Comandos y Actores

## 1. Propósito

Este documento captura los eventos de dominio más importantes del Sistema de Monitoreo de Tráfico (SMT), junto con los comandos que los desencadenan y los actores involucrados. Se presenta una línea de tiempo de negocio que muestra cómo fluyen los eventos a través del sistema.

## 2. Eventos de Dominio, Comandos y Actores

| Evento de Dominio | Comando (Causa) | Actor (Quién/Qué) |
|-------------------|----------------|-------------------|
| `VehicleSighted` | `RecordVehiclePass` | Sensor IoT / Cámara ANPR |
| `WeatherMetricsRecorded` | `ReportWeather` | Estación meteorológica |
| `PlateNotRecognized` | `RecordPlateError` | Sensor IoT (fallo de OCR) |
| `SpeedLimitViolated` | `CheckSpeedLimit` | Violation Detector (sistema) |
| `InfractionTicketCreated` | `CreateInfractionTicket` | Evidence Packager (sistema) |
| `ExtremeWeatherAlertTriggered` | `EvaluateWeatherThresholds` | Extreme Weather Detector (sistema) |
| `OwnerNotifiedViaEmail` | `SendFineEmail` | Fine Email Dispatcher (sistema) |
| `PublicAlertBroadcasted` | `PublishAlertToSocialMedia` | Public Alert Broadcaster (sistema) |

## 3. Línea de Tiempo de Negocio (Flujo Principal)

1. **Sensor detecta vehículo** → comando `RecordVehiclePass` → evento `VehicleSighted`.
2. **Violation Detector** consume `VehicleSighted` → comando `CheckSpeedLimit` → si excede límite: evento `SpeedLimitViolated`.
3. **Evidence Packager** reacciona a `SpeedLimitViolated` → comando `CreateInfractionTicket` → evento `InfractionTicketCreated`.
4. **Fine Email Dispatcher** consume `InfractionTicketCreated` → comando `SendFineEmail` → evento `OwnerNotifiedViaEmail`.
5. **Paralelamente**: Estación climática → `ReportWeather` → `WeatherMetricsRecorded` → si umbral superado → `ExtremeWeatherAlertTriggered` → `PublicAlertBroadcasted`.

## 4. Nota sobre el Flujo Asíncrono

Todos los eventos se publican en Apache Kafka. Los comandos son internos a cada contexto y no se exponen al bus global. Esto garantiza desacoplamiento y resiliencia.