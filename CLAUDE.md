# CLAUDE.md — AI Vehicle Order System

> Read this file before reading any other file in the repo.
> It replaces broad repo scanning. If something is not answered here, check `docs/ARCHITECTURE.md` next, then the specific file.

---

## Project Overview

**System:** AI-assisted B2B vehicle order management system for sales representatives.

**Core flow:** Sales rep pastes customer text or uploads a PDF → AI parses it into a structured order form → rep reviews/edits → backend calculates price → order is saved → AI generates a summary and customer confirmation email draft.

**MVP scope (2-week delivery):**
- Order CRUD (`/orders`)
- AI text and PDF parsing
- Real-time price calculation
- AI summary and email draft generation
- Docker deployment to Azure VM

**Demo-first strategy:** Every task targets a working, demo-able increment. Do not build infrastructure that has no visible output in the demo flow.

**Non-production assumptions (MVP):**
- No authentication or RBAC
- No real email sending (draft generation only)
- No OCR (text-layer PDF only)
- No vehicle or option CRUD (seed data only)
- No reporting dashboard
- Single Azure VM environment (no staging/prod split until post-MVP)

---

## Tech Stack Rules

### Frontend
| Concern | Choice |
|---|---|
| Framework | Next.js 16 — App Router only (no Pages Router) |
| Language | TypeScript — strict mode |
| UI | MUI v6 + Tailwind CSS 4 (MUI for components, Tailwind for layout) |
| State | Zustand — order form state only; no global auth state |
| HTTP | Axios — one base instance in `services/apiClient.ts` |
| Forms | react-hook-form + zod — schema-validated forms only |
| Package manager | pnpm — do not use npm or yarn |

### Backend
| Concern | Choice |
|---|---|
| Framework | Spring Boot 4 + Java 25 |
| Build | Maven — do not introduce Gradle |
| ORM | Spring Data JPA (Hibernate 7) |
| Migration | Flyway — all schema changes via SQL scripts |
| Validation | Jakarta Bean Validation (`@Valid`, `@NotBlank`, etc.) |
| AI SDK | Spring AI with Azure OpenAI adapter |
| PDF | Apache PDFBox 3 — text extraction only |
| API docs | SpringDoc OpenAPI 3 (auto-generated Swagger UI) |

### Database
- Azure Database for MySQL (Flexible Server) in production
- MySQL 8.0 Docker image for local dev
- JDBC URL format: `jdbc:mysql://<host>:3306/<db>?useSSL=true&requireSSL=true&serverTimezone=UTC`

### Deployment
- Docker Compose (local dev and Azure VM production)
- Nginx reverse proxy (`/* → frontend:3000`, `/api/* → backend:8080`)
- GitHub Actions for CI and deploy

### Forbidden additions
- Do not introduce MapStruct, Lombok plugins beyond basic `@Data`/`@Builder`, or code generation tools beyond what is already in `pom.xml`.
- Do not add Redux, React Query, SWR, or any state library other than Zustand.
- Do not add Prisma, Drizzle, or any ORM on the frontend.
- Do not introduce Redis, Elasticsearch, or Azure AI Search for MVP.
- Do not add Spring Security — no auth in MVP.
- Do not introduce any new Maven dependency without stating the reason and confirming there is no existing dependency that covers the need.

---

## AI Development Principles

1. **One task at a time.** Implement exactly the scope defined in the TASKS.md task. Do not implement adjacent tasks or future features speculatively.

2. **Minimal file reads.** Each task lists `Suggested Files`. Read only those files. Do not glob the repo or read entire packages to understand context.

3. **Do not touch unrelated files.** If a task says "implement `OrderService.java`", do not refactor `OrderMapper.java` or update `application.yml` unless the task explicitly requires it.

4. **No speculative abstractions.** Do not create interfaces, base classes, generic utilities, or helper layers unless the task explicitly requires them. Three similar methods are better than a premature abstraction.

5. **No over-engineering for scale.** This is an MVP with a target of ~100 orders/month. Do not design for millions of records, distributed systems, or microservices.

