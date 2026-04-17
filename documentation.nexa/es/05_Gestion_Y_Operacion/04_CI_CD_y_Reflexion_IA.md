# CI/CD Pipeline y Reflexión sobre el Uso de IA

## 1. Estrategia de Integración Continua y Entrega Continua (CI/CD)

El objetivo es automatizar la construcción, prueba y despliegue de los microservicios de NexaTraffic, garantizando que cada cambio en el repositorio pase por un proceso estandarizado antes de llegar a producción.

### 1.1. Flujo general del pipeline

A continuación se muestra el diagrama de flujo del pipeline CI/CD, desde el commit hasta el despliegue en producción.

```
[Commit en Git] -> [Trigger] -> [Build & Test] -> [Code Analysis] -> [Build Images] -> [Push Registry] -> [Deploy Staging] -> [Smoke Tests] -> [Deploy Production (Blue-Green)]
```

**Descripción de etapas**:

1. **Trigger**: Cada push a las ramas `develop` o `main` inicia el pipeline. También se ejecuta en pull requests.
2. **Build & Test**: Se compilan los servicios (Go y Java) y se ejecutan pruebas unitarias e integración.
3. **Code Analysis**: Análisis estático (linters) y escaneo de seguridad (dependencias vulnerables).
4. **Build Images**: Se construyen imágenes Docker etiquetadas con el hash del commit.
5. **Push Registry**: Las imágenes se suben a Azure Container Registry (ACR).
6. **Deploy Staging**: Se actualiza el entorno de pruebas (namespace `staging`) usando kubectl.
7. **Smoke Tests**: Se ejecutan pruebas básicas de humo (endpoints principales, conectividad a Kafka/DB).
8. **Deploy Production**: Estrategia blue-green para minimizar tiempo de inactividad.

### 1.2. Herramientas utilizadas y justificación

| Herramienta | Propósito | Justificación |
|-------------|-----------|----------------|
| GitHub Actions | Orquestador CI/CD | Integración nativa con el repositorio, sin costo adicional, configurable mediante YAML. |
| Docker | Contenerización | Estandarización de entornos, portabilidad entre etapas. |
| Azure Container Registry (ACR) | Almacenamiento de imágenes | Misma región que AKS, baja latencia, seguridad integrada. |
| kubectl | Despliegue en Kubernetes | Estándar de facto, idempotente, fácil de integrar. |
| Trivy | Escaneo de vulnerabilidades | Open source, detecta CVEs en imágenes y dependencias. |

### 1.3. Estrategia de despliegue: Blue-Green para producción

Para garantizar disponibilidad durante los despliegues, se utiliza el patrón blue-green:

- **Blue (activo)**: versión actual en producción.
- **Green (nueva)**: versión con el cambio.
- El tráfico se cambia gradualmente de blue a green mediante la actualización del selector del servicio de Kubernetes. Si falla, se revierte al instante.

```
Estado inicial:
  Service -> selector: version=blue

Despliegue:
  - Crear deployment green (versión nueva)
  - Ejecutar pruebas de humo en green
  - Cambiar selector del service a version=green
  - Mantener blue por 5 minutos para posible rollback
```

### 1.4. Separación Build / Release / Run (12-Factor)

- **Build**: Se genera un artefacto binario y una imagen Docker (en CI).
- **Release**: Se combina la imagen con la configuración específica de entorno (variables, secrets). Se etiqueta la versión (ej. `v1.2.3+staging`).
- **Run**: Se ejecuta el contenedor en el entorno correspondiente, sin modificaciones en tiempo de ejecución.

### 1.5. Gestión de configuración externa

La configuración se inyecta mediante:
- **ConfigMaps** de Kubernetes: valores no sensibles (ej. nivel de log).
- **Secrets** de Kubernetes (cifrados con Azure Key Vault): credenciales de bases de datos, claves de API.
- **Variables de entorno** en los pods: sobrescritas desde los recursos anteriores.

Ninguna configuración está hardcodeada en la imagen.

---

## 2. Reflexión sobre el uso de Inteligencia Artificial en el proyecto

### 2.1. Herramientas de IA empleadas

- **Asistentes de lenguaje (ChatGPT, Claude)**: Generación de borradores de documentación, diagramas PlantUML, análisis de brechas, redacción de justificaciones.
- **GitHub Copilot**: Sugerencias de código para prototipos de servicios (ej. cliente Kafka, mock de sensores).

### 2.2. Beneficios concretos

- **Aceleración de la documentación**: En menos de 2 horas se generaron borradores de los 5 archivos de DDD y los diagramas C4.
- **Exploración de alternativas**: Se pidió a la IA comparar Kafka vs. RabbitMQ, y sus respuestas ayudaron a decidir Kafka por su ecosistema y retención.
- **Consistencia estilística**: La IA mantuvo un formato uniforme en tablas, listas y encabezados.

### 2.3. Limitaciones y riesgos detectados

- **Alucinaciones**: En una iteración, la IA sugirió usar Redis como base de datos principal para tickets (incorrecto por falta de ACID). Se corrigió manualmente.
- **Sesgo tecnológico**: La IA recomienda siempre Kubernetes y microservicios, incluso para volúmenes pequeños. Se validó con el requisito de escala real.
- **Falta de conocimiento de dominio específico**: Las regulaciones de tránsito (ej. límites de velocidad por zona escolar) fueron definidas por el equipo, no por la IA.

### 2.4. Decisiones arquitectónicas críticas tomadas sin IA

- **Elección de Azure sobre AWS**: Basada en análisis de costos regionales y experiencia previa.
- **Inmutabilidad de los tickets**: Requerimiento legal que la IA no podía inferir.
- **Estrategia de back-pressure**: Diseñada manualmente a partir de patrones de resiliencia conocidos.

### 2.5. Lecciones aprendidas

- La IA es un asistente valioso para la documentación y exploración, pero no reemplaza el criterio humano.
- Todo contenido generado por IA debe ser revisado y contrastado con fuentes confiables.
- El código generado por IA (Copilot) solo se usó para prototipos; el código de producción requiere pruebas adicionales.

### 2.6. Buenas prácticas aplicadas con IA

- **Transparencia**: Este documento explicita el uso de IA.
- **Supervisión humana**: Cada sección fue editada y validada por el arquitecto.
- **No dependencia crítica**: El sistema funciona sin IA; se usó solo para acelerar tareas repetitivas.

---

## 3. Conclusión del pipeline y la reflexión

El pipeline CI/CD definido permite integración continua confiable, despliegues seguros (blue-green) y separación estricta de entornos. El uso de IA ha sido beneficioso pero controlado, y se recomienda para futuros proyectos mantener una política de revisión manual de cualquier artefacto generado automáticamente.
