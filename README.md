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
| `AZURE_OPENAI_DEPLOYMENT_NAME` | Deployed model name (e.g. `gpt-4o`) |
| `AZURE_TENANT_ID` | Azure AD tenant ID |
| `AZURE_CLIENT_ID` | Service Principal application (client) ID |
| `AZURE_CLIENT_SECRET` | Service Principal client secret value |

### Frontend environment variables (`docker/frontend.env`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL (e.g. `http://localhost:8080`) |

### GitHub Actions Secrets (for CI/CD deployment)

| Secret | Description |
|---|---|
| `AZURE_VM_SSH_KEY` | SSH private key (PEM) for the `deploy` user on the Azure VM |
| `AZURE_VM_HOST` | Azure VM public IP or hostname |
| `DOMAIN` | Public domain or IP used in `NEXT_PUBLIC_API_BASE_URL` (e.g. `myapp.eastasia.cloudapp.azure.com`) |
| `NEXT_PUBLIC_API_BASE_URL` | Full URL passed to the Next.js build (e.g. `https://myapp.eastasia.cloudapp.azure.com`) |
| `SPRING_DATASOURCE_URL` | Azure Database for MySQL JDBC URL (`jdbc:mysql://<host>:3306/<db>?useSSL=true&requireSSL=true&serverTimezone=UTC`) |
| `SPRING_DATASOURCE_USERNAME` | Production DB username |
| `SPRING_DATASOURCE_PASSWORD` | Production DB password |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI resource endpoint URL |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | Deployed model name (e.g. `gpt-4o`) |
| `AZURE_TENANT_ID` | Azure AD tenant ID |
| `AZURE_CLIENT_ID` | Service Principal application (client) ID |
| `AZURE_CLIENT_SECRET` | Service Principal client secret value |

---

## Deployment

### Azure VM Prerequisites

Before the first deploy, provision the Azure VM with the following:

1. **OS**: Ubuntu 22.04 LTS (Standard B2s or larger)
2. **Ports open**: 80 (HTTP) and 22 (SSH) in the Azure Network Security Group
3. **Docker**: Install Docker Engine and Docker Compose plugin
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker deploy
   ```
4. **Deploy user**: Create a `deploy` user and add the `AZURE_VM_SSH_KEY` public key to `~/.ssh/authorized_keys`
5. **Working directory**: Create `/opt/aivehicleorder/` and copy the deployment files:
   ```bash
   sudo mkdir -p /opt/aivehicleorder/nginx
   # Copy from repo:
   cp docker/docker-compose.prod.yml /opt/aivehicleorder/
   cp docker/nginx/nginx.conf        /opt/aivehicleorder/nginx/
   cp docker/backend.env.example     /opt/aivehicleorder/backend.env
   # Edit backend.env with production credentials
   nano /opt/aivehicleorder/backend.env
   ```
6. **GHCR login** (required for `docker compose pull`):
   ```bash
   echo $GITHUB_TOKEN | docker login ghcr.io -u <github-username> --password-stdin
   ```

### Deploy manually (from local)

```bash
docker compose -f docker/docker-compose.prod.yml up -d
```

### Automated deploy (GitHub Actions)

Push to `main` or trigger `workflow_dispatch` from the Actions tab.  
The pipeline builds images → pushes to GHCR → SSH-deploys to the VM.

---

## Documentation

- [SPEC.md](docs/SPEC.md) — functional and domain specification
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — technical architecture decisions
- [TASKS.md](TASKS.md) — development task breakdown
- [CLAUDE.md](CLAUDE.md) — AI coding agent guidelines
