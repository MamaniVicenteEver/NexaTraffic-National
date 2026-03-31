# Alcance Detallado del Sistema

## En Alcance (In-Scope)
El desarrollo y diseño arquitectónico del Sistema de Monitoreo de Tráfico (SMT) abarca las siguientes capacidades funcionales y no funcionales:

* **Gestión de Telemetría IoT:** Ingesta de datos crudos provenientes de sensores de velocidad, cámaras de reconocimiento de placas automotores y sensores climáticos.
* **Procesamiento de Métricas Analíticas:** Cálculo continuo de tráfico total, conteo de vehículos únicos, velocidades promedio/máximas/mínimas y métricas meteorológicas por ubicación temporal.
* **Motor de Trayectorias:** Almacenamiento y consulta de historiales de movimiento para vehículos específicos a través de la red nacional.
* **Sistema de Infracciones:** Detección de excesos de velocidad, empaquetado de evidencia (fotografía, placa, ubicación, velocidad) y registro inmutable en base de datos transaccional.
* **Motor de Notificaciones:** Emisión automatizada de correos electrónicos a infractores y distribución de alertas por clima extremo a plataformas externas.
* **Dashboards y Reportes:** Interfaces de visualización geográfica e histórica del estado de la red de tráfico.

## Fuera de Alcance (Out-of-Scope)
Para mantener los límites del dominio definidos, los siguientes elementos quedan excluidos de la arquitectura del software:

* **Hardware y Firmware en el Borde (Edge):** El desarrollo de los algoritmos de reconocimiento óptico de caracteres (OCR) dentro de las cámaras. El sistema asume que la placa ya viene decodificada en el payload del evento.
* **Pasarela de Pagos de Multas:** La liquidación financiera de las infracciones será gestionada por un sistema gubernamental o bancario externo.
* **Mantenimiento Físico de Nodos:** Alertas sobre daños físicos o fallos eléctricos en los sensores físicos de las 200 ubicaciones.

## Supuestos y Dependencias
1. **Conectividad:** Se asume que las 200 ubicaciones remotas cuentan con un enlace de red mínimo que permite la transmisión de datos hacia el Gateway de Ingesta, con soporte para reintentos locales en caso de desconexión temporal.
2. **Registro Maestro de Vehículos:** El SMT tiene acceso (vía replicación de datos o API de alta disponibilidad) a una base de datos nacional que relaciona el número de placa con el correo electrónico y la identidad del propietario.
3. **Estandarización de Formatos:** Independientemente del fabricante del hardware en la ubicación, los datos ingresarán o serán transformados a un esquema de evento estándar JSON/Protobuf en el Protocol Adapter.