# Vista C4 Nivel 1: Diagrama de Contexto (PlantUML)

## 1. Descripción

El diagrama de contexto muestra el Sistema de Monitoreo de Tráfico (NexaTraffic) como una caja negra y sus interacciones con los actores externos (personas y sistemas).

## 2. Diagrama (PlantUML)

```plantuml
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml

' Título
title Diagrama de Contexto - NexaTraffic (SMT)

' Personas (actores humanos)
Person(sensor_operator, "Operador de Sensores", "Mantiene los dispositivos IoT (200 ubicaciones)")
Person(traffic_officer, "Oficial de Tránsito", "Consulta trayectorias, visualiza métricas, recibe alertas internas")

' Sistemas externos
System_Ext(vehicle_registry, "Registro Vehicular Nacional", "Sistema externo que asocia placas con propietarios (email, nombre)")
System_Ext(email_server, "Servidor de Correo (SMTP)", "Infraestructura de correo saliente")
System_Ext(traffic_authority, "Autoridad de Tránsito", "Sistema interno que recibe alertas climáticas y reportes de infracciones")

' Sistemas de sensores (dispositivos físicos)
System_Ext(weather_stations, "Estaciones Meteorológicas (200)", "Miden temperatura, humedad, precipitación, viento")
System_Ext(anpr_cameras, "Cámaras ANPR y Sensores de Velocidad (200)", "Capturan placa, velocidad, timestamp")

' Nuestro sistema (caja negra)
System(nexatraffic, "NexaTraffic - Sistema de Monitoreo de Tráfico", "Cloud‑Native, Event‑Driven, Microservicios")

' Relaciones

' Sensores hacia NexaTraffic
Rel(anpr_cameras, nexatraffic, "Envía avistamientos (placa, velocidad, timestamp)", "MQTT/HTTP")
Rel(weather_stations, nexatraffic, "Envía métricas climáticas cada 5 min", "MQTT/HTTP")

' Usuarios
Rel(traffic_officer, nexatraffic, "Consulta trayectorias, dashboards, recibe alertas", "HTTPS")
Rel(sensor_operator, nexatraffic, "Configura límites de velocidad y umbrales", "HTTPS (UI admin)")

' NexaTraffic hacia sistemas externos
Rel(nexatraffic, vehicle_registry, "Consulta propietario por placa", "gRPC (síncrono)")
Rel(nexatraffic, email_server, "Envía notificación de multa", "SMTP")
Rel(nexatraffic, traffic_authority, "Envía alertas de clima extremo y reportes de infracciones", "Eventos Kafka / API interna")

' Leyenda de estilos
LAYOUT_TOP_DOWN()
LAYOUT_AS_SKETCH()

@enduml
```

## 3. Explicación de las relaciones

| Actor / Sistema | Dirección | Protocolo | Propósito |
|----------------|-----------|-----------|-----------|
| Cámaras ANPR | → NexaTraffic | MQTT/HTTP | Envío de avistamientos (placa, velocidad, timestamp). |
| Estaciones meteorológicas | → NexaTraffic | MQTT/HTTP | Envío periódico de temperatura, humedad, precipitación. |
| Oficial de tránsito | → NexaTraffic | HTTPS | Consultas de trayectoria, dashboards, recepción de alertas internas. |
| Operador de sensores | → NexaTraffic | HTTPS (UI admin) | Configuración de límites de velocidad y umbrales climáticos. |
| NexaTraffic | → Registro Vehicular | gRPC | Obtener email y nombre del propietario para notificar multas. |
| NexaTraffic | → Servidor de Correo | SMTP | Envío de correos con detalles de la multa. |
| NexaTraffic | → Autoridad de Tránsito | Eventos Kafka / API | Notificación de alertas climáticas extremas y reportes de infracciones. |

## 4. Límites del sistema (fuera de contexto)

- No gestiona hardware ni firmware de sensores.
- No realiza el pago de multas (sistema externo).
- No interactúa con redes sociales ni portales públicos.
- No incluye aplicaciones móviles nativas (solo web responsive).

## 5. Nota de despliegue

El diagrama de contexto es independiente de la tecnología; sin embargo, para cumplir con los principios cloud‑native, todo NexaTraffic se despliega en contenedores Docker orquestados por Kubernetes.
