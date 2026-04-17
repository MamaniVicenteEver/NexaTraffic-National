# CI/CD Pipeline and Reflection on AI Usage

## 1. Continuous Integration and Continuous Delivery (CI/CD) Strategy

The goal is to automate the build, test, and deployment of NexaTraffic microservices, ensuring every change in the repository goes through a standardized process before reaching production.

### 1.1. General Pipeline Flow

The following is the flow diagram of the CI/CD pipeline, from commit to production deployment.

```
[Git Commit] -> [Trigger] -> [Build & Test] -> [Code Analysis] -> [Build Images] -> [Push Registry] -> [Deploy Staging] -> [Smoke Tests] -> [Deploy Production (Blue-Green)]
```

**Stage Description**:

1.  **Trigger**: Each push to the `develop` or `main` branches initiates the pipeline. Also runs on pull requests.
2.  **Build & Test**: Services (Go and Java) are compiled and unit and integration tests are executed.
3.  **Code Analysis**: Static analysis (linters) and security scanning (vulnerable dependencies).
4.  **Build Images**: Docker images are built, tagged with the commit hash.
5.  **Push Registry**: Images are pushed to Azure Container Registry (ACR).
6.  **Deploy Staging**: The test environment (namespace `staging`) is updated using kubectl.
7.  **Smoke Tests**: Basic smoke tests are executed (main endpoints, connectivity to Kafka/DB).
8.  **Deploy Production**: Blue-green strategy to minimize downtime.

### 1.2. Tools Used and Justification

| Tool | Purpose | Justification |
|---|---|---|
| GitHub Actions | CI/CD Orchestrator | Native integration with the repository, no additional cost, configurable via YAML. |
| Docker | Containerization | Environment standardization, portability between stages. |
| Azure Container Registry (ACR) | Image Storage | Same region as AKS, low latency, integrated security. |
| kubectl | Deployment to Kubernetes | De facto standard, idempotent, easy to integrate. |
| Trivy | Vulnerability Scanning | Open source, detects CVEs in images and dependencies. |

### 1.3. Deployment Strategy: Blue-Green for Production

To ensure availability during deployments, the blue-green pattern is used:

-   **Blue (active)**: current version in production.
-   **Green (new)**: version with the change.
-   Traffic is gradually switched from blue to green by updating the Kubernetes service selector. If it fails, it is instantly reverted.

```
Initial State:
  Service -> selector: version=blue

Deployment:
  - Create green deployment (new version)
  - Execute smoke tests on green
  - Change service selector to version=green
  - Keep blue for 5 minutes for possible rollback
```

### 1.4. Build / Release / Run Separation (12-Factor)

-   **Build**: A binary artifact and a Docker image are generated (in CI).
-   **Release**: The image is combined with environment-specific configuration (variables, secrets). The version is tagged (e.g., `v1.2.3+staging`).
-   **Run**: The container is executed in the corresponding environment, without runtime modifications.

### 1.5. External Configuration Management

Configuration is injected via:
-   **Kubernetes ConfigMaps**: Non-sensitive values (e.g., log level).
-   **Kubernetes Secrets** (encrypted with Azure Key Vault): Database credentials, API keys.
-   **Environment variables** in pods: overridden from the above resources.

No configuration is hardcoded in the image.

---

## 2. Reflection on the Use of Artificial Intelligence in the Project

### 2.1. AI Tools Employed

-   **Language Assistants (ChatGPT, Claude)**: Generation of documentation drafts, PlantUML diagrams, gap analysis, writing justifications.
-   **GitHub Copilot**: Code suggestions for service prototypes (e.g., Kafka client, sensor mock).

### 2.2. Concrete Benefits

-   **Documentation Acceleration**: Drafts of the 5 DDD files and C4 diagrams were generated in less than 2 hours.
-   **Alternative Exploration**: The AI was asked to compare Kafka vs. RabbitMQ, and its responses helped decide on Kafka for its ecosystem and retention.
-   **Stylistic Consistency**: The AI maintained a uniform format in tables, lists, and headers.

### 2.3. Limitations and Risks Detected

-   **Hallucinations**: In one iteration, the AI suggested using Redis as the main database for tickets (incorrect due to lack of ACID). It was manually corrected.
-   **Technological Bias**: The AI always recommends Kubernetes and microservices, even for small volumes. It was validated against the real scaling requirement.
-   **Lack of Specific Domain Knowledge**: Traffic regulations (e.g., speed limits in school zones) were defined by the team, not by the AI.

### 2.4. Critical Architectural Decisions Made Without AI

-   **Choice of Azure over AWS**: Based on regional cost analysis and prior experience.
-   **Ticket Immutability**: A legal requirement that the AI could not infer.
-   **Back-pressure Strategy**: Manually designed from known resilience patterns.

### 2.5. Lessons Learned

-   AI is a valuable assistant for documentation and exploration, but does not replace human judgment.
-   All AI-generated content must be reviewed and cross-checked with reliable sources.
-   AI-generated code (Copilot) was only used for prototypes; production code requires additional testing.

### 2.6. Best Practices Applied with AI

-   **Transparency**: This document explicitly states the use of AI.
-   **Human Supervision**: Each section was edited and validated by the architect.
-   **No Critical Dependency**: The system functions without AI; it was only used to accelerate repetitive tasks.

---

## 3. Conclusion on the Pipeline and Reflection

The defined CI/CD pipeline enables reliable continuous integration, secure deployments (blue-green), and strict environment separation. The use of AI has been beneficial but controlled, and it is recommended for future projects to maintain a policy of manual review for any automatically generated artifact.
