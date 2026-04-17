# Event Storming: Domain Events, Commands, and Actors

## 1. Purpose

This document captures the most important domain events of the Traffic Monitoring System (TMS), along with the commands that trigger them and the involved actors. A business timeline is presented showing how events flow through the system.

## 2. Domain Events, Commands, and Actors

| Domain Event | Command (Cause) | Actor (Who/What) |
|-------------------|----------------|-------------------|
| `VehicleSighted` | `RecordVehiclePass` | IoT Sensor / ANPR Camera |
| `WeatherMetricsRecorded` | `ReportWeather` | Weather Station |
| `PlateNotRecognized` | `RecordPlateError` | IoT Sensor (OCR failure) |
| `SpeedLimitViolated` | `CheckSpeedLimit` | Violation Detector (system) |
| `InfractionTicketCreated` | `CreateInfractionTicket` | Evidence Packager (system) |
| `ExtremeWeatherAlertTriggered` | `EvaluateWeatherThresholds` | Extreme Weather Detector (system) |
| `OwnerNotifiedViaEmail` | `SendFineEmail` | Fine Email Dispatcher (system) |
| `PublicAlertBroadcasted` | `PublishAlertToSocialMedia` | Public Alert Broadcaster (system) |

## 3. Business Timeline (Main Flow)

1. **Sensor detects vehicle** → command `RecordVehiclePass` → event `VehicleSighted`.
2. **Violation Detector** consumes `VehicleSighted` → command `CheckSpeedLimit` → if limit exceeded: event `SpeedLimitViolated`.
3. **Evidence Packager** reacts to `SpeedLimitViolated` → command `CreateInfractionTicket` → event `InfractionTicketCreated`.
4. **Fine Email Dispatcher** consumes `InfractionTicketCreated` → command `SendFineEmail` → event `OwnerNotifiedViaEmail`.
5. **In parallel**: Weather station → `ReportWeather` → `WeatherMetricsRecorded` → if threshold exceeded → `ExtremeWeatherAlertTriggered` → `PublicAlertBroadcasted`.

## 4. Note on Asynchronous Flow

All events are published to Apache Kafka. Commands are internal to each context and are not exposed to the global bus. This ensures decoupling and resilience.