6. **Prefer explicit, readable code.** A clear 20-line method is better than a clever 5-line one that requires understanding a framework abstraction.

7. **Validate, then move on.** After implementing a task: run `mvn compile` (backend) or `pnpm type-check` (frontend). If it passes, the task is done. Do not refactor to perfection.

8. **Incremental vertical slices.** When building a feature, complete backend before wiring frontend. Do not half-implement both layers simultaneously.

---

## Repository Navigation Rules

```
ai-vehicle-order/               ← repo root
├── frontend/                   ← Next.js app (pnpm workspace)
│   └── src/
│       ├── app/                ← pages (App Router)
│       ├── components/         ← UI components
│       ├── features/           ← business hooks
│       ├── services/           ← API clients (Axios)
│       ├── store/              ← Zustand stores
│       ├── types/              ← TypeScript interfaces
│       └── utils/              ← pure utility functions
├── backend/                    ← Spring Boot app (Maven)
│   └── src/main/java/com/company/aivehicleorder/
│       ├── controller/         ← REST controllers (thin)
│       ├── service/            ← business logic
│       ├── repository/         ← JPA repositories
│       ├── entity/             ← JPA entities
│       ├── dto/request/        ← inbound DTOs
│       ├── dto/response/       ← outbound DTOs
│       ├── mapper/             ← entity ↔ DTO conversion
│       ├── ai/                 ← AI orchestration (isolated)
│       ├── pricing/            ← pure pricing logic
│       ├── config/             ← Spring config beans
│       ├── exception/          ← exception classes + global handler
│       └── util/               ← utilities (OrderNoGenerator, etc.)
│   └── src/main/resources/
│       ├── application.yml     ← local dev config
│       ├── application-prod.yml← production config (env var placeholders)
│       ├── prompts/            ← AI prompt template .txt files
│       └── db/migration/       ← Flyway SQL scripts (V1–Vn)
├── docker/                     ← Compose files + Nginx config
├── docs/                       ← SPEC.md, ARCHITECTURE.md, adr/
└── .github/workflows/          ← CI/CD pipelines
```

**Navigation rules:**
- If the task is backend-only, read only `backend/` files.
- If the task is frontend-only, read only `frontend/src/` files.
- If the task is a DB migration, read only `backend/src/main/resources/db/migration/`.
- If the task is an AI feature, read `backend/src/main/java/.../ai/` and `resources/prompts/`.
- Never run a glob over the entire repo. If you do not know a file path, check this document or `docs/ARCHITECTURE.md §3` first.
- `docs/SPEC.md` is the source of truth for domain rules, UI fields, API endpoints, and validation requirements.
- `docs/ARCHITECTURE.md` is the source of truth for technical decisions, package structure, and deployment config.
- `TASKS.md` is the source of truth for task scope, dependencies, and acceptance criteria.

---

## Backend Coding Rules

### Layered Architecture — Strict

```
Controller → Service → Repository → Database
                ↓
          AI Orchestration Layer
```

- **Controllers** (`controller/`): validate input with `@Valid`, delegate 100% to service, return DTO. No business logic. No direct repository calls.
- **Services** (`service/`): all business logic. `@Transactional` on write methods. Never call Azure OpenAI directly — always via `AiOrchestrationService`.
- **Repositories** (`repository/`): Spring Data JPA only. Custom queries in JPQL, not native SQL unless unavoidable.
- **AI layer** (`ai/`): isolated. Rest of codebase calls only `AiOrchestrationService`. No other class imports the Azure OpenAI SDK directly.
- **Pricing** (`pricing/`): `PriceCalculator` is pure — no I/O, no Spring dependencies. Deterministic arithmetic only.

### DTOs — Mandatory

- Never expose JPA entities directly in controller responses.
- All inbound data uses request DTOs from `dto/request/`.
- All outbound data uses response DTOs from `dto/response/`.
- Entity ↔ DTO conversion lives only in `mapper/` classes.

### Validation

