# NexaTraffic: National Smart Grid & Traffic Monitoring System

<div align="center">
  <img width="48%" alt="NexaTraffic System Overview" src="./img/img1.png" />
  <img width="48%" alt="NexaTraffic Architecture Map" src="./img/image.png" />
</div>

<div align="center">
  <img src="https://img.shields.io/badge/Architecture-Cloud--Native-0055FF" alt="Cloud Native" />
  <img src="https://img.shields.io/badge/Backbone-Apache_Kafka-EB1C24" alt="Kafka" />
  <img src="https://img.shields.io/badge/Language-Go_%7C_Java-00ADD8" alt="Languages" />
  <img src="https://img.shields.io/badge/Orchestration-Kubernetes-326CE5" alt="Kubernetes" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL_%7C_ClickHouse-336791" alt="Databases" />
  <img src="https://img.shields.io/badge/Design-DDD-6DB33F" alt="DDD" />
</div>

## Vision General

NexaTraffic es una plataforma de monitoreo de trafico nacional de alto rendimiento diseñada para la gestion inteligente de movilidad urbana. El sistema integra telemetria de 200 ubicaciones remotas, procesando un promedio de 4 millones de eventos vehiculares diarios mediante una arquitectura distribuida basada en eventos (Event-Driven Architecture).

La solucion garantiza escalabilidad elastica, tolerancia a fallos y procesamiento en tiempo real para la deteccion de infracciones, seguimiento de trayectorias y analisis climatico.

## Documentacion de Arquitectura

Seleccione una seccion para explorar los detalles tecnicos del sistema.

### 00 Informatica General (Home)
- [Vision General](00_Home/01_Vision_General.md) – Contexto estrategico y propositos.
- [Alcance Detallado](00_Home/02_Alcance_Detallado.md) – Funcionalidades, limites y supuestos.
- [Glosario Tecnico](00_Home/03_Glosario_Tecnico.md) – Definiciones de dominio y terminologia.

### 01 Analisis de Dominio (DDD)
- [Event Storming](01_Analisis_DDD/01_Event_Storming.md) – Linea de tiempo de eventos de negocio.
- [Subdominios y Bounded Contexts](01_Analisis_DDD/02_Subdominios_Bounded_Contexts.md) – Descomposicion del sistema.
- [Context Map](01_Analisis_DDD/03_Context_Map.md) – Relaciones y protocolos entre contextos.
- [Casos de Uso Criticos](01_Analisis_DDD/04_Casos_de_Uso.md) – Flujos principales de usuario y sistema.
- [Analisis de Brechas](01_Analisis_DDD/05_Analisis_Brechas.md) – Resolucion de ambiguedades tecnicas.

### 02 Diseño Arquitectonico
- [Seleccion de Estilo](02_Arquitectura_Sistema/01_Seleccion_Estilo.md) – Justificacion de Microservicios y EDA.
- [C4 Nivel 1: Contexto](02_Arquitectura_Sistema/02_Vista_C4_L1_Contexto.md) – Interacciones externas.
- [C4 Nivel 2: Contenedores](02_Arquitectura_Sistema/03_Vista_C4_L2_Contenedores.md) – Infraestructura distribuida.
- [C4 Nivel 3: Componentes](02_Arquitectura_Sistema/04_Vista_C4_L3_Componentes.md) – Logica interna de servicios.
- [Diagramas de Comunicacion](02_Arquitectura_Sistema/05_Diagramas_Comunicacion.md) – Flujos asincronos en Kafka.
- [Modelo de Datos Distribuido](02_Arquitectura_Sistema/06_Modelo_Datos_Distribuido.md) – Persistencia poliglota.

### 03 Estrategia Tecnologica
- [Seleccion de Tecnología](03_Decisiones_Tecnologicas/01_Seleccion_Tecnologia.md) – Justificacion del Stack.
- [Estrategia de Escalabilidad](03_Decisiones_Tecnologicas/02_Estrategia_Escalabilidad.md) – Gestion de picos de carga.
- [Analisis de Trade-offs](03_Decisiones_Tecnologicas/03_Trade_offs_Analisis.md) – Decisiones criticas de diseño.

### 05 Gestion y Planificacion
- [Gestion de Riesgos](05_Gestion_Proyecto/01_Gestion_Riesgos.md) – Mitigacion de fallos criticos.
- [Plan de Implementacion](05_Gestion_Proyecto/02_Plan_Implementacion.md) – Cronograma y fases.

---

## Atributos de Calidad Principales

| Atributo | Metrica Objetivo | Estrategia |
|----------|------------------|------------|
| **Rendimiento** | Latencia < 200ms | Procesamiento en memoria con Redis y Go. |
| **Escalabilidad** | 15,400+ Usuarios | Orquestacion con Kubernetes y Auto-scaling. |
| **Disponibilidad** | 99.99% | Arquitectura multi-region y aislamiento de fallos. |
| **Retencion** | 5 Años | Particionamiento de datos en ClickHouse. |

## Stack Tecnologico

- **Backend:** Java Spring Boot (Servicios transaccionales) y Go (Ingesta de alto rendimiento).
- **Messaging:** Apache Kafka (Event Streaming backbone).
- **Persistencia:** PostgreSQL (Datos relacionales), ClickHouse (Analitica masiva), Redis (Cache).
- **Infraestructura:** Docker, Kubernetes, Helm.
- **Analitica:** Python (Modelado de datos de trafico).

---

**Autor:** Ever Mamani Vicente  
**Proyecto:** Capstone - Arquitectura de Software 4  
**Institucion:** Universidad Jala  
**Fecha:** Marzo 2026# NexaTraffic-National
# NexaTraffic-National
