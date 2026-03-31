# Glosario Técnico y de Negocio

Para asegurar la ubicuidad del lenguaje entre los desarrolladores, arquitectos y expertos del dominio, se definen los siguientes términos aplicables a todo el proyecto NexaTraffic:

## Términos de Negocio (Domain)
* **Ubicación Remota (Nodo):** Un punto geográfico específico en la carretera equipado con sensores y cámaras. Existen 200 en la red.
* **Avistamiento (Sighting):** Registro temporal de un vehículo pasando por una Ubicación Remota. Contiene mínimamente placa, timestamp y ubicación.
* **Trayectoria (Trajectory):** Colección cronológica de avistamientos asociados a una misma placa durante un periodo de tiempo.
* **Infracción Inmutable:** Registro legal de un exceso de velocidad. Es inmutable porque una vez generado y empaquetado con su evidencia fotográfica, no puede ser alterado en la base de datos.
* **Clima Extremo:** Estado derivado de la lectura de telemetría (temperatura, lluvia, nieve) que supera los umbrales de seguridad definidos para una ubicación.

## Términos Arquitectónicos
* **Cloud-Native:** Enfoque de desarrollo de software que utiliza la computación en la nube para construir y ejecutar aplicaciones escalables en entornos modernos y dinámicos.
* **12-Factor App:** Metodología para construir aplicaciones de software como servicio (SaaS) que enfatiza la automatización declarativa, portabilidad y despliegue continuo.
* **Bounded Context (Contexto Delimitado):** Frontera conceptual en el Diseño Guiado por el Dominio (DDD) donde un modelo de dominio particular está definido y es aplicable.
* **Event-Driven Architecture (EDA):** Patrón de arquitectura de software que promueve la producción, detección, consumo y reacción a eventos de cambio de estado.
* **IoT Gateway:** Componente de entrada diseñado para ingerir de forma segura conexiones de alta frecuencia provenientes de dispositivos físicos.
* **Time-Series Database (TSDB):** Base de datos optimizada para almacenar y servir datos indexados por tiempo, crucial para las métricas de tráfico y clima de este sistema.