- Use Jakarta Bean Validation on all request DTOs: `@NotBlank`, `@NotNull`, `@Size`, `@Valid`.
- `GlobalExceptionHandler` catches `MethodArgumentNotValidException` and returns `ApiErrorResponse` with a list of field errors.
- Never validate in the service layer what can be validated declaratively on the DTO.

### Exception Handling

- Throw `EntityNotFoundException` (custom) for missing records → 404.
- Throw `AiParseException` (custom) for AI failures → 422 with message: `"AI 無法解析訂單內容，請手動調整。"`.
- Never return stack traces in response bodies.
- Never swallow exceptions silently — either throw a typed exception or log and rethrow.

### Logging

- Log every API request: endpoint, method, HTTP status, latency ms.
- Log AI calls: token counts (`promptTokens`, `completionTokens`) only. **Never log `sourceText`, AI response body, or any customer PII.**
- Log price calculations: `vehicleId`, option count, `totalPrice`.
- Use SLF4J (`private static final Logger log = LoggerFactory.getLogger(...)` or Lombok `@Slf4j`).

### Flyway Migration Conventions

- One concern per migration file.
- Naming: `V{n}__{description}.sql` (double underscore) — e.g., `V3__create_orders.sql`.
- **Never modify a committed migration file.** Create a new `V{n}` script for any schema change.
- All scripts must be idempotent where possible (use `IF NOT EXISTS`, `INSERT IGNORE`).
- Migrations live in `backend/src/main/resources/db/migration/`.

### API Response Format

- Success: HTTP 200/201/204 with DTO body.
- Validation error: HTTP 400 with `ApiErrorResponse { timestamp, status, message, errors: string[] }`.
- Not found: HTTP 404 with `ApiErrorResponse`.
- AI failure: HTTP 422 with `ApiErrorResponse`.
- Server error: HTTP 500 with generic `ApiErrorResponse` (no internal details).
- All endpoints documented with `@Operation` (SpringDoc) for Swagger UI.

### Avoid

- Business logic in controllers.
- Direct entity exposure in responses.
- `@Query` with native SQL unless JPQL cannot express it.
- `Optional.get()` without `isPresent()` check — use `.orElseThrow(() -> new EntityNotFoundException(...))`.
- Premature caching — add `@Cacheable` only where the ARCHITECTURE.md explicitly specifies it.

---

## Frontend Coding Rules

### Component Structure

```
components/
  layout/         ← AppShell, Sidebar (no business logic)
  order/          ← OrderForm, OrderTable, AiInputPanel
  ai/             ← AiSummaryPanel, AiEmailPanel
```

- Layout components: structural only. No API calls, no business state.
- Order/AI components: receive props; business logic lives in `features/` hooks.
- Do not create deeply nested component trees. Prefer flat composition.

### Page Structure (`app/`)

- Pages are thin orchestrators: fetch data, pass to components, handle navigation.
- No inline business logic in page files.
- Use Next.js App Router conventions — `page.tsx`, `layout.tsx`, `[id]/page.tsx`.
- Only `/orders`, `/orders/new`, `/orders/[id]` are implemented in MVP. All other routes are disabled stubs.

### API Client Strategy

- One Axios base instance: `services/apiClient.ts` — reads `NEXT_PUBLIC_API_BASE_URL`.
- Domain-specific clients: `orderApi.ts`, `vehicleApi.ts`, `aiApi.ts` — typed functions only.
- Never call `axios.get(...)` directly in components or pages — always use the typed service functions.
- Error interceptor converts HTTP errors to a typed `ApiError` — components receive typed errors, not raw Axios errors.

### State Management

- Zustand store (`store/orderStore.ts`): order form state, AI parse result, highlighted fields, calculated price, AI summary, AI email.
- Do not add global stores for order list, vehicle list, or other fetched data — manage those with local `useState` in the page component.
- Do not use React Context for anything in MVP.

### Form Strategy

- All forms use `react-hook-form` with a `zod` schema.
- Validation schemas must mirror backend DTO validation rules exactly.
- Field-level error messages displayed inline (not in a toast).
- Form values synced to Zustand store via `watch` or `onChange` — not stored redundantly in both.

