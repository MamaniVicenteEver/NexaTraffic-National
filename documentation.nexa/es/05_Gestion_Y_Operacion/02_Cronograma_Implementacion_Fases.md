# Cronograma de Implementación por Fases (7 semanas de desarrollo + 1 semana de demo)

## 1. Estructura temporal

El proyecto se desarrolla en **7 semanas de trabajo intensivo** (una semana por cada milestone) más una **semana final de demostración y ajustes**. Cada semana tiene entregables concretos y criterios de aceptación.

```
Semana:      1     2     3     4     5     6     7     8
Desarrollo:  M1    M2    M3    M4    M5    M6    M7    Demo
             [====][====][====][====][====][====][====]
Entrega final:                                    [====]
```

## 2. Desglose semanal de actividades

| Semana | Milestone | Actividades principales | Entregables | Criterios de éxito |
|--------|-----------|-------------------------|-------------|--------------------|
| 1 | M1 - Definición del sistema | - Elaborar visión, alcance, glosario.<br>- Identificar actores, flujos de ingesta y consulta.<br>- Definir modelo de datos inicial (métricas, eventos).<br>- Listar supuestos y brechas. | Documento de definición del sistema (PDF/MD).<br>Diagrama simple de flujos.<br>Lista de brechas. | Revisión y aprobación por el instructor. |
| 2 | M2 - Arquitectura cloud-native | - Diseñar diagramas C4 (nivel contenedores).<br>- Identificar servicios (ingesta, procesamiento, API, alertas).<br>- Justificar monolito vs microservicios, sync vs async.<br>- Documentar statelessness, escalabilidad, resiliencia. | Diagramas C4.<br>Documento de justificación.<br>Matriz de trade-offs. | Coherencia con requisitos de escala. |
| 3 | M3 - Servicio base 12-factor | - Implementar servicio con endpoint `/health` y un endpoint funcional (ej. `/metrics`).<br>- Usar configuración por variables de entorno.<br>- Logs a stdout, diseño stateless.<br>- Crear archivo `.env.example`. | Código funcional (Go/Java).<br>`.env.example`.<br>Instrucciones de ejecución. | El servicio pasa pruebas locales; cumple 12 factores aplicables. |
| 4 | M4 - Contenerización y despliegue | - Escribir Dockerfile.<br>- Ejecutar contenedor localmente.<br>- Desplegar en entorno cloud (AKS o Docker Compose).<br>- Configurar variables externas al contenedor. | Imagen Docker.<br>Evidencia de ejecución (captura o URL).<br>Documento de configuración. | Contenedor reproducible, separación build/run. |
| 5 | M5 - Eventos y datos | - Simular productor de eventos (métricas de tráfico, infracciones, clima).<br>- Implementar consumidor.<br>- Persistir datos en DB justificada (PostgreSQL o TSDB).<br>- Demostrar flujo asincrónico. | Código de productor/consumidor.<br>Evidencia de flujo asíncrono (logs).<br>Esquema de base de datos. | El flujo asíncrono funciona sin pérdida de eventos. |
| 6 | M6 - Observabilidad y resiliencia | - Exponer métricas del sistema (Prometheus).<br>- Implementar health checks avanzados (liveness/readiness).<br>- Generar logs estructurados (JSON).<br>- Simular carga o múltiples instancias. | Evidencia de métricas (Grafana).<br>Logs interpretables.<br>Documento de estrategia de resiliencia. | Sistema responde a fallos simulados (ej. caída de dependencia). |
| 7 | M7 - CI/CD + IA + reflexión | - Diagramar pipeline (build, test, deploy).<br>- Documentar uso crítico de IA.<br>- Elaborar conclusiones finales (trade-offs, limitaciones). | Diagrama de pipeline (GitHub Actions).<br>Reflexión sobre IA.<br>Documento final integrado. | Pipeline documentado; reflexión coherente. |
| 8 | Demo y entrega final | - Preparar presentación.<br>- Realizar demo en vivo (o grabada) de los hitos clave.<br>- Entregar todos los artefactos (código, documentación, imágenes). | Presentación (PPT/PDF).<br>Enlace a repositorio.<br>Video de demo (opcional). | Aprobación del instructor. |

