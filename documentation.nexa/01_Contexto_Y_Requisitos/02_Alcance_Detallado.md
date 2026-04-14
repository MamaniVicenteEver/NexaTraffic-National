# Alcance Detallado del Sistema NexaTraffic

## 1. En Alcance (In-Scope)

El diseño e implementación del Sistema de Monitoreo de Tráfico (SMT) abarca las siguientes capacidades funcionales y no funcionales:

### 1.1 Funcionalidades Principales

| Épica | Características |
|-------|----------------|
| **Ingesta de telemetría IoT** | Recepción de datos desde 200 ubicaciones remotas (cámaras ANPR, sensores de velocidad, estaciones climáticas) a través de protocolos MQTT/HTTP. Transformación de formatos propietarios a un modelo canónico de eventos. |
| **Métricas de tráfico** | Cálculo continuo por ubicación y ventana de tiempo: total de vehículos, vehículos únicos (placas distintas), velocidad promedio, velocidad máxima, velocidad mínima. |
| **Métricas climáticas** | Registro de temperatura, humedad, precipitación (lluvia/nieve) asociados a cada ubicación y timestamp. |
| **Consultas de trayectoria** | Historial de ubicaciones visitadas por un vehículo (placa) en un período de tiempo determinado (ej. "el auto con placa X visitó las ubicaciones A, B, C este mes"). |
| **Detección de infracciones** | Alertas en tiempo real cuando un vehículo supera el límite de velocidad configurado para la ubicación. Generación de un ticket de infracción inmutable que incluye placa, fotografía (evidencia), velocidad registrada, ubicación y timestamp. |
| **Notificaciones** | Envío de correo electrónico al propietario del vehículo (a través de integración con registro vehicular externo) con los detalles de la multa. Publicación de alertas por clima extremo en redes sociales / portal público. |
| **Visualización y reportes** | Dashboard nacional con mapas de calor de tráfico, gráficos de volumen por ciudad/condado, y reportes históricos de infracciones por placa. |

### 1.2 Atributos de Calidad (Requisitos No Funcionales)

| Atributo | Métrica Objetivo | Estrategia |
|----------|------------------|-------------|
| Rendimiento | Latencia p99 < 200ms desde la ingesta hasta la generación de infracción. | Procesamiento en memoria, streaming con Kafka, consumidores en Go/Java. |
| Escalabilidad | Soportar 4M eventos/día (pico de 500 eventos/segundo) con escalado horizontal automático. | Kubernetes HPA basado en CPU y lag de Kafka. |
| Disponibilidad | 99,99% de tiempo activo anual. | Arquitectura multi-zona, replicación de Kafka (factor 3), bases de datos en alta disponibilidad. |
| Durabilidad | Cero pérdida de eventos críticos (infracciones). | Kafka con acks=all y replicación; consumidores idempotentes con DLQ. |
| Seguridad | Cifrado en tránsito (TLS 1.3) y en reposo (AES-256). Autenticación entre servicios (mTLS). | Istio service mesh o configuración nativa de Kubernetes. |

## 2. Fuera de Alcance (Out-of-Scope)

Los siguientes elementos quedan explícitamente excluidos del diseño de software del SMT:

- **Hardware y firmware en el borde**: El desarrollo de algoritmos de reconocimiento óptico de caracteres (OCR) dentro de las cámaras. Se asume que la placa ya viene decodificada en el payload del evento.
- **Pasarela de pagos de multas**: La liquidación financiera de las infracciones será gestionada por un sistema gubernamental o bancario externo.
- **Mantenimiento físico de nodos**: Alertas sobre daños eléctricos o fallos en sensores de las 200 ubicaciones.
- **Aplicación móvil nativa**: El alcance se limita a un portal web responsive (dashboard) y APIs REST para integraciones.

## 3. Supuestos y Dependencias Externas

1. **Conectividad de red**: Las 200 ubicaciones remotas cuentan con un enlace de red mínimo (banda ancha o 4G/5G) que permite la transmisión de datos hacia el Gateway de Ingesta, con soporte para reintentos locales en caso de desconexión temporal (buffer en el edge).

2. **Registro maestro de vehículos**: El SMT tiene acceso (vía API de alta disponibilidad o replicación asíncrona) a una base de datos nacional que relaciona el número de placa con el correo electrónico y la identidad del propietario. Se asume latencia máxima de 100ms para esta consulta.

3. **Estandarización de formatos**: Independientemente del fabricante del hardware (Hikvision, Axis, etc.), los datos ingresarán o serán transformados por un *Protocol Adapter* a un esquema de evento canónico (JSON/Protobuf) definido por NexaTraffic.

4. **Servicios de notificación externos**: Los proveedores de correo electrónico (SMTP) y APIs de redes sociales (Twitter, Facebook) están disponibles con sus respectivos límites de tasa.

## 4. Brechas Conocidas (Resumen)

Para un análisis detallado y planes de mitigación, véase el documento `04_Propuesta_Inicial.md`. Las brechas principales identificadas son:

- Ausencia de un contexto de configuración dinámica para límites de velocidad y umbrales climáticos.
- Falta de definición de políticas de retención de datos y particionamiento temporal.
- Necesidad de idempotencia en consumidores de Kafka para evitar multas duplicadas.
- Back-pressure no especificado para el Receiver Service ante saturación del broker.