### Table/Grid Strategy

- `OrderTable` component (`components/order/OrderTable.tsx`): accepts `orders[]` and callback props (`onEdit`, `onDelete`). Stateless — no internal data fetching.
- Use MUI `Table` (not DataGrid Pro — no license required for MVP).
- Status rendered as MUI `Chip` with semantic color per `OrderStatus` enum.

### Price Formatting

- All NTD amounts: `utils/formatPrice.ts` → `formatNtd(amount: number): string`.
- Do not use inline `toLocaleString()` calls in components — always use the utility.

### Avoid

- `dangerouslySetInnerHTML` — XSS risk.
- Direct `fetch()` calls — use Axios via service files.
- Importing from `@mui/x-data-grid` Pro features.
- Deeply nested Zustand state slices.
- `useEffect` for state derivation — use `useMemo` or derived values from Zustand selectors.

---

## Database Rules

### Migration-First

Schema changes must always start with a Flyway migration file. Never modify the schema by:
- Changing `spring.jpa.hibernate.ddl-auto` to `update` or `create`
- Running raw DDL in application code
- Modifying a committed migration file

### Naming Conventions

| Object | Convention | Example |
|---|---|---|
| Tables | `snake_case`, plural | `orders`, `vehicle_options` |
| Columns | `snake_case` | `customer_name`, `created_at` |
| Indexes | `IX_{table}_{columns}` | `IX_orders_deleted_status` |
| Unique indexes | `UQ_{table}_{column}` | `UQ_orders_order_no` |
| FK constraints | `FK_{table}_{ref_table}` | `FK_orders_vehicles` |
| Migration files | `V{n}__{description}.sql` | `V3__create_orders.sql` |

### Primary Keys

All tables use `CHAR(36)` UUID primary keys. Generated by Java (`UUID.randomUUID()`), not the database auto-increment.

### Soft Delete

- Orders use soft delete: `deleted BOOLEAN DEFAULT FALSE`.
- All order queries must include `WHERE deleted = FALSE`.
- No hard deletes on orders in MVP.
- `vehicles` and `vehicle_options` use `active BOOLEAN DEFAULT TRUE` for logical deactivation — no delete.

### Price Snapshotting

When an order is created or updated, snapshot the current prices into `orders.vehicle_base_price`, `orders.options_total_price`, `orders.total_price`, and `order_options.option_price`. Never join live vehicle/option prices into historical order reports.

### Audit Columns

