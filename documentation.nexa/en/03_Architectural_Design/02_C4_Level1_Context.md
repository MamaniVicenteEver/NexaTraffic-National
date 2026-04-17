# C4 View Level 1: Context Diagram (PlantUML)

## 1. Description

The context diagram shows the Traffic Monitoring System (NexaTraffic) as a black box and its interactions with external actors (people and systems).

## 2. Diagram (PlantUML)

```plantuml
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml

' Title
title Context Diagram - NexaTraffic (TMS)

' People (human actors)
Person(sensor_operator, "Sensor Operator", "Maintains IoT devices (200 locations)")
Person(traffic_officer, "Traffic Officer", "Queries trajectories, visualizes metrics, receives internal alerts")

' External systems
System_Ext(vehicle_registry, "National Vehicle Registry", "External system that associates license plates with owners (email, name)")
System_Ext(email_server, "Email Server (SMTP)", "Outgoing email infrastructure")
System_Ext(traffic_authority, "Traffic Authority", "Internal system that receives weather alerts and infraction reports")

' Sensor systems (physical devices)
System_Ext(weather_stations, "Weather Stations (200)", "Measure temperature, humidity, precipitation, wind")
System_Ext(anpr_cameras, "ANPR Cameras and Speed Sensors (200)", "Capture license plate, speed, timestamp")

' Our system (black box)
System(nexatraffic, "NexaTraffic - Traffic Monitoring System", "Cloud‑Native, Event‑Driven, Microservices")

' Relationships

' Sensors to NexaTraffic
Rel(anpr_cameras, nexatraffic, "Sends sightings (license plate, speed, timestamp)", "MQTT/HTTP")
Rel(weather_stations, nexatraffic, "Sends weather metrics every 5 min", "MQTT/HTTP")

' Users
Rel(traffic_officer, nexatraffic, "Queries trajectories, dashboards, receives alerts", "HTTPS")
Rel(sensor_operator, nexatraffic, "Configures speed limits and thresholds", "HTTPS (admin UI)")

' NexaTraffic to external systems
Rel(nexatraffic, vehicle_registry, "Queries owner by license plate", "gRPC (synchronous)")
Rel(nexatraffic, email_server, "Sends fine notification", "SMTP")
Rel(nexatraffic, traffic_authority, "Sends extreme weather alerts and infraction reports", "Kafka Events / Internal API")

' Style legend
LAYOUT_TOP_DOWN()
LAYOUT_AS_SKETCH()

@enduml
```

## 3. Relationship Explanation

| Actor / System | Direction | Protocol | Purpose |
|----------------|-----------|-----------|-----------|
| ANPR Cameras | → NexaTraffic | MQTT/HTTP | Sending sightings (license plate, speed, timestamp). |
| Weather Stations | → NexaTraffic | MQTT/HTTP | Periodic sending of temperature, humidity, precipitation. |
| Traffic Officer | → NexaTraffic | HTTPS | Trajectory queries, dashboards, reception of internal alerts. |
| Sensor Operator | → NexaTraffic | HTTPS (admin UI) | Configuration of speed limits and weather thresholds. |
| NexaTraffic | → Vehicle Registry | gRPC | Obtain owner's email and name to notify fines. |
| NexaTraffic | → Email Server | SMTP | Sending emails with fine details. |
| NexaTraffic | → Traffic Authority | Kafka Events / API | Notification of extreme weather alerts and infraction reports. |

## 4. System Boundaries (out of context)

- Does not manage sensor hardware or firmware.
- Does not process fine payments (external system).
- Does not interact with social networks or public portals.
- Does not include native mobile applications (only responsive web).

## 5. Deployment Note

The context diagram is technology-independent; however, to comply with cloud‑native principles, all of NexaTraffic is deployed in Docker containers orchestrated by Kubernetes.
