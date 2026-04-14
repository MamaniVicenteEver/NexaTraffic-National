# Visión General del Sistema NexaTraffic

## 1. Contexto del Problema

La gestión moderna del tráfico vehicular y la seguridad vial a nivel nacional requiere una plataforma capaz de procesar volúmenes masivos de datos en tiempo real. Actualmente, la captura, agregación y análisis de telemetría vehicular y climática enfrenta desafíos críticos de escalabilidad, integración heterogénea y tolerancia a fallos.

El Sistema de Monitoreo de Tráfico (SMT) debe orquestar información proveniente de **200 ubicaciones remotas** distribuidas en el territorio nacional. Cada ubicación genera un promedio de **20.000 registros de vehículos por día**, lo que representa un flujo constante de aproximadamente **4 millones de eventos diarios** (picos de hasta 500 eventos/segundo). Los sistemas monolíticos tradicionales no pueden manejar este rendimiento sin incurrir en cuellos de botella, latencia excesiva en la generación de infracciones o pérdida de información crítica.

## 2. Solución Propuesta: NexaTraffic

NexaTraffic es una plataforma **Cloud-Native** diseñada para la ingesta, procesamiento y análisis de telemetría de tráfico y variables ambientales en tiempo real. Construida bajo los principios de la **metodología 12-Factor App**, la arquitectura abandona los modelos de "lift-and-shift" en favor de un ecosistema distribuido basado en **microservicios** y una **arquitectura orientada a eventos (EDA)**.

### 2.1 Propuesta de Valor

El sistema fundamenta su valor en cuatro pilares arquitectónicos:

1. **Ingesta masiva y desacoplada**: Capacidad para recibir flujos incesantes de datos IoT (cámaras ANPR, sensores de velocidad, estaciones meteorológicas) garantizando que los picos de tráfico no saturen las capacidades de procesamiento.

2. **Procesamiento de reglas en tiempo real**: Evaluación instantánea de límites de velocidad por ubicación, generación de infracciones inmutables y automatización de notificaciones a propietarios.

3. **Inteligencia geoespacial e histórica**: Reconstrucción algorítmica de trayectorias vehiculares y visualización del volumen de tráfico correlacionado con condiciones climáticas extremas.

4. **Resiliencia operativa**: Arquitectura contenerizada y orquestada (Kubernetes) que asegura que el fallo de un componente (ej. portal de reportes) no detenga el flujo crítico de registro de eventos.

### 2.2 Objetivos Estratégicos

- **Rendimiento**: Latencia extrema < 200ms en el pipeline ingesta-detección de infracciones.
- **Escalabilidad**: Soporte para 15.400 usuarios concurrentes en dashboards y APIs.
- **Disponibilidad**: 99,99% de tiempo activo (cuatro nueves) mediante replicación multi-zona.
- **Retención de datos**: Almacenamiento de métricas agregadas por 5 años, eventos crudos por 30 días.

## 3. Principios Arquitectónicos Rectores

- **Domain-Driven Design (DDD)** para delimitar contextos y mantener un lenguaje ubícuo.
- **Event-Driven Architecture** con Apache Kafka como backbone de mensajería asíncrona.
- **Statelessness** en todos los servicios de procesamiento.
- **Configuración externa** mediante variables de entorno (12-Factor).
- **Observabilidad** nativa con métricas, logs estructurados y tracing distribuido.

## 4. Relación con los Milestones del Capstone

Esta visión general sustenta los entregables de los Milestones 1 y 2 (definición del sistema y arquitectura de alto nivel). Los detalles funcionales y no funcionales se desarrollan en el documento de *Alcance Detallado*, y las brechas identificadas se documentan en la *Propuesta Inicial*.