All tables must include:
- `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- `updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` (on `orders` only)

### Required Indexes (orders table)

| Index | Columns | Purpose |
|---|---|---|
| `IX_orders_deleted_status` | `(deleted, status)` | List filter |
| `IX_orders_created_at` | `(created_at DESC)` | Default sort |
| `UQ_orders_order_no` | `order_no` UNIQUE | Deduplication |
| `IX_orders_customer_name` | `customer_name` | Keyword search |

---

## AI Feature Rules

### Scope Constraint

MVP AI features are limited to:
1. Parse customer text → structured order fields (`POST /api/ai/parse-text`)
2. Extract text from PDF → same parse flow (`POST /api/ai/parse-pdf`)
3. Generate order summary paragraph (`POST /api/ai/generate-summary`)
4. Generate customer confirmation email draft (`POST /api/ai/generate-email`)

Do not implement: autonomous agents, multi-turn conversation, RAG, vector search, fine-tuning, or function calling.

### AI Decision Boundary (from SPEC §19)

| Task | AI | Backend |
|---|---|---|
| Parse free text | YES | NO |
| Calculate price | NO | YES |
| Validate option existence | NO | YES |
| Generate summary/email | YES | NO |

AI never calculates prices. Backend never interprets natural language. This boundary is fixed.

### Prompt Management

- All prompts are plain `.txt` files in `backend/src/main/resources/prompts/`.
- Prompts are loaded at startup by `PromptTemplateLoader` — never hardcoded in Java strings.
- Three templates: `parse-order-system.txt`, `generate-summary-system.txt`, `generate-email-system.txt`.
- Vehicle catalog (5 vehicles, 6 options) is embedded directly in `parse-order-system.txt` — no dynamic catalog lookup or RAG.
- System prompt specifies: return JSON only, no price calculation, unknown field → null.
- User input is always placed in the `user` role message — never concatenated into the `system` role (prompt injection protection).

### Token Budget

| Operation | Input cap | Output type | Model |
|---|---|---|---|
| Parse text | 2,000 chars | JSON (~150 tokens) | gpt-4o-mini |
| Parse PDF | 3,000 chars (5 pages max) | JSON (~150 tokens) | gpt-4o-mini |
| Generate summary | Order fields (no cap) | Paragraph (~300 tokens) | gpt-4o |
| Generate email | Order fields (no cap) | Email draft (~400 tokens) | gpt-4o |

- Truncate `sourceText` at 2,000 chars before any API call.
- Truncate PDF extracted text at 3,000 chars.
- Do not send full conversation history — every AI call is stateless.

### Error Handling

- AI failures must never cause order save to fail. AI is supplementary, not blocking.
- Timeout: 15 seconds hard limit on all AI calls.
- On timeout or parse failure: throw `AiParseException` → return 422 with `"AI 無法解析訂單內容，請手動調整。"`.
- Log token counts per call. Never log prompt content, source text, or AI response body.

### AI Output Persistence

- `ai_summary` and `ai_email` are stored in the `orders` table.
- Re-opening an order shows stored AI content — no re-generation on load.
- Re-generation only happens on explicit button click.

---

## Azure Deployment Rules

### Docker-First

Every runnable component must have a multi-stage `Dockerfile`:
- Backend: `backend/Dockerfile` — Maven build stage + JRE runtime stage (Alpine).
- Frontend: `frontend/Dockerfile` — pnpm install stage + Next.js build stage + standalone runtime stage.
- Nginx: `nginx:alpine` official image with custom `docker/nginx/nginx.conf`.

### Environment Variables

**Never commit real credentials.** Commit only:
- `.env.example` files with variable names and no values.
- `application-prod.yml` with `${ENV_VAR_NAME}` placeholders.

All secrets are injected at runtime via Docker Compose env file or GitHub Actions Secrets.

**Required backend env vars:**
```
SPRING_DATASOURCE_URL
SPRING_DATASOURCE_USERNAME
SPRING_DATASOURCE_PASSWORD
AZURE_OPENAI_ENDPOINT
AZURE_OPENAI_API_KEY
AZURE_OPENAI_DEPLOYMENT_NAME
```

**Required frontend build arg:**
```
NEXT_PUBLIC_API_BASE_URL
```

### Nginx Routing

```nginx
location /api/ { proxy_pass http://backend:8080; }
location /     { proxy_pass http://frontend:3000; }
```

`client_max_body_size 15m;` — required for PDF upload (max 10MB per SPEC).

### Gitignore Requirements

These files must never be committed:
```
.env
.env.local
.env.production
docker/.env
*.key
*.pem
```

### CI/CD

- CI (`ci.yml`): triggers on PR to `main`. Runs `mvn test` (backend) and `pnpm build` (frontend) in parallel.
- Deploy (`deploy-prod.yml`): triggers on push to `main`. Builds Docker images → pushes to GHCR → SSH to Azure VM → `docker compose pull && up -d`.
- Backend tests in CI use H2 in-memory DB (`application-test.yml`) — never call Azure OpenAI in automated tests. Mock `AiOrchestrationService`.

---

## Task Execution Workflow

When assigned a task from `TASKS.md`, follow this sequence exactly:

**1. Read the task.**
Open `TASKS.md` and read the specific task: Goal, Scope, Out of Scope, Dependencies, Suggested Files, Acceptance Criteria.

**2. Read only the required files.**
Use the `Suggested Files` list. Read dependency task files only if you need to understand a contract (DTO, entity, interface). Do not read unrelated files.

**3. State the implementation plan.**
Before writing code, briefly state:
- What you will create or modify (file by file)
- Which design decision from ARCHITECTURE.md or SPEC.md governs each choice
- Any ambiguity you are resolving and how

**4. Implement incrementally.**
- Write one file at a time.
- Confirm the file compiles/type-checks before moving to the next.
- Do not write all files first and then debug.

**5. Validate.**
- Backend: `mvn compile` at minimum; `mvn test` if tests are part of the task.
- Frontend: `pnpm type-check` at minimum; `pnpm build` for page-level tasks.

**6. Summarize.**
After completing the task, state:
- Files created or modified
- Acceptance criteria verified
- Assumptions made
- What the next task is (from TASKS.md dependencies)
- Any blockers or risks

---

## Code Generation Constraints

### Do Not Generate

- Placeholder classes or interfaces with `// TODO: implement`.
- Abstract base classes unless the task explicitly requires them.
- Utility methods that are not called by the current task.
- Configuration beans for features not yet implemented.
- Documentation files (`.md`, `.txt`) unless the task explicitly asks.
- Test files unless the task's Acceptance Criteria require them.

### Do Not Refactor

Do not refactor existing working code as a side effect of implementing a new task. If you see a better way to write existing code, note it in your summary under "Risks/Observations" — do not change it unless it directly blocks the current task.

### Comments

Write comments only when the WHY is non-obvious: a hidden constraint, a regulatory rule, a workaround for a known bug. Do not write:
- Comments that restate what the code does (`// get all orders`)
- Comments referencing the task or PR (`// added for TASK-ORD-002`)
- Multi-paragraph docstrings on straightforward methods

### Dead Code

Do not leave unreachable code, commented-out code blocks, or unused imports. If you remove something, remove it completely.

### Code Style

- Backend: follow standard Spring Boot conventions. No wildcard imports. Package-private where possible.
- Frontend: functional components only. No class components. Arrow functions for event handlers. No `any` type — use `unknown` and narrow.

---

## Output Expectations

Every task completion must include a short structured summary:

```
## Task Complete: {TASK-ID} — {Title}

### Modified Files
- path/to/file.java — [created|modified]: one-line description of change

### Acceptance Criteria
- [x] criterion 1
- [x] criterion 2
- [ ] criterion 3 — blocked by: reason

### Assumptions
- assumption 1 (with rationale)

### Next Task
TASK-XY-00N: {Title} — depends on this task being complete.

### Risks / Blockers
- risk or blocker if any; "None" if clean
```

If a task cannot be completed as scoped (missing dependency, unclear spec), stop and state the blocker. Do not implement a guess.

---

## Quick Reference

| Question | Answer |
|---|---|
| Where is the order entity? | `backend/src/main/java/com/company/aivehicleorder/entity/Order.java` |
| Where are API clients? | `frontend/src/services/` |
| Where are Flyway scripts? | `backend/src/main/resources/db/migration/` |
| Where are AI prompts? | `backend/src/main/resources/prompts/` |
| Where is the Zustand store? | `frontend/src/store/orderStore.ts` |
| Where is CORS config? | `backend/.../config/WebConfig.java` |
| Where is exception handling? | `backend/.../exception/GlobalExceptionHandler.java` |
| Where is price logic? | `backend/.../pricing/PriceCalculator.java` |
| Where is AI logic? | `backend/.../ai/AiOrchestrationService.java` |
| What is the API base path? | `/api/` — all REST endpoints are prefixed |
| Which port is backend? | 8080 (internal); exposed via Nginx at `/api/` |
| Which port is frontend? | 3000 (internal); exposed via Nginx at `/` |
| What status values exist? | `DRAFT`, `CONFIRMED`, `CANCELLED` |
| What is the order number format? | `ORD-{YYYYMMDD}-{0001}` |
| Is auth implemented? | No — MVP explicitly excludes auth/RBAC |
| Is vector DB used? | No — system prompt embeds catalog directly |