## 3. Hitos críticos y fechas límite (ejemplo)

| Hito | Fecha límite (semana) | Dependencias |
|------|----------------------|--------------|
| Congelación de requisitos | Fin semana 1 | Aprobación de M1 |
| Diseño arquitectónico aprobado | Fin semana 2 | M1 completado |
| Primer código ejecutable | Fin semana 3 | M2 completado |
| Contenedor desplegado en cloud | Fin semana 4 | M3 completado |
| Flujo de eventos asíncrono funcionando | Fin semana 5 | M4 completado |
| Métricas y logs operativos | Fin semana 6 | M5 completado |
| Pipeline CI/CD documentado | Fin semana 7 | M6 completado |
| Demo final | Fin semana 8 | Todos los anteriores |

## 4. Gestión de riesgos temporales

| Riesgo | Probabilidad | Impacto | Mitigación | Semana de contingencia |
|--------|--------------|---------|-------------|------------------------|
| Retraso en la implementación del servicio base (M3) | Media | Alto | Usar mocks de datos y generadores aleatorios; simplificar endpoint a solo `/health`. | Semana 3 (extender 1 día) |
| Problemas de integración con Kafka (M5) | Alta | Medio | Dedicar 2 días extra en semana 5; tener un broker simulado (Redis o cola en memoria) como respaldo. | Semana 5 |
| Fallo en el despliegue cloud (M4) | Media | Alto | Tener un entorno local con Docker Compose como plan B; documentar ambos. | Semana 4 |
| Indisponibilidad del instructor para revisión | Baja | Medio | Enviar entregables con 48h de antelación; grabar demo asíncrona. | Cualquier semana |
| Carga de trabajo excesiva (proyecto individual) | Media | Medio | Priorizar funcionalidad crítica (ingesta + infracción) sobre mejoras (trayectorias, clima). | Semanas 5-6 |

**Buffer**: Se reserva la semana 8 (demo) también para pulir detalles. Si todo va bien, la demo se realiza el día 1 de la semana 8 y el resto se usa para documentación final.

## 5. Asignación de recursos (simulada para proyecto individual)

- **Arquitecto / Desarrollador principal**: 100% dedicación todas las semanas.
- **Herramientas**: GitHub Codespaces o máquina local con Docker, Azure free tier o créditos estudiantiles.
- **Revisiones externas**: 1 hora semanal con el instructor.

## 6. Entregables por semana (checklist)

Semana 1:
- [ ] Documento de visión, alcance, glosario.
- [ ] Lista de supuestos y brechas.
- [ ] Diagrama de flujo de ingesta y consulta.

Semana 2:
- [ ] Diagrama C4 nivel contenedores.
- [ ] Justificación de microservicios y EDA.
- [ ] Matriz de trade-offs.

Semana 3:
- [ ] Repositorio con código del servicio base.
- [ ] Endpoint `/health` y un endpoint de negocio (ej. `/metrics` mock).
- [ ] Archivo `.env.example`.
- [ ] Logs a stdout (evidencia).

Semana 4:
- [ ] Dockerfile.
- [ ] Imagen en registro (Docker Hub o ACR).
- [ ] Despliegue local (docker-compose up) y en cloud (AKS o similar).
- [ ] URL funcional o captura de pantalla.

Semana 5:
- [ ] Productor de eventos (simulador de sensores).
- [ ] Consumidor de eventos (ej. impresora de logs).
- [ ] Persistencia en PostgreSQL (tickets) o ClickHouse (métricas).
- [ ] Evidencia de flujo asíncrono (pantalla de Kafka o logs).

Semana 6:
- [ ] Endpoint `/metrics` expuesto (Prometheus).
- [ ] Health checks avanzados (`/health` y `/ready`).
- [ ] Logs estructurados (JSON) capturados.
- [ ] Simulación de carga con múltiples instancias (o script de estrés).

Semana 7:
- [ ] Diagrama de pipeline CI/CD (GitHub Actions).
- [ ] Reflexión escrita sobre uso de IA.
- [ ] Conclusiones finales (trade-offs, limitaciones).

Semana 8:
- [ ] Presentación de demo (10-15 min).
- [ ] Video o enlace a repositorio final.
- [ ] Todos los artefactos subidos a la plataforma del curso.
