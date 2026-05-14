# AI Vehicle Order System

AI-assisted B2B vehicle order management system for sales representatives.

Sales reps paste customer text or upload a PDF → AI parses it into a structured order form → price is calculated → order is saved → AI generates a summary and customer confirmation email draft.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 + React 19.2 + TypeScript |
| UI | MUI v6 + Tailwind CSS 4 |
| State | Zustand |
| Backend | Java 25 + Spring Boot 4 |
| ORM | Spring Data JPA + Hibernate 7 |
| Database | MySQL 8.0 (Azure Database for MySQL in production) |
| Migration | Flyway |
| AI | Azure OpenAI (GPT-4o) via Spring AI |
| PDF | Apache PDFBox 3 |
| Deployment | Docker Compose + Azure VM + Nginx |
| CI/CD | GitHub Actions |
| Package manager | pnpm (frontend) / Maven (backend) |

---

## Prerequisites

- Node.js 20+ and pnpm 9+
- Java 25 and Maven 3.9+
- Docker Desktop
- Azure OpenAI deployment (for AI features)

---

## Local Setup

### 1. Clone and configure environment

```bash
cp docker/backend.env.example docker/backend.env
cp docker/frontend.env.example docker/frontend.env
# Edit docker/backend.env with your Azure OpenAI credentials
```

### 2. Start the database

```bash
docker compose -f docker/docker-compose.yml up mysql -d
```

### 3. Run the backend

```bash
cd backend
mvn spring-boot:run
```

### 4. Run the frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Setup

### Backend environment variables (`docker/backend.env`)

| Variable | Description |
|---|---|
| `SPRING_DATASOURCE_URL` | JDBC URL — e.g. `jdbc:mysql://mysql:3306/aivehicleorder?useSSL=false&serverTimezone=UTC` |
| `SPRING_DATASOURCE_USERNAME` | Database username |
| `SPRING_DATASOURCE_PASSWORD` | Database password |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI resource endpoint URL |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API key |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | Deployed model name (e.g. `gpt-4o`) |

### Frontend environment variables (`docker/frontend.env`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL (e.g. `http://localhost:8080`) |

### GitHub Actions Secrets (for CI/CD deployment)

| Secret | Description |
|---|---|
| `AZURE_VM_SSH_KEY` | SSH private key for the Azure VM |
| `AZURE_VM_HOST` | Azure VM public IP or hostname |
| `SPRING_DATASOURCE_URL` | Production JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | Production DB username |
| `SPRING_DATASOURCE_PASSWORD` | Production DB password |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API key |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | Deployed model name |

---

## Deployment

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) §8 for the full Azure VM + Docker Compose deployment guide.

```bash
# Production
docker compose -f docker/docker-compose.prod.yml up -d
```

---

## Documentation

- [SPEC.md](docs/SPEC.md) — functional and domain specification
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — technical architecture decisions
- [TASKS.md](TASKS.md) — development task breakdown
- [CLAUDE.md](CLAUDE.md) — AI coding agent guidelines
