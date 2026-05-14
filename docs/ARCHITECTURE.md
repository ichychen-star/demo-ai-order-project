# ARCHITECTURE.md — AI Vehicle Order System

Version: `v1.0`
Aligned with: `SPEC.md v1.0`
Audience: `AI Coding Agent / Solution Architect / Engineering Team`

> **AI Agent Note:** Read this file before scanning the repo. It maps every major decision to a file location, layer, and rationale so you can navigate without broad discovery.

---

## Table of Contents

1. [High Level Architecture](#1-high-level-architecture)
2. [Recommended Tech Stack](#2-recommended-tech-stack)
3. [Folder Structure](#3-folder-structure)
4. [Backend Architecture](#4-backend-architecture)
5. [AI Architecture](#5-ai-architecture)
6. [Database Design Strategy](#6-database-design-strategy)
7. [Security Design](#7-security-design)
8. [Deployment Architecture](#8-deployment-architecture)
9. [Cost Optimization Strategy](#9-cost-optimization-strategy)

---

# 1. High Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Azure Cloud                              │
│                                                                 │
│  ┌──────────────┐        ┌──────────────────────────────────┐  │
│  │   Next.js    │        │        Spring Boot Backend        │  │
│  │  Frontend    │◄──────►│                                  │  │
│  │  (Port 3000) │  REST  │  ┌────────────┐  ┌────────────┐ │  │
│  └──────────────┘  API   │  │ Controller │  │  AI Layer  │ │  │
│                          │  └─────┬──────┘  └─────┬──────┘ │  │
│  ┌──────────────┐        │        │                │        │  │
│  │    Nginx     │        │  ┌─────▼──────┐        │        │  │
│  │ Reverse Proxy│        │  │  Service   │        │        │  │
│  └──────────────┘        │  └─────┬──────┘        │        │  │
│                          │        │                │        │  │
│                          │  ┌─────▼──────┐        │        │  │
│                          │  │ Repository │        │        │  │
│                          │  └─────┬──────┘        │        │  │
│                          └────────┼───────────────┼────────┘  │
│                                   │               │            │
│                    ┌──────────────▼──┐   ┌────────▼─────────┐ │
│                    │ Azure Database  │   │  Azure OpenAI    │ │
│                    │  for MySQL      │   │  (GPT-4o / 4.1)  │ │
│                    │  (Port 3306)    │   │                  │ │
│                    └─────────────────┘   └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 1.1 Frontend

- **Framework:** Next.js 16 App Router (React 19.2)
- **Role:** SPA with SSR capability; renders order list, create/edit form, AI panel
- **Communication:** REST over HTTP to Spring Boot backend via `/api/*`
- **State:** React state + Zustand store for order form; no global auth state (MVP)
- **Key pages:** `/orders`, `/orders/new`, `/orders/:id`

## 1.2 Backend

- **Framework:** Spring Boot 4 (Java 25)
- **Role:** Business logic, pricing engine, AI orchestration, data persistence
- **Exposes:** RESTful JSON API documented with OpenAPI 3
- **PDF handling:** Apache PDFBox extracts text server-side before AI call
- **AI calls:** Delegated to `AiOrchestrationService` — backend never lets frontend call Azure OpenAI directly

## 1.3 Database

- **Service:** Azure Database for MySQL (Flexible Server)
- **Migration:** Flyway — all schema changes are versioned SQL scripts
- **ORM:** Spring Data JPA (Hibernate 7)
- **Entities:** `Order`, `Vehicle`, `VehicleOption`, `OrderOption`
- **Soft delete:** `orders.deleted = true` (no hard deletes in MVP)

## 1.4 AI Service

- **Provider:** Azure OpenAI (private endpoint within Azure VNet preferred)
- **Model:** `gpt-4o` or `gpt-4.1` deployed under your Azure subscription
- **Use cases:** parse-text, parse-pdf, generate-summary, generate-email
- **Boundary:** AI never calculates price, never validates option existence — that is backend responsibility (see SPEC §19)

---

# 2. Recommended Tech Stack

## 2.1 Frontend

| Concern | Choice | Reason |
|---|---|---|
| Framework | Next.js 16 App Router | SSR-capable, file-based routing, React 19 concurrent features |
| UI Library | MUI v6 + Tailwind CSS 4 | MUI for form components, Tailwind for layout utility classes |
| State Management | Zustand | Minimal boilerplate; order form state is local, not global auth |
| HTTP Client | Axios | Interceptors for error handling and base URL config |
| Package Manager | pnpm | Faster than npm/yarn, disk-efficient monorepo support |
| Form Validation | react-hook-form + zod | Type-safe schema validation; aligns with backend DTO contracts |
| PDF Preview | pdfjs-dist | Client-side PDF preview before upload |

## 2.2 Backend

| Concern | Choice | Reason |
|---|---|---|
| Framework | Spring Boot 4 (Java 25) | As specified; virtual threads via Project Loom for async AI calls |
| Build | Maven | As specified |
| ORM | Spring Data JPA (Hibernate 7) | Reduces boilerplate; UUID PK support out of box |
| Migration | Flyway | Versioned, auditable schema evolution |
| Validation | Jakarta Bean Validation | Declarative; integrates with Spring MVC |
| AI SDK | Spring AI (Azure OpenAI adapter) | Abstracts Azure OpenAI chat completion; prompt template support |
| PDF | Apache PDFBox 3 | As specified; text extraction only (no OCR) |
| API Docs | SpringDoc OpenAPI 3 | Auto-generates `/swagger-ui` from annotations |
| JDBC Driver | mysql-connector-j 9.x | Required for MySQL; replaces mssql-jdbc |

## 2.3 Database

| Concern | Choice |
|---|---|
| RDBMS | Azure Database for MySQL (Flexible Server) |
| Port | 3306 |
| JDBC URL format | `jdbc:mysql://<host>.mysql.database.azure.com:3306/<db>?useSSL=true&requireSSL=true&serverTimezone=UTC` |
| Hibernate Dialect | `org.hibernate.dialect.MySQLDialect` (set explicitly in `application.yml`) |
| Connection Pool | HikariCP (default in Spring Boot) |
| Schema Migration | Flyway |

## 2.4 Vector DB — Not Required for MVP

RAG is **not needed** for the MVP use case. The system parses structured vehicle order data from free text, which is a classification/extraction task — not a retrieval task. A well-crafted system prompt with few-shot examples is sufficient.

> **Post-MVP:** If AI Chat Assistant or semantic vehicle search is added (SPEC §34), introduce Azure AI Search with vector index at that point.

## 2.5 Azure Services

| Service | Purpose | MVP Required |
|---|---|---|
| Azure VM | Hosts Docker Compose (frontend + backend + nginx) | Yes |
| Azure Database for MySQL | Managed relational database (Flexible Server) | Yes |
| Azure OpenAI | GPT-4o deployment | Yes |
| Azure Key Vault | Secrets (DB password, OpenAI key) | Recommended |
| Azure Container Registry | Store Docker images for CI/CD | Optional (MVP can push direct) |
| Azure Container Apps | Production-grade alternative to VM + Docker | Post-MVP migration path |
| Azure Application Insights | Observability, token usage tracking | Recommended |

---

# 3. Folder Structure

Production-grade monorepo. Each service is independently buildable.

```
ai-vehicle-order/                   ← repo root
│
├── frontend/                       ← Next.js app
│   ├── public/
│   ├── src/
│   │   ├── app/                    ← Next.js App Router pages
│   │   │   ├── layout.tsx
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx        ← /orders (list)
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx    ← /orders/new
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx    ← /orders/:id
│   │   │   └── (disabled)/         ← stub routes for disabled menu items
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── AppShell.tsx
│   │   │   ├── order/
│   │   │   │   ├── OrderForm.tsx
│   │   │   │   ├── OrderTable.tsx
│   │   │   │   └── AiInputPanel.tsx
│   │   │   └── ai/
│   │   │       ├── AiSummaryPanel.tsx
│   │   │       └── AiEmailPanel.tsx
│   │   ├── features/
│   │   │   └── orders/
│   │   │       ├── useOrderForm.ts
│   │   │       └── useAiParse.ts
│   │   ├── services/               ← Axios API clients
│   │   │   ├── orderApi.ts
│   │   │   ├── vehicleApi.ts
│   │   │   └── aiApi.ts
│   │   ├── store/
│   │   │   └── orderStore.ts       ← Zustand store
│   │   ├── types/
│   │   │   ├── order.ts
│   │   │   ├── vehicle.ts
│   │   │   └── ai.ts
│   │   └── utils/
│   │       ├── formatPrice.ts
│   │       └── highlightAiFields.ts
│   ├── .env.local
│   ├── .env.production
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── package.json
│
├── backend/                        ← Spring Boot app
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/company/aivehicleorder/
│   │   │   │   ├── AiVehicleOrderApplication.java
│   │   │   │   ├── controller/     ← REST controllers (thin)
│   │   │   │   │   ├── OrderController.java
│   │   │   │   │   ├── VehicleController.java
│   │   │   │   │   ├── OptionController.java
│   │   │   │   │   └── AiController.java
│   │   │   │   ├── service/        ← Business logic
│   │   │   │   │   ├── OrderService.java
│   │   │   │   │   ├── PricingService.java
│   │   │   │   │   └── PdfExtractService.java
│   │   │   │   ├── ai/             ← AI orchestration (isolated)
│   │   │   │   │   ├── AiOrchestrationService.java
│   │   │   │   │   ├── PromptTemplateLoader.java
│   │   │   │   │   └── AiResponseParser.java
│   │   │   │   ├── repository/     ← Spring Data JPA repos
│   │   │   │   │   ├── OrderRepository.java
│   │   │   │   │   ├── VehicleRepository.java
│   │   │   │   │   └── VehicleOptionRepository.java
│   │   │   │   ├── entity/
│   │   │   │   │   ├── Order.java
│   │   │   │   │   ├── Vehicle.java
│   │   │   │   │   ├── VehicleOption.java
│   │   │   │   │   └── OrderOption.java
│   │   │   │   ├── dto/
│   │   │   │   │   ├── request/
│   │   │   │   │   │   ├── CreateOrderRequest.java
│   │   │   │   │   │   ├── AiParseTextRequest.java
│   │   │   │   │   │   └── AiParsePdfRequest.java
│   │   │   │   │   └── response/
│   │   │   │   │       ├── OrderResponse.java
│   │   │   │   │       └── AiParseResponse.java
│   │   │   │   ├── mapper/         ← Entity <-> DTO mapping
│   │   │   │   ├── config/
│   │   │   │   │   ├── AzureOpenAiConfig.java
│   │   │   │   │   └── WebConfig.java
│   │   │   │   ├── pricing/
│   │   │   │   │   └── PriceCalculator.java
│   │   │   │   ├── exception/
│   │   │   │   │   ├── GlobalExceptionHandler.java
│   │   │   │   │   └── AiParseException.java
│   │   │   │   └── util/
│   │   │   │       └── OrderNoGenerator.java
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       ├── application-prod.yml
│   │   │       ├── prompts/        ← Prompt templates (plain text files)
│   │   │       │   ├── parse-order-system.txt
│   │   │       │   ├── generate-summary-system.txt
│   │   │       │   └── generate-email-system.txt
│   │   │       └── db/migration/   ← Flyway scripts
│   │   │           ├── V1__create_vehicles.sql
│   │   │           ├── V2__create_vehicle_options.sql
│   │   │           ├── V3__create_orders.sql
│   │   │           ├── V4__create_order_options.sql
│   │   │           └── V5__seed_data.sql
│   │   └── test/
│   │       └── java/com/company/aivehicleorder/
│   │           ├── service/
│   │           └── ai/
│   ├── pom.xml
│   └── Dockerfile
│
├── docker/
│   ├── docker-compose.yml          ← Local dev
│   ├── docker-compose.prod.yml     ← Azure VM production
│   └── nginx/
│       └── nginx.conf
│
├── docs/
│   ├── SPEC.md
│   ├── ARCHITECTURE.md             ← this file
│   └── adr/                        ← Architecture Decision Records
│
├── .github/
│   └── workflows/
│       ├── ci.yml                  ← PR checks
│       └── deploy-prod.yml         ← Deploy to Azure VM
│
└── README.md
```

---

# 4. Backend Architecture

## 4.1 Layer Responsibilities

```
HTTP Request
    │
    ▼
┌──────────────────────────────────────────┐
│  Controller Layer                        │  ← Input validation, HTTP mapping
│  @RestController                         │    No business logic
│  OrderController / AiController          │
└─────────────────────┬────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────┐
│  Service Layer                           │  ← Business logic, transactions
│  @Service @Transactional                 │    Orchestrates repo + AI calls
│  OrderService / PricingService           │
└──────────┬──────────────────┬────────────┘
           │                  │
           ▼                  ▼
┌────────────────┐   ┌─────────────────────┐
│ Repository     │   │  AI Orchestration   │
│ Layer          │   │  Layer              │
│ @Repository    │   │  AiOrchestration    │
│ JPA Repos      │   │  Service            │
└────────┬───────┘   └──────────┬──────────┘
         │                      │
         ▼                      ▼
Azure Database for MySQL   Azure OpenAI
```

## 4.2 Controller Layer

- **Pattern:** Thin controllers — validate input, delegate to service, return DTO
- **Validation:** `@Valid` on request bodies; `GlobalExceptionHandler` catches `MethodArgumentNotValidException`
- **No business logic** in controllers; no direct repository calls from controllers

```java
// Example pattern
@PostMapping("/api/orders")
public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest req) {
    return ResponseEntity.ok(orderService.createOrder(req));
}
```

## 4.3 Service Layer

- **Transactions:** `@Transactional` on write operations in service, not controller
- **Price calculation:** `PricingService.calculate()` is pure — no I/O, deterministic
- **PDF extraction:** `PdfExtractService.extract(MultipartFile)` returns plain text; called before AI
- **AI calls:** Always delegated to `AiOrchestrationService`, never called inline in service

## 4.4 Repository Layer

- **Interface:** Spring Data JPA `JpaRepository<Entity, UUID>`
- **Custom queries:** JPQL for filtered order list (`findByDeletedFalseAndStatusContaining`)
- **Soft delete:** All order queries filter `WHERE deleted = false`

## 4.5 AI Orchestration Layer

Isolated in `ai/` package. Rest of codebase calls `AiOrchestrationService` only — never touches Azure OpenAI SDK directly.

```
AiOrchestrationService
    ├── parseOrderFromText(String text) → AiParseResponse
    ├── parseOrderFromPdf(String extractedText) → AiParseResponse
    ├── generateSummary(OrderResponse order) → String
    └── generateEmail(OrderResponse order) → String
```

- **Prompt loading:** `PromptTemplateLoader` reads `.txt` files from `resources/prompts/` at startup
- **Response parsing:** `AiResponseParser` parses JSON string from AI response; returns null for unparseable fields (never throws on missing data)
- **Timeout:** AI calls use Spring AI's async support; hard timeout at 15s to prevent request hanging
- **Error boundary:** AI failures return a graceful fallback — they do not cause order save to fail

---

# 5. AI Architecture

## 5.1 Prompt Management

Prompts are stored as plain text files in `backend/src/main/resources/prompts/`, not hardcoded in Java.

| File | Use case | Approximate tokens |
|---|---|---|
| `parse-order-system.txt` | Extract structured order fields from free text | ~300 system tokens |
| `generate-summary-system.txt` | Generate order summary paragraph | ~200 system tokens |
| `generate-email-system.txt` | Generate customer confirmation email | ~250 system tokens |

**Prompt design principles** (from SPEC §18):
- System prompt specifies: return JSON only, no price calculation, unknown field → null
- Few-shot examples embedded in system prompt (2–3 examples) to improve extraction accuracy
- Prompt injection protection: user input is passed as `user` role content, never concatenated into `system` role

```
System:  [parse-order-system.txt content + few-shot examples]
User:    [raw customer text or PDF extracted text — sanitized]
```

## 5.2 RAG Strategy

**Not required for MVP.**

The parse task is extraction from user-provided text, not retrieval from a knowledge base. A static system prompt with vehicle catalog context (5 models × 6 options = small list) is embedded directly in the prompt.

```
# Available Vehicles (embedded in system prompt)
- Mercedes-Benz GLC 300 Coupe: NT$3,450,000
- Mercedes-Benz GLC 200: NT$2,780,000
...

# Available Options
- AMG Line: NT$180,000
...
```

This avoids Azure AI Search cost entirely for MVP. Revisit when catalog exceeds ~50 entries.

## 5.3 Conversation Memory

**Not required for MVP.** Each AI call is stateless — a single request/response cycle. There is no multi-turn conversation.

- `parse-text` / `parse-pdf` → single-shot extraction
- `generate-summary` / `generate-email` → single-shot generation with order data injected

> **Post-MVP:** If AI Chat Assistant is added (SPEC §34), use Azure Cosmos DB or Redis to store conversation turns per session.

## 5.4 Token Optimization

| Strategy | Implementation |
|---|---|
| **Cap input text** | Truncate `sourceText` at 2,000 chars before sending (SPEC §10 Step 2) |
| **Cap PDF text** | Extract max 5 pages or 3,000 chars from PDFBox output |
| **Structured output** | Request JSON-only response — reduces verbose explanations in output |
| **No conversation history** | Each call is stateless — no accumulating context |
| **Compact few-shot examples** | Use short, representative examples; avoid verbose prose in prompts |
| **Model selection** | Use `gpt-4o-mini` for parse tasks (lower cost), `gpt-4o` for summary/email (quality) |

**Estimated tokens per operation:**

| Operation | Input tokens | Output tokens | Cost estimate (GPT-4o) |
|---|---|---|---|
| Parse text | ~800 | ~150 | ~$0.006 |
| Parse PDF | ~1,200 | ~150 | ~$0.009 |
| Generate summary | ~600 | ~300 | ~$0.007 |
| Generate email | ~700 | ~400 | ~$0.008 |

## 5.5 Caching Strategy

| Cache target | Strategy | TTL |
|---|---|---|
| Vehicle catalog (for prompt injection) | In-memory `@Cacheable` bean (`ConcurrentMapCache`) | App lifetime — refreshed on restart |
| AI parse result | No cache — each parse is unique user input | N/A |
| AI summary / email | Stored in `orders.ai_summary` / `orders.ai_email` columns; only regenerated on explicit user action | Persistent in DB |

Storing AI output in the `orders` table means re-opening an order shows the same AI content without a new API call.

---

# 6. Database Design Strategy

## 6.1 Relational Boundaries

```
vehicles ──────────────────────────────────────────┐
  id (PK, UUID)                                    │
  brand, model, base_price, active                 │
                                                   │ FK: orders.vehicle_id
vehicle_options ────────────────────────┐          │
  id (PK, UUID)                        │          │
  name, price, active                  │          │
                                       │          ▼
                                       │   orders
                                       │     id (PK, UUID)
                                       │     order_no (UNIQUE)
                                       │     customer_name, phone, email
                                       │     vehicle_id (FK → vehicles)
                                       │     exterior_color, interior_color
                                       │     vehicle_base_price (snapshot)
                                       │     options_total_price (snapshot)
                                       │     total_price (snapshot)
                                       │     status, source_type
                                       │     ai_summary, ai_email
                                       │     deleted, created_at, updated_at
                                       │
                                       └──────── order_options
                                                   order_id (FK → orders)
                                                   option_id (FK → vehicle_options)
                                                   option_name (snapshot)
                                                   option_price (snapshot)
                                                   PK: (order_id, option_id)
```

**Price snapshotting:** `vehicle_base_price`, `option_price`, `total_price` are stored on the order at save time. This ensures historical orders remain correct even if vehicle/option prices change later.

## 6.2 Indexing Strategy

| Table | Index | Reason |
|---|---|---|
| `orders` | `IX_orders_deleted_status` on `(deleted, status)` | Order list filter by status |
| `orders` | `IX_orders_created_at` on `(created_at DESC)` | Default sort order |
| `orders` | `UQ_orders_order_no` UNIQUE on `order_no` | Prevent duplicate order numbers |
| `orders` | `IX_orders_customer_name` on `customer_name` | Keyword search |
| `order_options` | PK `(order_id, option_id)` | Natural composite key; join performance |
| `vehicles` | `IX_vehicles_active` on `active` | Filter inactive vehicles from dropdowns |

## 6.3 Migration Naming Convention

```
V{number}__{description}.sql
V1__create_vehicles.sql
V2__create_vehicle_options.sql
V3__create_orders.sql
V4__create_order_options.sql
V5__seed_data.sql
```

Never modify committed migration files. Create a new `V{n}` script for any schema change.

---

# 7. Security Design

## 7.1 Secret Management

**MVP (Azure VM + Docker Compose):**

Secrets are injected via environment variables from a `.env` file on the VM. The `.env` file is:
- Never committed to git (`.gitignore`)
- Owned by the deploy user with `chmod 600`
- Provisioned via CI/CD pipeline secret injection (GitHub Actions Secrets)

**Recommended: Azure Key Vault integration** (add post-MVP or from day 1 if security is critical):

```
Azure Key Vault
    └── Secrets
        ├── db-password
        ├── openai-api-key
        └── openai-endpoint

Spring Boot → azure-spring-boot-starter-keyvault-secrets
    → reads secrets at startup via managed identity (no password in config)
```

## 7.2 Application Security

| Threat | Mitigation |
|---|---|
| SQL Injection | Spring Data JPA uses prepared statements; no native query string concatenation |
| Prompt Injection | User input always placed in `user` role, never in `system` role; input length capped |
| Path Traversal (PDF upload) | Validate MIME type server-side; never write file to disk — process in-memory with PDFBox stream |
| XSS | Next.js escapes React-rendered content by default; avoid `dangerouslySetInnerHTML` |
| Sensitive data in logs | Log token counts only — never log `sourceText`, AI response body, or customer PII |
| CORS | `WebConfig.java` restricts `allowedOrigins` to known frontend domain; no wildcard `*` in production |

## 7.3 Environment Variables Required

**Backend `application-prod.yml`:**

```yaml
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL}
    # Example: jdbc:mysql://<host>.mysql.database.azure.com:3306/<dbname>?useSSL=true&requireSSL=true&serverTimezone=UTC
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}

azure:
  openai:
    endpoint: ${AZURE_OPENAI_ENDPOINT}
    api-key: ${AZURE_OPENAI_API_KEY}
    deployment-name: ${AZURE_OPENAI_DEPLOYMENT_NAME}
```

**Frontend `.env.production`:**

```env
NEXT_PUBLIC_API_BASE_URL=https://your-domain.com
```

---

# 8. Deployment Architecture

## 8.1 Target: Azure VM + Docker Compose (MVP)

```
Azure VM (Ubuntu 22.04, Standard B2s)
│
└── Docker Compose
    ├── nginx          (port 80/443 → reverse proxy)
    ├── frontend       (port 3000, internal only)
    ├── backend        (port 8080, internal only)
    └── [Azure Database for MySQL]    (external managed service — not in Compose)
```

Nginx routes:
- `/* → frontend:3000`
- `/api/* → backend:8080`

## 8.2 Migration Path to Azure Container Apps (Post-MVP)

When traffic or scaling needs grow, migrate from VM + Docker Compose to Azure Container Apps with zero code changes:

```
Azure Container Apps Environment
├── frontend-app   (min 1, max 3 replicas)
├── backend-app    (min 1, max 5 replicas)
└── [Azure Database for MySQL — same external service]
```

This path requires only updated CI/CD pipeline targets; application code is unchanged.

## 8.3 GitHub Actions CI/CD

### CI Pipeline (`.github/workflows/ci.yml`)

Triggers on: `pull_request` to `main`

```
Jobs:
├── backend-ci
│   ├── mvn test
│   └── mvn verify (integration tests)
└── frontend-ci
    ├── pnpm lint
    ├── pnpm type-check
    └── pnpm build
```

### Deploy Pipeline (`.github/workflows/deploy-prod.yml`)

Triggers on: `push` to `main` (or manual dispatch)

```
Jobs:
└── deploy
    ├── Build backend Docker image → push to ACR (or GHCR)
    ├── Build frontend Docker image → push to ACR (or GHCR)
    ├── SSH to Azure VM
    ├── docker compose pull
    └── docker compose up -d --no-build
```

**GitHub Secrets required:**

| Secret | Value |
|---|---|
| `AZURE_VM_SSH_KEY` | SSH private key for VM |
| `AZURE_VM_HOST` | VM public IP |
| `SPRING_DATASOURCE_URL` | Azure Database for MySQL JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | DB username |
| `SPRING_DATASOURCE_PASSWORD` | DB password |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint URL |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API key |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | Deployed model name |

## 8.4 Staging / Production Separation

**MVP (2-week timeline):** Single environment on Azure VM is acceptable.

**Recommended staging setup (add after MVP):**

| Environment | Branch | Azure Resource | Purpose |
|---|---|---|---|
| `staging` | `develop` | Separate VM or Container App | QA testing, demo |
| `production` | `main` | Production VM | Live usage |

Use separate Azure OpenAI quota limits per environment to prevent staging from consuming production token quota.

---

# 9. Cost Optimization Strategy

## 9.1 AI Token Cost Control

| Risk | Mitigation |
|---|---|
| **Unbounded input text** | Hard cap: truncate `sourceText` at 2,000 chars; truncate PDF text at 3,000 chars before API call |
| **Repeated AI calls on same order** | Store AI output in `orders.ai_summary` / `orders.ai_email`; frontend disables re-generate button if field already populated |
| **Expensive model for simple tasks** | Use `gpt-4o-mini` for parse (extraction); use `gpt-4o` only for summary/email (quality-sensitive) |
| **No token usage visibility** | Log `promptTokens + completionTokens` per request to Application Insights; set Azure OpenAI quota limit per deployment |
| **Prompt bloat over time** | Prompts are versioned files — review and trim on each sprint; few-shot examples max 3 |
| **Azure OpenAI rate limit causes retry storm** | Implement exponential backoff in `AiOrchestrationService`; surface friendly error to user on timeout |

**Monthly token budget estimate (100 orders/month):**

| Operation | Calls/month | Tokens/call | Total tokens | Cost (GPT-4o ~$5/1M) |
|---|---|---|---|---|
| Parse text | 80 | 950 | 76,000 | $0.38 |
| Parse PDF | 20 | 1,350 | 27,000 | $0.14 |
| Generate summary | 100 | 900 | 90,000 | $0.45 |
| Generate email | 80 | 1,100 | 88,000 | $0.44 |
| **Total** | | | **281,000** | **~$1.41/month** |

Token cost is negligible at MVP scale. The risk is runaway usage from bugs (infinite retry loops).

## 9.2 Azure Infrastructure Cost Control

| Service | Cost Control |
|---|---|
| **Azure VM** | Use `Standard_B2s` (burstable, ~$30/month); stop VM outside business hours if demo-only usage |
| **Azure Database for MySQL** | Use Flexible Server `B1ms` tier for MVP (~$12–15/month); enable stop/start schedule outside business hours |
| **Azure OpenAI** | Set token quota per deployment in Azure portal; alert on 80% usage |
| **Azure Container Registry** | Free tier sufficient for MVP (10GB storage, 100GB egress) |
| **Data egress** | Frontend and backend in same Azure region as SQL and OpenAI to avoid cross-region egress fees |

**Hard budget guardrails:**
1. Set Azure Cost Alerts at $50/month threshold → email notification
2. Set Azure OpenAI deployment quota at 50K tokens/day during MVP
3. Use Azure Policy to prevent accidental creation of expensive VM SKUs

## 9.3 Development Cost Control

| Area | Practice |
|---|---|
| Local dev AI calls | Use `.env.local` with a separate Azure OpenAI deployment quota (lower limit) |
| CI/CD AI calls | Do not call Azure OpenAI in automated tests; mock `AiOrchestrationService` in unit tests |
| Docker images | Multi-stage builds to keep image size small → faster pull = lower VM startup cost |
