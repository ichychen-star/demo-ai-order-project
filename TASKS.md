# TASKS.md — AI Vehicle Order System MVP

Version: `v1.0`
Aligned with: `SPEC.md v1.0`, `ARCHITECTURE.md v1.0`
Audience: `AI Coding Agent / Claude Code / Engineering Team`

---

## Development Principles

### Task Granularity Strategy

Each task targets **1–3 hours of implementation work** for a single layer or concern. Tasks are scoped to avoid cross-layer coupling within a single unit of work. A task should not mix database migration + backend service + frontend UI unless the SPEC explicitly ties them to one atomic workflow step. When a feature requires all three layers (e.g., order CRUD), it is broken into: DB migration → backend entity/repo → backend service → backend controller → frontend service → frontend UI — each as a separate task.

### AI Token Optimization Strategy

- Every task lists `Suggested Files` with exact paths so the AI agent does not need to scan the repo.
- Every task lists `Dependencies` by Task ID so the AI agent loads only the relevant prior context.
- `Out of Scope` sections explicitly fence adjacent concerns, preventing the agent from over-implementing.
- Tasks reference SPEC.md and ARCHITECTURE.md section numbers rather than restating full content, keeping prompts short.
- Tasks avoid "implement the full feature" framing — they target one class, one migration file, or one component at a time.
- Every task that produces application code includes a `Unit Tests` section (after `Suggested Files`), listing test file paths, annotations, and scenarios. DB/config/deployment tasks may set `Unit Tests: N/A`.

### Implementation Order Strategy

Phases flow vertically through the dependency graph:

```
Phase 0 (Bootstrap) → Phase 1 (DB) → Phase 2 (Backend Foundation)
→ Phase 3 (Frontend Foundation) → Phase 4 (Order Features)
→ Phase 5 (AI Features) → Phase 6 (Deployment)
```

Within Phase 4, vertical slices are preferred: complete one order feature end-to-end (backend → frontend) before starting the next. This allows demo-ready checkpoints at each slice.

### Dependency Management Strategy

- Database migrations are always the first dependency for any backend entity task.
- Backend service tasks depend on entities and repositories being complete.
- Frontend API client tasks depend on backend controllers being deployed or running locally.
- AI tasks depend on backend config and prompt files being in place.
- Deployment tasks depend on all application code being complete and tested.
- Tasks marked with `(parallel-safe)` can be implemented concurrently by separate agents without risk of conflict.

### Testing Strategy

Every task that produces application code **must** include a corresponding `Unit Tests` section specifying:
- The test file path(s) to create
- The test class name and framework annotations
- The specific scenarios to cover

**Test type by task category:**

| Task Category | Required Test Type | Framework / Annotation |
|---|---|---|
| DB Migration (`TASK-DB-*`) | None — verified by Flyway apply in Acceptance Criteria | — |
| Config / Bootstrap | None — verified by startup + curl checks | — |
| JPA Entity + Repository | `@DataJpaTest` repository test | JUnit 5 + AssertJ |
| Service layer | `@ExtendWith(MockitoExtension)` unit test | JUnit 5 + Mockito + AssertJ |
| Controller layer | `@WebMvcTest` slice test | MockMvc + Mockito |
| Mapper / Utility | Plain JUnit 5 (`@Test`) — no Spring context | JUnit 5 + AssertJ |
| AI orchestration | `@ExtendWith(MockitoExtension)` with mocked `ChatClient` | JUnit 5 + Mockito |
| Frontend (`TASK-FE-*`, `TASK-ORD-FE-*`) | Jest unit test or N/A | Jest + React Testing Library |
| Deployment (`TASK-DEPLOY-*`) | None — verified by CI pipeline check | — |

**Conventions (backend):**
- Test files live in `backend/src/test/java/com/company/aivehicleorder/`
- Mirror the main source package structure (e.g., `service/OrderServiceTest.java`)
- Use `@ActiveProfiles("test")` for all Spring slice tests
- Use `@AutoConfigureTestDatabase(replace = NONE)` with H2 config from `application-test.yml`
- Never call Azure OpenAI in tests — mock `AiOrchestrationService`
- Each test method name follows: `methodName_scenario_expectedOutcome`

**When `Unit Tests: N/A` is acceptable:**
- DB migrations, Bootstrap scaffolding, CORS/config setup, Deployment scripts

---

## Phase 0 — Project Bootstrap

### TASK-BOOT-001

**Title:** Monorepo Root Scaffold

**Goal:**
Create the top-level repository directory structure, root `.gitignore`, and `README.md` stub so all subsequent tasks have a consistent workspace to land files into.

**Scope:**
- Create directory skeleton: `frontend/`, `backend/`, `docker/`, `docs/`, `.github/workflows/`
- Create root `.gitignore` covering Java, Node, `.env` files, IDE files, Docker volumes
- Create root `README.md` with project name, tech stack table, and placeholder sections (Setup, Running, Deployment)

**Out of Scope:**
- Any application code
- Docker Compose content (TASK-BOOT-004)
- CI/CD workflow content (TASK-BOOT-007)
- Package installation

**Dependencies:**
- None

**Suggested Files:**
- `.gitignore`
- `README.md`
- `frontend/.gitkeep`
- `backend/.gitkeep`
- `docker/.gitkeep`
- `docs/.gitkeep`
- `.github/workflows/.gitkeep`

**Acceptance Criteria:**
- All listed directories exist
- `.gitignore` excludes: `*.env`, `.env.local`, `.env.production`, `target/`, `node_modules/`, `.next/`, `*.class`, `.idea/`, `.vscode/`
- `README.md` contains project title, tech stack table, and section headings

**Complexity:** S

---

### TASK-BOOT-002

**Title:** Frontend Project Initialization

**Goal:**
Initialize the Next.js 16 App Router project with pnpm, configure MUI v6 + Tailwind CSS 4, TypeScript, and set up the directory structure defined in ARCHITECTURE.md §3.

**Scope:**
- Initialize Next.js 16 with App Router and TypeScript using pnpm
- Install dependencies: `@mui/material`, `@emotion/react`, `@emotion/styled`, `tailwindcss`, `axios`, `zustand`, `react-hook-form`, `zod`
- Configure `tailwind.config.ts` and `next.config.ts`
- Create directory stubs: `src/app/`, `src/components/layout/`, `src/components/order/`, `src/components/ai/`, `src/features/orders/`, `src/services/`, `src/store/`, `src/types/`, `src/utils/`
- Create `.env.local.example` and `.env.production.example` with `NEXT_PUBLIC_API_BASE_URL=`

**Out of Scope:**
- Any page or component implementation
- API client implementation (TASK-FE-004)
- Store implementation (TASK-FE-005)

**Dependencies:**
- TASK-BOOT-001

**Suggested Files:**
- `frontend/package.json`
- `frontend/next.config.ts`
- `frontend/tailwind.config.ts`
- `frontend/tsconfig.json`
- `frontend/.env.local.example`
- `frontend/.env.production.example`

**Acceptance Criteria:**
- `pnpm install` completes without errors
- `pnpm build` succeeds on empty app
- `pnpm dev` starts without errors
- All `src/` subdirectories exist

**Complexity:** S

---

### TASK-BOOT-003

**Title:** Backend Project Initialization

**Goal:**
Initialize the Spring Boot 4 + Java 25 Maven project with all required dependencies declared in `pom.xml` and base `application.yml` configured for local development.

**Scope:**
- Create Maven project with groupId `com.company.aivehicleorder`
- Add `pom.xml` dependencies: Spring Boot Starter Web, Spring Data JPA, Spring AI Azure OpenAI, Flyway MySQL, mysql-connector-j 9.x, Apache PDFBox 3, SpringDoc OpenAPI 3, Lombok, Spring Boot Starter Validation
- Create `AiVehicleOrderApplication.java` main class
- Create `src/main/resources/application.yml` with local dev datasource (H2 for local / MySQL for full stack), Flyway config, JPA config (`spring.jpa.hibernate.ddl-auto=validate`)
- Create package stubs (empty package directories): `controller`, `service`, `repository`, `entity`, `dto/request`, `dto/response`, `mapper`, `config`, `ai`, `pricing`, `exception`, `util`
- Create `src/main/resources/prompts/` directory with `.gitkeep`

**Out of Scope:**
- Any Java class implementation beyond the main class
- Any migration SQL files (Phase 1)
- Production application-prod.yml secrets (TASK-DEPLOY-007)

**Dependencies:**
- TASK-BOOT-001

**Suggested Files:**
- `backend/pom.xml`
- `backend/src/main/java/com/company/aivehicleorder/AiVehicleOrderApplication.java`
- `backend/src/main/resources/application.yml`
- `backend/src/main/resources/prompts/.gitkeep`
- `backend/src/main/resources/db/migration/.gitkeep`

**Acceptance Criteria:**
- `mvn clean compile` succeeds
- `mvn spring-boot:run` starts (may fail on DB connection — acceptable if H2 is configured)
- All package directories exist under `src/main/java/com/company/aivehicleorder/`

**Complexity:** S

---

### TASK-BOOT-004

**Title:** Docker Compose Local Dev Setup

**Goal:**
Create the local development `docker-compose.yml` that brings up MySQL, backend, and frontend services so developers can run the full stack locally without manual setup.

**Scope:**
- Create `docker/docker-compose.yml` with services: `mysql`, `backend`, `frontend`
- MySQL service: image `mysql:8.0`, exposed port 3306, env vars for DB name/user/pass, named volume for data persistence
- Backend service: build from `backend/Dockerfile` (stub file OK at this stage), depends on mysql, env vars from `.env` file
- Frontend service: build from `frontend/Dockerfile` (stub file OK), depends on backend, env vars from `.env` file
- Create `docker/.env.example` with all required env var names (no values)

**Out of Scope:**
- Nginx reverse proxy (TASK-DEPLOY-004)
- Production Docker Compose (TASK-DEPLOY-004)
- Actual Dockerfiles content (TASK-DEPLOY-001, TASK-DEPLOY-002)

**Dependencies:**
- TASK-BOOT-001

**Suggested Files:**
- `docker/docker-compose.yml`
- `docker/.env.example`

**Acceptance Criteria:**
- `docker compose up mysql` starts MySQL and creates the specified database
- `.env.example` documents all env var names matching ARCHITECTURE.md §7.3

**Complexity:** S

---

### TASK-BOOT-005

**Title:** Environment Variable Templates

**Goal:**
Create all `.env.example` / `.env.*.example` files needed across the project so developers and CI/CD pipelines know exactly which secrets to provision, without any real values being committed.

**Scope:**
- `docker/.env.example` — all compose env vars (DB, OpenAI)
- `frontend/.env.local.example` — `NEXT_PUBLIC_API_BASE_URL`
- `frontend/.env.production.example` — `NEXT_PUBLIC_API_BASE_URL`
- `backend/src/main/resources/application-prod.yml` — placeholder config pointing to `${SPRING_DATASOURCE_URL}` etc. (no actual values)
- Add all `.env` and `.env.production` variants to root `.gitignore`
- Document all variables in `README.md` under a "Environment Setup" section

**Out of Scope:**
- Actual secret values
- Azure Key Vault integration

**Dependencies:**
- TASK-BOOT-001
- TASK-BOOT-003

**Suggested Files:**
- `docker/.env.example`
- `frontend/.env.local.example`
- `frontend/.env.production.example`
- `backend/src/main/resources/application-prod.yml`
- `README.md` (update)

**Acceptance Criteria:**
- All required env vars from ARCHITECTURE.md §7.3 and §8.3 are documented in at least one example file
- No real credentials committed
- `README.md` has a clear "Environment Setup" section

**Complexity:** S

---

### TASK-BOOT-006

**Title:** CI/CD GitHub Actions Skeleton

**Goal:**
Create the GitHub Actions workflow files as skeletons with correct job structure and trigger configuration, so the CI/CD pipeline is wired up from day one and can be filled in as code is added.

**Scope:**
- Create `.github/workflows/ci.yml`: triggers on PR to `main`; two jobs: `backend-ci` (`mvn test`) and `frontend-ci` (`pnpm lint && pnpm type-check && pnpm build`)
- Create `.github/workflows/deploy-prod.yml`: triggers on push to `main` or `workflow_dispatch`; single `deploy` job with placeholder steps for Docker build, push to registry, SSH deploy
- Both files must be syntactically valid YAML

**Out of Scope:**
- Actual Docker build/push steps (TASK-DEPLOY-005, TASK-DEPLOY-006)
- SSH deploy steps
- Secrets configuration

**Dependencies:**
- TASK-BOOT-001

**Suggested Files:**
- `.github/workflows/ci.yml`
- `.github/workflows/deploy-prod.yml`

**Acceptance Criteria:**
- Both workflow files are valid YAML (validate with `yamllint` or GitHub Actions parser)
- `ci.yml` job names match ARCHITECTURE.md §8.3
- Jobs have correct trigger events

**Complexity:** S

---

## Phase 1 — Database Foundation

### TASK-DB-001

**Title:** Flyway Migration V1 — Create Vehicles Table

**Goal:**
Create the `vehicles` table with all columns defined in SPEC.md §14.1 and the index from ARCHITECTURE.md §6.2.

**Scope:**
- Write `V1__create_vehicles.sql`
- Columns: `id` (CHAR(36) UUID PK), `brand`, `model`, `base_price` (DECIMAL 15,2), `active` (BOOLEAN DEFAULT TRUE), `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- Index: `IX_vehicles_active` on `(active)`

**Out of Scope:**
- Seed data (TASK-DB-005)
- Any other table
- JPA entity (TASK-BE-002)

**Dependencies:**
- TASK-BOOT-003

**Suggested Files:**
- `backend/src/main/resources/db/migration/V1__create_vehicles.sql`

**Unit Tests:** N/A — verified by Flyway apply + `SHOW CREATE TABLE` / `SHOW INDEX` in Acceptance Criteria.

**Acceptance Criteria:**
- Flyway applies V1 cleanly on a fresh MySQL instance (`docker compose up mysql`)
- `SHOW CREATE TABLE vehicles` matches the SPEC column list
- Index `IX_vehicles_active` exists

**Complexity:** S

---

### TASK-DB-002

**Title:** Flyway Migration V2 — Create Vehicle Options Table

**Goal:**
Create the `vehicle_options` table as defined in SPEC.md §14.2.

**Scope:**
- Write `V2__create_vehicle_options.sql`
- Columns: `id` (CHAR(36) UUID PK), `name`, `price` (DECIMAL 15,2), `active` (BOOLEAN DEFAULT TRUE), `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

**Out of Scope:**
- Seed data (TASK-DB-005)
- Any index beyond PK (not specified in ARCHITECTURE.md §6.2 for this table)

**Dependencies:**
- TASK-DB-001

**Suggested Files:**
- `backend/src/main/resources/db/migration/V2__create_vehicle_options.sql`

**Unit Tests:** N/A — verified by Flyway apply + `SHOW CREATE TABLE` / `SHOW INDEX` in Acceptance Criteria.

**Acceptance Criteria:**
- Flyway applies V1+V2 cleanly
- `SHOW CREATE TABLE vehicle_options` matches SPEC column list

**Complexity:** S

---

### TASK-DB-003

**Title:** Flyway Migration V3 — Create Orders Table

**Goal:**
Create the `orders` table with all columns from SPEC.md §14.3 and all indexes from ARCHITECTURE.md §6.2.

**Scope:**
- Write `V3__create_orders.sql`
- Columns per SPEC.md §14.3: `id`, `order_no` (UNIQUE), `customer_name`, `customer_phone`, `customer_email`, `vehicle_id` (FK → vehicles.id), `exterior_color`, `interior_color`, `vehicle_base_price`, `options_total_price`, `total_price`, `expected_delivery_month`, `status`, `source_type`, `source_text` (TEXT), `uploaded_file_name`, `ai_summary` (TEXT), `ai_email` (TEXT), `deleted` (BOOLEAN DEFAULT FALSE), `created_at`, `updated_at`
- Indexes: `IX_orders_deleted_status (deleted, status)`, `IX_orders_created_at (created_at DESC)`, `UQ_orders_order_no UNIQUE (order_no)`, `IX_orders_customer_name (customer_name)`
- FK constraint: `vehicle_id` references `vehicles(id)`

**Out of Scope:**
- `order_options` table (TASK-DB-004)
- Seed data (TASK-DB-005)

**Dependencies:**
- TASK-DB-001
- TASK-DB-002

**Suggested Files:**
- `backend/src/main/resources/db/migration/V3__create_orders.sql`

**Unit Tests:** N/A — verified by Flyway apply + `SHOW CREATE TABLE` / `SHOW INDEX` in Acceptance Criteria.

**Acceptance Criteria:**
- Flyway applies V1+V2+V3 cleanly
- All indexes exist: verify with `SHOW INDEX FROM orders`
- FK constraint on `vehicle_id` is enforced

**Complexity:** S

---

### TASK-DB-004

**Title:** Flyway Migration V4 — Create Order Options Table

**Goal:**
Create the `order_options` join table with composite PK and FK constraints as defined in SPEC.md §14.4 and ARCHITECTURE.md §6.1.

**Scope:**
- Write `V4__create_order_options.sql`
- Columns: `order_id` (CHAR(36)), `option_id` (CHAR(36)), `option_name` (snapshot, VARCHAR 100), `option_price` (snapshot, DECIMAL 15,2)
- Composite PK: `(order_id, option_id)`
- FK: `order_id` → `orders(id)`, `option_id` → `vehicle_options(id)`

**Out of Scope:**
- Seed data (TASK-DB-005)

**Dependencies:**
- TASK-DB-003

**Suggested Files:**
- `backend/src/main/resources/db/migration/V4__create_order_options.sql`

**Unit Tests:** N/A — verified by Flyway apply + `SHOW CREATE TABLE` / `SHOW INDEX` in Acceptance Criteria.

**Acceptance Criteria:**
- Flyway applies V1–V4 cleanly
- Composite PK enforced (attempt to insert duplicate `order_id + option_id` fails)
- Both FK constraints exist

**Complexity:** S

---

### TASK-DB-005

**Title:** Flyway Migration V5 — Seed Data

**Goal:**
Insert the vehicle and option seed data from SPEC.md §31 so the application has realistic master data for demos and development.

**Scope:**
- Write `V5__seed_data.sql`
- Insert 5 vehicles from SPEC.md §31 with deterministic UUIDs
- Insert 6 vehicle options from SPEC.md §31 with deterministic UUIDs
- Use `INSERT IGNORE` or check-before-insert pattern to support re-run safety

**Out of Scope:**
- Order seed data
- Mock order data for testing (add separately as a test fixture if needed)

**Dependencies:**
- TASK-DB-004

**Suggested Files:**
- `backend/src/main/resources/db/migration/V5__seed_data.sql`

**Unit Tests:** N/A — verified by Flyway apply + `SHOW CREATE TABLE` / `SHOW INDEX` in Acceptance Criteria.

**Acceptance Criteria:**
- Flyway applies V5 cleanly
- `SELECT COUNT(*) FROM vehicles` returns 5
- `SELECT COUNT(*) FROM vehicle_options` returns 6
- UUIDs are deterministic (hard-coded in SQL — not random), so re-running is idempotent

**Complexity:** S

---

## Phase 2 — Backend Foundation

### TASK-BE-001

**Title:** Spring Boot Application Config + CORS

**Goal:**
Complete `application.yml` for local development and create `WebConfig.java` for CORS configuration, so the backend is ready to serve API requests to the frontend.

**Scope:**
- Finalize `application.yml`: datasource URL/username/password for local Docker MySQL, Flyway location, JPA dialect (`org.hibernate.dialect.MySQLDialect`), HikariCP pool settings, server port 8080, SpringDoc OpenAPI path
- Create `WebConfig.java` in `config/` package: configure CORS to allow `http://localhost:3000` origin for all `/api/**` paths; no wildcard `*` in production
- Create `application-prod.yml` that reads all secrets from environment variables as shown in ARCHITECTURE.md §7.3

**Out of Scope:**
- Spring Security (out of MVP scope)
- Azure Key Vault integration
- Logging config (TASK-BE-008)

**Dependencies:**
- TASK-BOOT-003
- TASK-DB-005 (migration files must exist for JPA validate to pass)

**Suggested Files:**
- `backend/src/main/resources/application.yml`
- `backend/src/main/resources/application-prod.yml`
- `backend/src/main/java/com/company/aivehicleorder/config/WebConfig.java`

**Unit Tests:** N/A — no pure business logic; correctness verified by curl preflight check in Acceptance Criteria.

**Acceptance Criteria:**
- `mvn spring-boot:run` starts successfully with local MySQL running
- Flyway migrations V1–V5 apply on startup
- `GET http://localhost:8080/swagger-ui/index.html` returns 200
- CORS preflight `OPTIONS http://localhost:8080/api/orders` from origin `http://localhost:3000` returns 200 with correct headers

**Complexity:** S

---

### TASK-BE-002

**Title:** Vehicle and VehicleOption JPA Entities + Repositories

**Goal:**
Create the `Vehicle` and `VehicleOption` JPA entities mapped to their tables, and the corresponding Spring Data JPA repositories.

**Scope:**
- `Vehicle.java` entity: UUID PK with `@GeneratedValue`, all columns from V1 migration, `@Table(name = "vehicles")`
- `VehicleOption.java` entity: UUID PK, all columns from V2 migration, `@Table(name = "vehicle_options")`
- `VehicleRepository.java`: extends `JpaRepository<Vehicle, UUID>`; add `findAllByActiveTrueOrderByBrandAscModelAsc()`
- `VehicleOptionRepository.java`: extends `JpaRepository<VehicleOption, UUID>`; add `findAllByActiveTrueOrderByNameAsc()`
- Use Lombok `@Data`, `@NoArgsConstructor`, `@AllArgsConstructor` on entities

**Out of Scope:**
- Order entity (TASK-BE-003)
- Service or controller layer
- DTOs

**Dependencies:**
- TASK-DB-002
- TASK-BE-001

**Suggested Files:**
- `backend/src/main/java/com/company/aivehicleorder/entity/Vehicle.java`
- `backend/src/main/java/com/company/aivehicleorder/entity/VehicleOption.java`
- `backend/src/main/java/com/company/aivehicleorder/repository/VehicleRepository.java`
- `backend/src/main/java/com/company/aivehicleorder/repository/VehicleOptionRepository.java`

**Unit Tests:**
- `backend/src/test/java/com/company/aivehicleorder/repository/VehicleRepositoryTest.java`
  (`@DataJpaTest`) — covers: active filter, brand→model sort, field round-trip
- `backend/src/test/java/com/company/aivehicleorder/repository/VehicleOptionRepositoryTest.java`
  (`@DataJpaTest`) — covers: active filter, name sort, field round-trip

**Acceptance Criteria:**
- `mvn compile` succeeds
- Spring context loads with both repositories registered
- `vehicleRepository.findAllByActiveTrue()` returns 5 seed vehicles in a `@SpringBootTest` or manual verification

**Complexity:** S

---

### TASK-BE-003

**Title:** Order and OrderOption JPA Entities + Repository

**Goal:**
Create the `Order` and `OrderOption` JPA entities with all columns, relationships, and the `OrderRepository` with the custom query needed for soft-delete filtered listing.

**Scope:**
- `Order.java` entity: UUID PK, all columns from V3 migration, `@ManyToOne` to `Vehicle` on `vehicleId`, `@OneToMany` to `OrderOption` with `CascadeType.ALL, orphanRemoval = true`, `@PrePersist`/`@PreUpdate` for `updatedAt`
- `OrderOption.java` entity: composite PK with `@EmbeddableId` or `@IdClass`, snapshot columns `optionName` and `optionPrice`, `@ManyToOne` to `Order` and `VehicleOption`
- `OrderRepository.java`: extends `JpaRepository<Order, UUID>`; custom JPQL: `findByDeletedFalseAndStatusContainingAndCustomerNameContaining` for search; `findByDeletedFalse` for list
- Status enum or constants class for: `DRAFT`, `CONFIRMED`, `CANCELLED`

**Out of Scope:**
- Service layer logic
- DTO mapping
- Price calculation

**Dependencies:**
- TASK-DB-004
- TASK-BE-002

**Suggested Files:**
- `backend/src/main/java/com/company/aivehicleorder/entity/Order.java`
- `backend/src/main/java/com/company/aivehicleorder/entity/OrderOption.java`
- `backend/src/main/java/com/company/aivehicleorder/repository/OrderRepository.java`
- `backend/src/main/java/com/company/aivehicleorder/entity/OrderStatus.java`

**Unit Tests:**
- `backend/src/test/java/com/company/aivehicleorder/repository/OrderRepositoryTest.java`
  (`@DataJpaTest`) — covers: soft-delete filter, status+name search, @PrePersist lifecycle,
  OrderOption cascade save/delete

**Acceptance Criteria:**
- `mvn compile` succeeds
- Spring context loads with `OrderRepository` registered
- `Order` entity mapped correctly: `@Table(name = "orders")`, all column names match V3 migration
- Soft delete query `findByDeletedFalse` returns only non-deleted orders

**Complexity:** M

---

### TASK-BE-004 ✅

**Title:** Request and Response DTOs

**Goal:**
Create all DTO classes for the Order and AI APIs so subsequent controller and service tasks have a stable data contract to work against.

**Scope:**
- Request DTOs in `dto/request/`:
  - `CreateOrderRequest.java`: all fields from SPEC.md §11.1, Bean Validation annotations (`@NotBlank`, `@NotNull`), `List<UUID> optionIds`
  - `UpdateOrderRequest.java`: same fields as Create, all optional for partial update
  - `CalculatePriceRequest.java`: `vehicleId (UUID)`, `optionIds (List<UUID>)`
  - `AiParseTextRequest.java`: `sourceText (String, @Size(max=2000))`
- Response DTOs in `dto/response/`:
  - `OrderResponse.java`: all order fields including nested `List<OrderOptionResponse>`, `vehicleName`
  - `OrderOptionResponse.java`: `optionId`, `optionName`, `optionPrice`
  - `AiParseResponse.java`: all fields from SPEC.md §17.2 including `confidence` and `missingFields`
  - `VehicleResponse.java`: `id`, `brand`, `model`, `basePrice`
  - `VehicleOptionResponse.java`: `id`, `name`, `price`
  - `PriceCalculationResponse.java`: `vehicleBasePrice`, `optionsTotalPrice`, `totalPrice`
  - `ApiErrorResponse.java`: `timestamp`, `status`, `message`, `errors (List<String>)`

**Out of Scope:**
- Mapper implementation (TASK-BE-005)
- Controller implementation

**Dependencies:**
- TASK-BE-003

**Suggested Files:**
- `backend/src/main/java/com/company/aivehicleorder/dto/request/CreateOrderRequest.java`
- `backend/src/main/java/com/company/aivehicleorder/dto/request/UpdateOrderRequest.java`
- `backend/src/main/java/com/company/aivehicleorder/dto/request/CalculatePriceRequest.java`
- `backend/src/main/java/com/company/aivehicleorder/dto/request/AiParseTextRequest.java`
- `backend/src/main/java/com/company/aivehicleorder/dto/response/OrderResponse.java`
- `backend/src/main/java/com/company/aivehicleorder/dto/response/AiParseResponse.java`
- `backend/src/main/java/com/company/aivehicleorder/dto/response/VehicleResponse.java`
- `backend/src/main/java/com/company/aivehicleorder/dto/response/VehicleOptionResponse.java`
- `backend/src/main/java/com/company/aivehicleorder/dto/response/PriceCalculationResponse.java`
- `backend/src/main/java/com/company/aivehicleorder/dto/response/ApiErrorResponse.java`

**Unit Tests:**
- `backend/src/test/java/com/company/aivehicleorder/dto/DtoValidationTest.java`
  (plain JUnit 5 + Hibernate Validator) — covers: CreateOrderRequest required-field violations,
  optional fields, AiParseTextRequest size/blank constraints, CalculatePriceRequest null vehicleId,
  AiParseResponse SPEC §17.2 field mapping, OrderResponse builder with vehicleName + nested options

**Acceptance Criteria:**
- `mvn compile` succeeds ✅
- All request DTOs have Bean Validation annotations on required fields matching SPEC.md §20 ✅
- `AiParseResponse` fields exactly match SPEC.md §17.2 JSON structure ✅

**Complexity:** M

---

### TASK-BE-005 ✅

**Title:** Entity-DTO Mapper

**Goal:**
Create the mapper class that converts between JPA entities and DTOs, so service and controller layers have a clean mapping layer without inline conversion code.

**Scope:**
- `OrderMapper.java` in `mapper/` package (use plain Java static methods — no MapStruct to keep dependencies minimal):
  - `toResponse(Order order) → OrderResponse`
  - `toEntity(CreateOrderRequest req, Vehicle vehicle, List<VehicleOption> options) → Order` (partial — price fields set by PricingService)
  - `toOrderOptionResponse(OrderOption oo) → OrderOptionResponse`
- `VehicleMapper.java`:
  - `toResponse(Vehicle v) → VehicleResponse`
- `VehicleOptionMapper.java`:
  - `toResponse(VehicleOption vo) → VehicleOptionResponse`

**Out of Scope:**
- Service logic
- Price calculation in mapper (mapping only — prices come from PricingService)

**Dependencies:**
- TASK-BE-004

**Suggested Files:**
- `backend/src/main/java/com/company/aivehicleorder/mapper/OrderMapper.java`
- `backend/src/main/java/com/company/aivehicleorder/mapper/VehicleMapper.java`
- `backend/src/main/java/com/company/aivehicleorder/mapper/VehicleOptionMapper.java`

**Unit Tests:**
- `backend/src/test/java/com/company/aivehicleorder/mapper/MapperTest.java`
  (plain JUnit 5) — covers: toResponse scalar fields, vehicleName concatenation, nested options,
  toEntity non-price fields, price fields not set by mapper, OrderOption snapshot creation,
  VehicleMapper and VehicleOptionMapper field mapping

**Acceptance Criteria:**
- `mvn compile` succeeds ✅
- Unit test: `OrderMapper.toResponse(order)` maps all fields including nested `OrderOption` list ✅
- No business logic in mappers — only field assignment ✅

**Complexity:** S

---

### TASK-BE-006 ✅

**Title:** Global Exception Handler + Custom Exceptions

**Goal:**
Create the `GlobalExceptionHandler` with `@RestControllerAdvice` to return consistent `ApiErrorResponse` JSON for validation errors, not-found errors, and AI failures.

**Scope:**
- `GlobalExceptionHandler.java`:
  - Handle `MethodArgumentNotValidException` → 400 with list of field errors
  - Handle `EntityNotFoundException` (custom) → 404
  - Handle `AiParseException` (custom) → 422 with user-friendly message matching SPEC.md §21
  - Handle `MaxUploadSizeExceededException` → 413 (for PDF > 10MB)
  - Handle generic `Exception` → 500 with generic message (no stack trace in response body)
- `AiParseException.java`: runtime exception for AI parse failures
- `EntityNotFoundException.java`: runtime exception for missing entities
- All responses use `ApiErrorResponse` DTO from TASK-BE-004

**Out of Scope:**
- Spring Security exceptions
- AI retry logic (TASK-AI-003)

**Dependencies:**
- TASK-BE-004

**Suggested Files:**
- `backend/src/main/java/com/company/aivehicleorder/exception/GlobalExceptionHandler.java`
- `backend/src/main/java/com/company/aivehicleorder/exception/AiParseException.java`
- `backend/src/main/java/com/company/aivehicleorder/exception/EntityNotFoundException.java`

**Unit Tests:**
- `backend/src/test/java/com/company/aivehicleorder/exception/GlobalExceptionHandlerTest.java`
  (plain JUnit 5, no Spring context — avoids Byte Buddy Java 26 limitation) — covers:
  400 validation field errors list, 404 JSON response, 422 user-friendly message,
  422 internal message not exposed, 413 status, 500 no stack trace, 500 internal details hidden

**Acceptance Criteria:**
- Unit test: POST to any endpoint with invalid body returns 400 with `errors` list ✅
- Unit test: throw `EntityNotFoundException` → response is 404 JSON (not HTML) ✅
- AI parse failure returns 422 with message `"AI 無法解析訂單內容，請手動調整。"` ✅
- No Java stack trace in any response body ✅

**Complexity:** S

---

### TASK-BE-007 ✅

**Title:** Order Number Generator Utility

**Goal:**
Create the `OrderNoGenerator` utility class that generates sequential, human-readable order numbers (e.g., `ORD-20260514-001`) for use in `OrderService.createOrder()`.

**Scope:**
- `OrderNoGenerator.java` in `util/` package
- Format: `ORD-{YYYYMMDD}-{4-digit-sequence}` — sequence is zero-padded, reset per day
- Strategy: query `ORDER BY created_at DESC LIMIT 1` for today's orders, increment sequence; if no orders today, start at `0001`
- Method signature: `String generate(LocalDate date, long todayOrderCount)`

**Out of Scope:**
- Integration with `OrderService` (done in TASK-ORD-001)
- Database persistence of the counter (derived from order count, not a separate sequence table)

**Dependencies:**
- TASK-BE-003

**Suggested Files:**
- `backend/src/main/java/com/company/aivehicleorder/util/OrderNoGenerator.java`

**Unit Tests:**
- `backend/src/test/java/com/company/aivehicleorder/util/OrderNoGeneratorTest.java`
  (plain JUnit 5) — covers: first order → 0001, sixth order → 0006, date YYYYMMDD format,
  zero-padding, large count

**Acceptance Criteria:**
- Unit test: `generate(LocalDate.of(2026,5,14), 0)` → `"ORD-20260514-0001"` ✅
- Unit test: `generate(LocalDate.of(2026,5,14), 5)` → `"ORD-20260514-0006"` ✅
- No dependency on database within the utility class itself ✅

**Complexity:** S

---

### TASK-BE-008 ✅

**Title:** Application Logging Configuration

**Goal:**
Configure structured logging so all required log types from SPEC.md §23 are captured, without logging sensitive customer data or AI prompt content.

**Scope:**
- Configure Logback in `application.yml`: log level INFO for production, DEBUG for local
- Create `LoggingFilter.java` (servlet filter or Spring interceptor): log each API request with endpoint, method, response status, and latency in ms
- Add log statements for price calculation in `PricingService` (placeholder — will be called when service is implemented): `log.info("Price calc: vehicleId={}, options={}, total={}", ...)`
- Add SLF4J logger to `GlobalExceptionHandler` for error logging with stack trace
- Ensure AI request logging pattern is defined: log `promptTokens + completionTokens`, never `sourceText` or response body

**Out of Scope:**
- Application Insights integration (post-MVP)
- MDC tracing correlation (post-MVP)

**Dependencies:**
- TASK-BE-001

**Suggested Files:**
- `backend/src/main/resources/application.yml` (update logging section)
- `backend/src/main/java/com/company/aivehicleorder/util/LoggingFilter.java`

**Acceptance Criteria:**
- API request log line appears for every HTTP call: `INFO - GET /api/orders 200 45ms`
- Error logs include stack trace for 5xx errors
- No customer name, phone, email, or source text appears in any log output

**Complexity:** S

---

## Phase 3 — Frontend Foundation

### TASK-FE-001 ✅

**Title:** TypeScript Type Definitions

**Goal:**
Define all TypeScript interfaces and types used across the frontend, so all subsequent component and service tasks have a shared, compile-checked type system.

**Scope:**
- `types/order.ts`: `Order`, `OrderOption`, `CreateOrderRequest`, `UpdateOrderRequest`, `CalculatePriceRequest`, `PriceCalculationResponse`, `OrderStatus` enum
- `types/vehicle.ts`: `Vehicle`, `VehicleOption`
- `types/ai.ts`: `AiParseResponse`, `AiParseTextRequest`, `AiGenerateRequest`, `AiGenerateResponse`
- Types must exactly match the backend DTO structures from TASK-BE-004

**Out of Scope:**
- Any React components
- API client implementation

**Dependencies:**
- TASK-BOOT-002
- TASK-BE-004 (types must match DTO contracts)

**Suggested Files:**
- `frontend/src/types/order.ts`
- `frontend/src/types/vehicle.ts`
- `frontend/src/types/ai.ts`

**Acceptance Criteria:**
- `pnpm type-check` passes with zero errors
- `OrderStatus` enum values match backend: `DRAFT`, `CONFIRMED`, `CANCELLED`
- `AiParseResponse` fields exactly match SPEC.md §17.2

**Complexity:** S

---

### TASK-FE-002

**Title:** Axios API Client Setup

**Goal:**
Create the typed Axios API clients for orders, vehicles, and AI endpoints so all subsequent feature components have a single, consistent HTTP layer with base URL and error handling.

**Scope:**
- Create `services/apiClient.ts`: base Axios instance reading `NEXT_PUBLIC_API_BASE_URL`, request/response interceptors, error interceptor that converts HTTP errors to a consistent `ApiError` type
- Create `services/orderApi.ts`: typed functions for all Order endpoints from SPEC.md §16.1 and §16.3
- Create `services/vehicleApi.ts`: typed functions for `GET /api/vehicles` and `GET /api/options`
- Create `services/aiApi.ts`: typed functions for all AI endpoints from SPEC.md §16.4
- All functions return typed promises using types from TASK-FE-001

**Out of Scope:**
- Auth headers (no auth in MVP)
- React hooks wrapping API calls (TASK-FE-005)
- Retry logic

**Dependencies:**
- TASK-FE-001
- TASK-BOOT-002

**Suggested Files:**
- `frontend/src/services/apiClient.ts`
- `frontend/src/services/orderApi.ts`
- `frontend/src/services/vehicleApi.ts`
- `frontend/src/services/aiApi.ts`

**Acceptance Criteria:**
- `pnpm type-check` passes
- All API functions have correct TypeScript return types
- Base URL is read from `NEXT_PUBLIC_API_BASE_URL` env var
- Error interceptor converts any HTTP 4xx/5xx to a typed `ApiError`

**Complexity:** S

---

### TASK-FE-003

**Title:** App Shell Layout — Sidebar + Main Content Area

**Goal:**
Create the three-column `AppShell` layout component and `Sidebar` navigation component matching the SPEC.md §8 and §9 layout specification.

**Scope:**
- `components/layout/AppShell.tsx`: MUI layout with persistent sidebar (240px), main content area, right panel slot
- `components/layout/Sidebar.tsx`: MUI Drawer with navigation list matching SPEC.md §9 menu items; active item highlighted; inactive items rendered as disabled (not clickable) with visual indicator
- `app/layout.tsx`: wraps all pages in `AppShell`
- Tailwind utility classes for spacing; MUI components for interactive elements
- Responsive: sidebar collapses to icon-only on small screens (mobile-friendly but not fully mobile-optimized for MVP)

**Out of Scope:**
- Right AI panel content (TASK-AI-011)
- Individual page content
- Route implementation

**Dependencies:**
- TASK-BOOT-002

**Suggested Files:**
- `frontend/src/components/layout/AppShell.tsx`
- `frontend/src/components/layout/Sidebar.tsx`
- `frontend/src/app/layout.tsx`

**Acceptance Criteria:**
- `pnpm dev` renders AppShell with sidebar visible at `http://localhost:3000`
- All 7 menu items from SPEC.md §9 are rendered
- Only "Vehicle Orders" (`/orders`) is active/clickable; all others are visually disabled
- No TypeScript errors

**Complexity:** M

---

### TASK-FE-004

**Title:** Zustand Order Store

**Goal:**
Create the Zustand store for order form state management, so the order form, AI panel, and price display share state without prop-drilling.

**Scope:**
- `store/orderStore.ts`: Zustand store with state shape:
  - `currentOrder: Partial<CreateOrderRequest>` — form field values
  - `aiParseResult: AiParseResponse | null` — latest AI parse result
  - `aiHighlightedFields: Set<string>` — field names auto-filled by AI (for highlighting)
  - `calculatedPrice: PriceCalculationResponse | null`
  - `aiSummary: string | null`
  - `aiEmail: string | null`
  - `isAiParsing: boolean`
  - `isSaving: boolean`
- Actions: `setField`, `setAiResult`, `setPriceResult`, `resetForm`, `setAiSummary`, `setAiEmail`

**Out of Scope:**
- Order list state (fetched and managed locally in the list page)
- API calls (API calls are in service files or hooks)

**Dependencies:**
- TASK-FE-001

**Suggested Files:**
- `frontend/src/store/orderStore.ts`

**Acceptance Criteria:**
- `pnpm type-check` passes
- Store exports are correctly typed with Zustand's `create`
- `aiHighlightedFields` updates when `setAiResult` is called

**Complexity:** S

---

### TASK-FE-005

**Title:** Reusable OrderTable Component

**Goal:**
Create the `OrderTable` MUI DataGrid (or MUI Table) component matching the Order List table specification from SPEC.md §7.1, so it can be used on the `/orders` list page.

**Scope:**
- `components/order/OrderTable.tsx`: accepts `orders: Order[]`, `onEdit(id: string)`, `onDelete(id: string)` props
- Columns per SPEC.md §7.1: Order No, Customer Name, Vehicle Model, Total Price (formatted NTD), Status (chip), Delivery Month, Created At, Actions (Edit/Delete icon buttons)
- Status column: MUI Chip with color coding — DRAFT=default, CONFIRMED=success, CANCELLED=error
- Total price formatted with `Intl.NumberFormat` for Taiwan locale (NTD)
- Delete action triggers a confirmation dialog before calling `onDelete`
- `utils/formatPrice.ts`: export `formatNtd(amount: number): string`

**Out of Scope:**
- Data fetching (done in the page component)
- Search/filter controls (separate component in TASK-ORD-005)
- Pagination (not specified for MVP)

**Dependencies:**
- TASK-FE-001
- TASK-BOOT-002

**Suggested Files:**
- `frontend/src/components/order/OrderTable.tsx`
- `frontend/src/utils/formatPrice.ts`

**Acceptance Criteria:**
- `pnpm type-check` passes
- Component renders with mock `Order[]` data in Storybook or `pnpm dev` test
- Status chips render correct MUI color variants
- Delete confirmation dialog appears before calling `onDelete`

**Complexity:** M

---

### TASK-FE-006

**Title:** Route Stubs for Order Pages

**Goal:**
Create the Next.js App Router page stubs for `/orders`, `/orders/new`, and `/orders/:id` so routing works and each page has a placeholder ready for feature implementation.

**Scope:**
- `app/orders/page.tsx`: stub returning `<div>Order List Page</div>` wrapped in `AppShell`
- `app/orders/new/page.tsx`: stub returning `<div>New Order Page</div>`
- `app/orders/[id]/page.tsx`: stub returning `<div>Edit Order {params.id}</div>`
- `app/(disabled)/dashboard/page.tsx`, `app/(disabled)/vehicles/page.tsx`, etc.: stub pages for disabled menu items returning "Coming Soon" placeholder

**Out of Scope:**
- Any actual page content (implemented in Phase 4 tasks)

**Dependencies:**
- TASK-FE-003

**Suggested Files:**
- `frontend/src/app/orders/page.tsx`
- `frontend/src/app/orders/new/page.tsx`
- `frontend/src/app/orders/[id]/page.tsx`
- `frontend/src/app/(disabled)/dashboard/page.tsx`

**Acceptance Criteria:**
- `pnpm build` succeeds
- Navigating to `/orders`, `/orders/new`, `/orders/1` renders stub content without 404
- No TypeScript errors

**Complexity:** S

---

## Phase 4 — Core Order Features

### TASK-ORD-001

**Title:** PricingService — Pure Price Calculation

**Goal:**
Implement the `PricingService` with the pricing formula from SPEC.md §15, as a pure service with no I/O, deterministic and unit-testable in isolation.

**Scope:**
- `PricingService.java` in `service/` package
- `calculate(BigDecimal basePrice, List<BigDecimal> optionPrices): PriceCalculationResult` — inner record or dedicated class
- Formula: `totalPrice = basePrice + sum(optionPrices)`
- Companion method: `calculateFromIds(UUID vehicleId, List<UUID> optionIds)` — loads vehicle and options via repository, calls `calculate()`
- `PriceCalculator.java` in `pricing/` package: static utility wrapping pure arithmetic (no Spring dependency)

**Out of Scope:**
- Controller endpoint (TASK-ORD-003)
- AI price involvement (AI never calculates price per SPEC.md §19)

**Dependencies:**
- TASK-BE-002

**Suggested Files:**
- `backend/src/main/java/com/company/aivehicleorder/service/PricingService.java`
- `backend/src/main/java/com/company/aivehicleorder/pricing/PriceCalculator.java`
- `backend/src/test/java/com/company/aivehicleorder/service/PricingServiceTest.java`

**Acceptance Criteria:**
- Unit test: `calculate(3450000, [180000, 120000])` → `totalPrice = 3750000`
- Unit test: `calculate(2780000, [])` → `totalPrice = 2780000`
- No I/O in `PriceCalculator` — pure arithmetic only
- Response time < 300ms per SPEC.md §24

**Complexity:** S

---

### TASK-ORD-002

**Title:** OrderService — CRUD Operations

**Goal:**
Implement `OrderService` with create, read, update, and soft-delete operations, integrating `PricingService`, `OrderNoGenerator`, and the order repositories.

**Scope:**
- `OrderService.java`:
  - `createOrder(CreateOrderRequest req): OrderResponse` — generates order number, calculates price via `PricingService`, maps to entity, saves with snapshot prices in `order_options`
  - `getOrder(UUID id): OrderResponse` — throws `EntityNotFoundException` if not found or deleted
  - `listOrders(String keyword, String status): List<OrderResponse>` — soft-delete filtered, search by customer name and status
  - `updateOrder(UUID id, UpdateOrderRequest req): OrderResponse` — recalculates price if vehicle or options changed
  - `deleteOrder(UUID id): void` — sets `deleted = true`, does not hard delete
- All write operations are `@Transactional`

**Out of Scope:**
- Controller HTTP layer (TASK-ORD-003)
- AI summary/email fields (populated by AI tasks)

**Dependencies:**
- TASK-ORD-001
- TASK-BE-005
- TASK-BE-006
- TASK-BE-007

**Suggested Files:**
- `backend/src/main/java/com/company/aivehicleorder/service/OrderService.java`
- `backend/src/test/java/com/company/aivehicleorder/service/OrderServiceTest.java`

**Acceptance Criteria:**
- Unit test: `createOrder()` persists order with correct `totalPrice`
- Unit test: `deleteOrder()` sets `deleted = true` without removing record
- Unit test: `listOrders()` excludes soft-deleted orders
- `createOrder()` saves `option_name` and `option_price` snapshots in `order_options`

**Complexity:** M

---

### TASK-ORD-003

**Title:** Order CRUD + Price Controller

**Goal:**
Implement the thin `OrderController` and `VehicleController` REST controllers that expose all endpoints from SPEC.md §16.1, §16.2, and §16.3.

**Scope:**
- `OrderController.java`:
  - `GET /api/orders` — with optional `?keyword=&status=` query params
  - `GET /api/orders/{id}`
  - `POST /api/orders` — `@Valid @RequestBody CreateOrderRequest`
  - `PUT /api/orders/{id}` — `@Valid @RequestBody UpdateOrderRequest`
  - `DELETE /api/orders/{id}`
  - `POST /api/orders/calculate-price` — `@Valid @RequestBody CalculatePriceRequest`
- `VehicleController.java`: `GET /api/vehicles`, `GET /api/options`
- All controllers delegate 100% to service layer — no business logic in controllers
- SpringDoc `@Operation` annotations for Swagger UI

**Out of Scope:**
- AI endpoints (TASK-AI-006, TASK-AI-008)
- Frontend integration (TASK-ORD-005)

**Dependencies:**
- TASK-ORD-002
- TASK-BE-001

**Suggested Files:**
- `backend/src/main/java/com/company/aivehicleorder/controller/OrderController.java`
- `backend/src/main/java/com/company/aivehicleorder/controller/VehicleController.java`
- `backend/src/main/java/com/company/aivehicleorder/controller/OptionController.java`

**Acceptance Criteria:**
- All CRUD endpoints return correct HTTP status codes (201 for POST, 200 for GET/PUT, 204 for DELETE)
- `POST /api/orders` with missing `customerName` returns 400 with validation error
- `GET /api/vehicles` returns 5 seed vehicles
- `POST /api/orders/calculate-price` returns `vehicleBasePrice`, `optionsTotalPrice`, `totalPrice`
- Swagger UI documents all endpoints at `/swagger-ui/index.html`

**Complexity:** M

---

### TASK-ORD-004

**Title:** Order List Page — Search + Table UI

**Goal:**
Implement the `/orders` list page with keyword search, status filter, and the `OrderTable` component wired to the real API.

**Scope:**
- `app/orders/page.tsx`: replace stub with full page
- Fetch orders via `orderApi.listOrders()` on mount and on search change
- Search controls: MUI `TextField` for keyword, MUI `Select` for status (DRAFT, CONFIRMED, CANCELLED, All), matching SPEC.md §7.1
- "建立訂單" button links to `/orders/new`
- Wire `OrderTable` with `onEdit` (navigate to `/orders/:id`) and `onDelete` (call API then refetch)
- Loading state with MUI `CircularProgress`; error state with MUI `Alert`

**Out of Scope:**
- Order form implementation (TASK-ORD-005)
- Pagination

**Dependencies:**
- TASK-FE-005
- TASK-FE-006
- TASK-FE-002
- TASK-ORD-003 (backend must be running)

**Suggested Files:**
- `frontend/src/app/orders/page.tsx`

**Acceptance Criteria:**
- Page renders order list fetched from `GET /api/orders`
- Keyword search triggers `GET /api/orders?keyword=X` and table updates
- Status filter triggers `GET /api/orders?status=X`
- Delete button triggers confirmation → `DELETE /api/orders/:id` → list refreshes
- "建立訂單" button navigates to `/orders/new`

**Complexity:** M

---

### TASK-ORD-005

**Title:** Order Form — Base Fields + Vehicle/Color Selection

**Goal:**
Implement the order form base section: customer info fields, vehicle dropdown, exterior/interior color inputs, and delivery month picker.

**Scope:**
- `components/order/OrderForm.tsx`: `react-hook-form` with `zod` schema validation
- Fields: `customerName`, `customerPhone`, `customerEmail`, `vehicleId` (Select populated from `GET /api/vehicles`), `exteriorColor` (text input), `interiorColor` (text input), `expectedDeliveryMonth` (month picker), `status` (Select)
- Validation matches SPEC.md §20: `customerName` required, `vehicleId` required, `expectedDeliveryMonth` required
- Field values wired to Zustand `orderStore`
- `features/orders/useOrderForm.ts`: custom hook encapsulating `react-hook-form` setup, vehicle fetch, and Zustand sync

**Out of Scope:**
- Options selection (TASK-ORD-006)
- AI field highlighting (TASK-AI-010)
- Price display (TASK-ORD-006)
- Save action (TASK-ORD-007)

**Dependencies:**
- TASK-FE-004
- TASK-FE-004 (Zustand store)
- TASK-ORD-003 (backend must serve vehicles)

**Suggested Files:**
- `frontend/src/components/order/OrderForm.tsx`
- `frontend/src/features/orders/useOrderForm.ts`

**Acceptance Criteria:**
- Vehicle dropdown populated with 5 seed vehicles
- Required field validation shows inline error on submit attempt
- Form values persist in Zustand store on change
- `pnpm type-check` passes

**Complexity:** M

---

### TASK-ORD-006

**Title:** Order Form — Options Selection + Real-Time Price Calculation

**Goal:**
Add the vehicle options checkbox list and real-time price display to the order form, triggering `POST /api/orders/calculate-price` on vehicle or option change.

**Scope:**
- Add options section to `OrderForm.tsx`: `FormGroup` with `Checkbox` per option loaded from `GET /api/options`
- Price summary display: vehicle base price, options total, grand total — updated in real time
- Trigger `calculatePrice()` from `orderApi.ts` on `vehicleId` change or any `optionIds` change (debounce 300ms)
- Store result in `orderStore.calculatedPrice`
- `utils/formatPrice.ts` used for NTD display

**Out of Scope:**
- Save action (TASK-ORD-007)
- AI-driven option pre-selection (AI parse wires this — TASK-AI-010)

**Dependencies:**
- TASK-ORD-005

**Suggested Files:**
- `frontend/src/components/order/OrderForm.tsx` (extend)
- `frontend/src/features/orders/useOrderForm.ts` (extend)

**Acceptance Criteria:**
- Selecting a vehicle triggers price recalculation and updates price display
- Selecting/deselecting any option triggers recalculation
- Price display shows three lines: base price, options total, total price
- No recalculation fires while user is still typing (300ms debounce)

**Complexity:** M

---

### TASK-ORD-007

**Title:** Order Create/Edit Page — Save + Status Flow

**Goal:**
Implement the complete `/orders/new` and `/orders/:id` pages with save functionality, assembling the `OrderForm` into a full page with a save button and status transition controls.

**Scope:**
- `app/orders/new/page.tsx`: renders `OrderForm` + save button; on submit calls `orderApi.createOrder()`, navigates to `/orders/:newId` on success
- `app/orders/[id]/page.tsx`: fetches order via `orderApi.getOrder(id)`, populates form, save button calls `orderApi.updateOrder()`
- Status select in form allows transitions: DRAFT → CONFIRMED, DRAFT/CONFIRMED → CANCELLED
- Error handling: display MUI `Alert` on API error; show field-level errors from validation response
- Loading state for initial fetch on edit page

**Out of Scope:**
- AI panels (TASK-AI-009, TASK-AI-011)
- AI field highlighting (TASK-AI-010)

**Dependencies:**
- TASK-ORD-006
- TASK-ORD-003

**Suggested Files:**
- `frontend/src/app/orders/new/page.tsx`
- `frontend/src/app/orders/[id]/page.tsx`

**Acceptance Criteria:**
- Full create flow: fill form → save → redirected to edit page showing new order
- Full edit flow: open existing order → modify fields → save → values persisted
- Status change from DRAFT to CONFIRMED works end-to-end
- API errors from backend (400 validation) shown to user with field-level messages

**Complexity:** M

---

## Phase 5 — AI Features

### TASK-AI-001

**Title:** Prompt Template Files

**Goal:**
Create the three prompt template plain-text files in `resources/prompts/` with system prompts implementing the AI design rules from SPEC.md §18 and ARCHITECTURE.md §5.1 and §5.2.

**Scope:**
- `parse-order-system.txt`: system prompt for extraction — includes rules (JSON only, no price calculation, unknown → null), embedded vehicle catalog from SPEC.md §31, 2–3 few-shot examples, field list matching `AiParseResponse` structure from SPEC.md §17.2
- `generate-summary-system.txt`: system prompt for order summary generation — instructs AI to produce a concise Chinese summary paragraph from structured order data
- `generate-email-system.txt`: system prompt for customer confirmation email — instructs AI to produce a formal Chinese email draft matching the format in SPEC.md §12 Section B
- Each file must fit within token budget from ARCHITECTURE.md §5.1

**Out of Scope:**
- Java code to load prompts (TASK-AI-002)
- Any AI API calls

**Dependencies:**
- TASK-BOOT-003

**Suggested Files:**
- `backend/src/main/resources/prompts/parse-order-system.txt`
- `backend/src/main/resources/prompts/generate-summary-system.txt`
- `backend/src/main/resources/prompts/generate-email-system.txt`

**Acceptance Criteria:**
- `parse-order-system.txt` includes all available vehicle and option names from SPEC.md §31 (embedded catalog)
- Parse prompt explicitly states: return JSON only, do not calculate price, unknown field = null
- Summary and email prompts instruct output in Traditional Chinese
- Each file is under 400 lines (token budget compliance)

**Complexity:** M

---

### TASK-AI-002

**Title:** Azure OpenAI Config + Spring AI Integration + PromptTemplateLoader

**Goal:**
Configure the Spring AI Azure OpenAI client and create `PromptTemplateLoader` that reads prompt template files at startup.

**Scope:**
- Add Spring AI Azure OpenAI starter config in `application.yml`: `spring.ai.azure.openai.endpoint`, `spring.ai.azure.openai.api-key`, `spring.ai.azure.openai.chat.options.deployment-name`
- `AzureOpenAiConfig.java` in `config/`: bean setup for `AzureChatClient` with timeout (15s per ARCHITECTURE.md §4.5)
- `PromptTemplateLoader.java` in `ai/`: loads all three prompt files from classpath on `@PostConstruct`, stores as `Map<String, String>`; logs template name + character count at startup; throws `IllegalStateException` if any template is missing

**Out of Scope:**
- Actual AI call implementation (TASK-AI-003)
- PDF extraction (TASK-AI-004)

**Dependencies:**
- TASK-BOOT-003
- TASK-BE-001
- TASK-AI-001

**Suggested Files:**
- `backend/src/main/resources/application.yml` (update AI config section)
- `backend/src/main/java/com/company/aivehicleorder/config/AzureOpenAiConfig.java`
- `backend/src/main/java/com/company/aivehicleorder/ai/PromptTemplateLoader.java`

**Acceptance Criteria:**
- Application starts and logs: `Loaded prompt template: parse-order-system (N chars)` for all three templates
- `PromptTemplateLoader.getTemplate("parse-order-system")` returns non-null string
- Missing template file causes startup failure with descriptive error (not `NullPointerException`)
- No actual Azure OpenAI API call is made during startup

**Complexity:** S

---

### TASK-AI-003

**Title:** AiOrchestrationService — Parse Text

**Goal:**
Implement the `parseOrderFromText()` method in `AiOrchestrationService` with prompt injection protection, input capping, and graceful error handling.

**Scope:**
- `AiOrchestrationService.java`:
  - `parseOrderFromText(String sourceText): AiParseResponse`
  - Cap input at 2,000 chars (ARCHITECTURE.md §5.4)
  - Build messages: `system` = template from `PromptTemplateLoader`, `user` = sanitized `sourceText` (user content never concatenated into system role)
  - Call Spring AI `ChatClient.call()` with 15s timeout
  - On success: parse JSON response via `AiResponseParser`
  - On timeout or exception: throw `AiParseException` with message matching SPEC.md §21
  - Log: `promptTokens`, `completionTokens` — never log `sourceText`
- `AiResponseParser.java` in `ai/`:
  - `parseParseResponse(String jsonString): AiParseResponse`
  - Uses Jackson `ObjectMapper`; unknown fields → null (never throw on missing field)

**Out of Scope:**
- PDF variant (TASK-AI-004)
- Generate summary/email (TASK-AI-007)

**Dependencies:**
- TASK-AI-002
- TASK-BE-004

**Suggested Files:**
- `backend/src/main/java/com/company/aivehicleorder/ai/AiOrchestrationService.java`
- `backend/src/main/java/com/company/aivehicleorder/ai/AiResponseParser.java`
- `backend/src/test/java/com/company/aivehicleorder/ai/AiResponseParserTest.java`

**Acceptance Criteria:**
- Unit test (`AiResponseParser`): valid JSON string → `AiParseResponse` with all fields populated
- Unit test (`AiResponseParser`): JSON with missing `confidence` field → `confidence = 0.0` (not exception)
- Integration test (mock `ChatClient`): `parseOrderFromText()` returns `AiParseResponse` on success
- Integration test: 15s timeout triggers `AiParseException`
- `sourceText` does not appear in any log

**Complexity:** M

---

### TASK-AI-004

**Title:** PdfExtractService — PDFBox Text Extraction

**Goal:**
Implement `PdfExtractService` that receives a PDF `MultipartFile`, validates it, extracts text using Apache PDFBox 3 (in-memory, no disk write), and returns the text capped at 3,000 chars.

**Scope:**
- `PdfExtractService.java` in `service/`:
  - `extract(MultipartFile file): String`
  - Validate MIME type = `application/pdf` (server-side, ignore client-reported content type)
  - Validate file size ≤ 10MB — throw `MaxUploadSizeExceededException` or custom exception if exceeded
  - Use `PDDocument.load(file.getInputStream())` — never write to disk
  - Extract text from max 5 pages using `PDFTextStripper`
  - Cap result at 3,000 chars (ARCHITECTURE.md §5.4)
  - If extraction returns empty string, throw `AiParseException` (SPEC.md §21 PDF Invalid case)

**Out of Scope:**
- AI call (TASK-AI-005)
- OCR (explicitly out of scope per SPEC.md §2.2)

**Dependencies:**
- TASK-BE-006
- TASK-BOOT-003

**Suggested Files:**
- `backend/src/main/java/com/company/aivehicleorder/service/PdfExtractService.java`
- `backend/src/test/java/com/company/aivehicleorder/service/PdfExtractServiceTest.java`

**Acceptance Criteria:**
- Unit test: valid text-layer PDF → non-empty string returned
- Unit test: PDF > 10MB → exception thrown
- Unit test: non-PDF MIME type → exception thrown
- Unit test: blank PDF → `AiParseException` thrown
- No temp files written to disk

**Complexity:** S

---

### TASK-AI-005

**Title:** AiOrchestrationService — Parse PDF

**Goal:**
Add `parseOrderFromPdf()` to `AiOrchestrationService` that chains `PdfExtractService` text extraction with the same AI parse call used for text input.

**Scope:**
- Add `parseOrderFromPdf(MultipartFile file): AiParseResponse` to `AiOrchestrationService`
- Call `PdfExtractService.extract(file)` to get plain text
- Reuse existing `parseOrderFromText(extractedText)` — no duplicate AI call logic
- Log: file name (not content), extracted char count, token usage

**Out of Scope:**
- Controller endpoint (TASK-AI-006)
- OCR

**Dependencies:**
- TASK-AI-003
- TASK-AI-004

**Suggested Files:**
- `backend/src/main/java/com/company/aivehicleorder/ai/AiOrchestrationService.java` (extend)

**Acceptance Criteria:**
- Integration test (mock `ChatClient`): valid PDF → `AiParseResponse` returned
- Invalid PDF → `AiParseException` with message from SPEC.md §21
- Log shows char count of extracted text (never file contents)

**Complexity:** S

---

### TASK-AI-006

**Title:** AiController — Parse Text + Parse PDF Endpoints

**Goal:**
Implement `AiController` exposing `POST /api/ai/parse-text` and `POST /api/ai/parse-pdf` endpoints.

**Scope:**
- `AiController.java`:
  - `POST /api/ai/parse-text`: `@Valid @RequestBody AiParseTextRequest` → `AiOrchestrationService.parseOrderFromText()`
  - `POST /api/ai/parse-pdf`: `@RequestParam MultipartFile file`, validate file, → `AiOrchestrationService.parseOrderFromPdf()`
  - `AiParseException` is handled by `GlobalExceptionHandler` (already implemented in TASK-BE-006) — no try/catch in controller
  - Configure `spring.servlet.multipart.max-file-size=10MB` in `application.yml`

**Out of Scope:**
- Generate summary/email endpoints (TASK-AI-008)
- Frontend integration (TASK-AI-009)

**Dependencies:**
- TASK-AI-005
- TASK-BE-001

**Suggested Files:**
- `backend/src/main/java/com/company/aivehicleorder/controller/AiController.java`
- `backend/src/main/resources/application.yml` (multipart config)

**Acceptance Criteria:**
- `POST /api/ai/parse-text` with valid JSON body → 200 with `AiParseResponse` JSON
- `POST /api/ai/parse-pdf` with valid PDF file → 200 with `AiParseResponse` JSON
- `POST /api/ai/parse-pdf` with non-PDF file → 400
- `POST /api/ai/parse-text` with `sourceText` > 2000 chars → 400 (validation)
- Both endpoints documented in Swagger UI

**Complexity:** S

---

### TASK-AI-007

**Title:** AiOrchestrationService — Generate Summary + Generate Email

**Goal:**
Add `generateSummary()` and `generateEmail()` methods to `AiOrchestrationService`, injecting order data into the generation prompts and storing results in the order record.

**Scope:**
- `generateSummary(OrderResponse order): String` — builds user message from order fields (customer, vehicle, options, price, delivery month), calls AI with `generate-summary-system.txt` template
- `generateEmail(OrderResponse order): String` — same structure with `generate-email-system.txt` template
- Both methods use `gpt-4o` quality model (not mini) per ARCHITECTURE.md §5.4
- AI output stored in `orders.ai_summary` and `orders.ai_email` via `OrderService.updateAiContent()` method (add this method to `OrderService`)
- Existing AI content: if `order.aiSummary != null`, log a warning but still proceed (user explicitly triggered re-generate)
- Log token counts; never log generated content (may contain customer PII)

**Out of Scope:**
- Controller endpoint (TASK-AI-008)
- Frontend AI panel (TASK-AI-011)

**Dependencies:**
- TASK-AI-002
- TASK-ORD-002

**Suggested Files:**
- `backend/src/main/java/com/company/aivehicleorder/ai/AiOrchestrationService.java` (extend)
- `backend/src/main/java/com/company/aivehicleorder/service/OrderService.java` (add `updateAiContent()`)

**Acceptance Criteria:**
- Integration test (mock `ChatClient`): `generateSummary()` returns non-empty string
- Integration test: `generateEmail()` response contains Chinese text with order details injected
- After `generateSummary()`, `orders.ai_summary` column is updated in DB
- Token count logged for each call

**Complexity:** M

---

### TASK-AI-008

**Title:** AiController — Generate Summary + Generate Email Endpoints

**Goal:**
Add `POST /api/ai/generate-summary` and `POST /api/ai/generate-email` endpoints to `AiController`.

**Scope:**
- `POST /api/ai/generate-summary`: body `{orderId: UUID}` → fetches order, calls `generateSummary()`, saves result, returns `{summary: string}`
- `POST /api/ai/generate-email`: body `{orderId: UUID}` → fetches order, calls `generateEmail()`, saves result, returns `{email: string}`
- Validation: `orderId` must be valid UUID; order must exist (returns 404 if not)
- Both endpoints respond within 10s (per SPEC.md §24 AI Parse target); return 504 on timeout

**Out of Scope:**
- Frontend AI panel (TASK-AI-011)

**Dependencies:**
- TASK-AI-007
- TASK-AI-006

**Suggested Files:**
- `backend/src/main/java/com/company/aivehicleorder/controller/AiController.java` (extend)

**Acceptance Criteria:**
- `POST /api/ai/generate-summary {orderId}` → 200 with `{summary: "..."}`
- Result persisted in `orders.ai_summary` column
- Invalid `orderId` → 404
- Endpoints documented in Swagger UI

**Complexity:** S

---

### TASK-AI-009

**Title:** AI Input Panel UI — Text Input + PDF Upload + Parse Button

**Goal:**
Create the `AiInputPanel` component that provides the two-mode AI parse UI (paste text / upload PDF) and the "AI 解析需求" button, matching SPEC.md §10 Step 1–3.

**Scope:**
- `components/order/AiInputPanel.tsx`:
  - Mode toggle: "貼上文字" / "上傳 PDF" tabs or radio buttons
  - Text mode: `Textarea` with `maxLength=2000`, character count display
  - PDF mode: file drop zone accepting `application/pdf` only, max 10MB, file name display after selection
  - "AI 解析需求" button: calls `aiApi.parseText()` or `aiApi.parsePdf()` based on mode; shows loading spinner during call; disables button during request
  - On success: calls `orderStore.setAiResult(response)`
  - On failure: shows MUI `Alert` with error message from SPEC.md §21
- `features/orders/useAiParse.ts`: custom hook managing parse state (loading, error) and calling the API

**Out of Scope:**
- Auto-filling the form (TASK-AI-010)
- AI Summary panel (TASK-AI-011)

**Dependencies:**
- TASK-FE-002
- TASK-FE-004
- TASK-AI-006 (backend must be running)

**Suggested Files:**
- `frontend/src/components/order/AiInputPanel.tsx`
- `frontend/src/features/orders/useAiParse.ts`

**Acceptance Criteria:**
- Text mode: entering text and clicking parse button calls `POST /api/ai/parse-text`
- PDF mode: uploading valid PDF and clicking parse calls `POST /api/ai/parse-pdf` with `multipart/form-data`
- PDF validation: files > 10MB show client-side error before upload
- Loading state: button is disabled and shows spinner during API call
- Error state: `AiParseException` response shown as MUI Alert

**Complexity:** M

---

### TASK-AI-010

**Title:** AI Form Auto-Fill + Field Highlighting

**Goal:**
Wire the `AiParseResponse` from the store into `OrderForm` so AI-parsed values auto-fill form fields and AI-filled fields are visually highlighted.

**Scope:**
- In `useOrderForm.ts`: watch `orderStore.aiParseResult` via Zustand; when it changes, call `react-hook-form`'s `setValue()` for each non-null field in the parse result
- Track which fields were auto-filled in `orderStore.aiHighlightedFields`
- `utils/highlightAiFields.ts`: returns MUI `sx` prop for highlighted field styling (e.g., yellow background tint)
- Apply highlighting to `OrderForm` field inputs when their name is in `aiHighlightedFields`
- Display `confidence` score from `AiParseResponse` in a MUI `Chip` near the parse button
- Display `missingFields` array as a MUI `Alert` warning if non-empty

**Out of Scope:**
- AI Summary panel (TASK-AI-011)
- Option auto-selection based on AI `options` array (include this: match parsed option names against loaded options list and pre-check matching checkboxes)

**Dependencies:**
- TASK-AI-009
- TASK-ORD-005

**Suggested Files:**
- `frontend/src/features/orders/useOrderForm.ts` (extend)
- `frontend/src/utils/highlightAiFields.ts`
- `frontend/src/components/order/OrderForm.tsx` (extend)

**Acceptance Criteria:**
- After AI parse completes, `customerName` field is auto-populated with parsed value
- AI-filled fields show visual highlight (yellow or colored background)
- Confidence chip displays `0.92` as `92%`
- Missing fields list displays as warning: "未解析欄位: customerPhone, exteriorColor"
- User can still manually edit any auto-filled field

**Complexity:** M

---

### TASK-AI-011

**Title:** AI Summary Panel UI

**Goal:**
Implement the right-side AI Summary Panel from SPEC.md §12, including the order summary display and the "AI 產生摘要" / "AI 產生客戶確認信" buttons.

**Scope:**
- `components/ai/AiSummaryPanel.tsx`:
  - Section A: displays current order summary fields (customer, vehicle, colors, options, delivery, total price) — read from `orderStore.currentOrder` and `orderStore.calculatedPrice`
  - "AI 產生摘要" button: calls `aiApi.generateSummary(orderId)`, stores result in `orderStore.aiSummary`; disabled until order is saved (has an ID); shows loading spinner
  - `components/ai/AiEmailPanel.tsx`: displays `orderStore.aiEmail` with a copy-to-clipboard button; "AI 產生客戶確認信" button: calls `aiApi.generateEmail(orderId)`
  - Both panels show "請先儲存訂單" placeholder text if no `orderId` exists yet

**Out of Scope:**
- Actual email sending (explicitly out of scope per SPEC.md §2.2)

**Dependencies:**
- TASK-AI-008
- TASK-FE-004
- TASK-ORD-007

**Suggested Files:**
- `frontend/src/components/ai/AiSummaryPanel.tsx`
- `frontend/src/components/ai/AiEmailPanel.tsx`
- `frontend/src/app/orders/[id]/page.tsx` (extend to include panels)

**Acceptance Criteria:**
- Order summary section shows live-updated order data as user fills form
- "AI 產生摘要" button disabled on `/orders/new` (no saved order yet)
- After saving order and clicking "AI 產生摘要" → API called → summary text displayed
- "AI 產生客戶確認信" → email draft displayed in panel
- Copy-to-clipboard button copies email text successfully

**Complexity:** M

---

## Phase 6 — Deployment

### TASK-DEPLOY-001

**Title:** Backend Dockerfile — Multi-Stage Build

**Goal:**
Create an optimized multi-stage `Dockerfile` for the Spring Boot backend that produces a minimal production image.

**Scope:**
- Stage 1 (`build`): use Maven + Java 25 image, copy `pom.xml` and `src/`, run `mvn package -DskipTests`
- Stage 2 (`runtime`): use `eclipse-temurin:25-jre-alpine`, copy JAR from build stage, set non-root user, expose port 8080, `ENTRYPOINT ["java", "-jar", "app.jar"]`
- Pass `SPRING_PROFILES_ACTIVE=prod` as environment variable
- `.dockerignore` for backend: exclude `target/`, `.git/`, `*.md`

**Out of Scope:**
- Frontend Dockerfile (TASK-DEPLOY-002)
- Docker Compose prod wiring (TASK-DEPLOY-004)

**Dependencies:**
- TASK-BOOT-003

**Suggested Files:**
- `backend/Dockerfile`
- `backend/.dockerignore`

**Acceptance Criteria:**
- `docker build -t backend .` from `backend/` directory succeeds
- Final image size < 400MB
- Container starts with `docker run -e SPRING_DATASOURCE_URL=... -p 8080:8080 backend` (connection failure is acceptable — startup with env vars must work)
- Container runs as non-root user

**Complexity:** S

---

### TASK-DEPLOY-002

**Title:** Frontend Dockerfile — Multi-Stage Build

**Goal:**
Create an optimized multi-stage `Dockerfile` for the Next.js frontend.

**Scope:**
- Stage 1 (`deps`): install only `node_modules` using pnpm
- Stage 2 (`build`): copy source, run `pnpm build` with `NEXT_PUBLIC_API_BASE_URL` build arg
- Stage 3 (`runtime`): copy `.next/standalone` output, expose port 3000, `CMD ["node", "server.js"]`
- Configure `next.config.ts` with `output: 'standalone'` for minimal production image
- `.dockerignore` for frontend: exclude `node_modules/`, `.next/`, `*.md`

**Out of Scope:**
- Backend Dockerfile (TASK-DEPLOY-001)

**Dependencies:**
- TASK-BOOT-002

**Suggested Files:**
- `frontend/Dockerfile`
- `frontend/.dockerignore`
- `frontend/next.config.ts` (update with `output: 'standalone'`)

**Acceptance Criteria:**
- `docker build --build-arg NEXT_PUBLIC_API_BASE_URL=http://backend:8080 -t frontend .` succeeds
- Final image size < 250MB
- Container starts on port 3000

**Complexity:** S

---

### TASK-DEPLOY-003

**Title:** Production Docker Compose + Nginx Config

**Goal:**
Create `docker-compose.prod.yml` and the Nginx reverse proxy config that routes traffic to frontend and backend as defined in ARCHITECTURE.md §8.1.

**Scope:**
- `docker/docker-compose.prod.yml`:
  - `nginx` service: image `nginx:alpine`, volumes `nginx.conf`, ports `80:80`, depends on frontend and backend
  - `frontend` service: production image, `NEXT_PUBLIC_API_BASE_URL=https://${DOMAIN}`, no exposed ports (internal only)
  - `backend` service: production image, env vars from `.env`, no exposed ports (internal only)
  - MySQL is external (Azure Database for MySQL — not in Compose)
- `docker/nginx/nginx.conf`:
  - `location / → frontend:3000`
  - `location /api/ → backend:8080`
  - Proxy headers: `X-Real-IP`, `X-Forwarded-For`, `Host`
  - Client max body size 15MB (for PDF uploads)

**Out of Scope:**
- SSL/TLS termination (acceptable for MVP; Azure VM may use SSL at load balancer)
- Local dev Compose (already exists from TASK-BOOT-004)

**Dependencies:**
- TASK-DEPLOY-001
- TASK-DEPLOY-002

**Suggested Files:**
- `docker/docker-compose.prod.yml`
- `docker/nginx/nginx.conf`

**Acceptance Criteria:**
- `docker compose -f docker-compose.prod.yml up` starts nginx, frontend, and backend
- `curl http://localhost/` returns Next.js frontend HTML
- `curl http://localhost/api/vehicles` returns vehicles JSON (proxied to backend)
- PDF upload works through Nginx (client_max_body_size covers 10MB PDFs)

**Complexity:** S

---

### TASK-DEPLOY-004

**Title:** GitHub Actions CI Pipeline

**Goal:**
Complete the `ci.yml` GitHub Actions workflow with working backend test and frontend build jobs that run on every PR to `main`.

**Scope:**
- `backend-ci` job:
  - `actions/checkout`
  - `actions/setup-java@v4` with Java 25
  - `mvn test` (unit tests only — no Azure OpenAI or DB calls in tests; mock AI in tests)
  - `mvn verify` for integration tests with H2 in-memory DB (configure `application-test.yml` with H2)
- `frontend-ci` job:
  - `actions/setup-node@v4` with Node LTS
  - `pnpm install` with cache
  - `pnpm lint`
  - `pnpm type-check`
  - `pnpm build`
- Both jobs run in parallel
- Cache Maven dependencies and pnpm store

**Out of Scope:**
- Docker build in CI (deploy pipeline)
- Azure deployment steps (TASK-DEPLOY-005)

**Dependencies:**
- TASK-BOOT-006
- TASK-DEPLOY-001 (backend must be buildable)
- TASK-DEPLOY-002 (frontend must be buildable)

**Suggested Files:**
- `.github/workflows/ci.yml`
- `backend/src/main/resources/application-test.yml`

**Acceptance Criteria:**
- CI passes on a clean branch with no code changes after this task
- `mvn test` uses H2 in-memory DB (no MySQL connection required in CI)
- `pnpm build` succeeds with `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`
- Both jobs complete in under 5 minutes

**Complexity:** M

---

### TASK-DEPLOY-005

**Title:** GitHub Actions Deploy Pipeline + Azure VM Setup

**Goal:**
Complete `deploy-prod.yml` to build Docker images, push to registry, and SSH-deploy to Azure VM; document Azure VM prerequisites in README.

**Scope:**
- `deploy-prod.yml` job `deploy`:
  - Build backend image → push to GHCR (`ghcr.io/{owner}/{repo}/backend:latest`)
  - Build frontend image → push to GHCR with `NEXT_PUBLIC_API_BASE_URL` build arg from secrets
  - SSH to Azure VM using `AZURE_VM_SSH_KEY` and `AZURE_VM_HOST` secrets
  - On VM: `docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d --no-build`
- GitHub Secrets documentation: add full list from ARCHITECTURE.md §8.3 to `README.md`
- Add `README.md` section: Azure VM prerequisites (Docker installed, ports 80/22 open, `.env` file provisioned, Docker Compose installed)

**Out of Scope:**
- Staging environment (post-MVP per ARCHITECTURE.md §8.4)
- Azure Container Registry (GHCR is simpler for MVP)
- Azure Key Vault integration

**Dependencies:**
- TASK-DEPLOY-003
- TASK-DEPLOY-004

**Suggested Files:**
- `.github/workflows/deploy-prod.yml`
- `README.md` (update with deployment guide)

**Acceptance Criteria:**
- Workflow runs on push to `main` and on `workflow_dispatch`
- GHCR push step uses `GITHUB_TOKEN` for authentication
- SSH deploy step executes `docker compose pull && up -d` on the VM
- README documents all 8 GitHub Secrets from ARCHITECTURE.md §8.3
- README documents VM setup prerequisites

**Complexity:** M

---

## Task Summary

| Phase | Task ID | Title | Complexity | Parallel Safe |
|---|---|---|---|---|
| 0 | TASK-BOOT-001 | Monorepo Root Scaffold | S | — |
| 0 | TASK-BOOT-002 | Frontend Project Initialization | S | After BOOT-001 |
| 0 | TASK-BOOT-003 | Backend Project Initialization | S | After BOOT-001 |
| 0 | TASK-BOOT-004 | Docker Compose Local Dev Setup | S | After BOOT-001 |
| 0 | TASK-BOOT-005 | Environment Variable Templates | S | After BOOT-003 |
| 0 | TASK-BOOT-006 | CI/CD GitHub Actions Skeleton | S | After BOOT-001 |
| 1 | TASK-DB-001 | Flyway V1 — Vehicles Table | S | After BOOT-003 |
| 1 | TASK-DB-002 | Flyway V2 — Vehicle Options Table | S | After DB-001 |
| 1 | TASK-DB-003 | Flyway V3 — Orders Table | S | After DB-002 |
| 1 | TASK-DB-004 | Flyway V4 — Order Options Table | S | After DB-003 |
| 1 | TASK-DB-005 | Flyway V5 — Seed Data | S | After DB-004 |
| 2 | TASK-BE-001 | Spring Boot Config + CORS | S | After DB-005 |
| 2 | TASK-BE-002 | Vehicle + VehicleOption Entities + Repos | S | After BE-001 |
| 2 | TASK-BE-003 | Order + OrderOption Entities + Repo | M | After BE-002 |
| 2 | TASK-BE-004 | Request + Response DTOs | M | After BE-003 |
| 2 | TASK-BE-005 | Entity-DTO Mapper | S | After BE-004 |
| 2 | TASK-BE-006 | Global Exception Handler | S | After BE-004 |
| 2 | TASK-BE-007 | Order Number Generator | S | After BE-003 |
| 2 | TASK-BE-008 | Application Logging Config | S | After BE-001 |
| 3 | TASK-FE-001 | TypeScript Type Definitions | S | After BOOT-002 |
| 3 | TASK-FE-002 | Axios API Client Setup | S | After FE-001 |
| 3 | TASK-FE-003 | App Shell Layout — Sidebar | M | After BOOT-002 |
| 3 | TASK-FE-004 | Zustand Order Store | S | After FE-001 |
| 3 | TASK-FE-005 | Reusable OrderTable Component | M | After FE-001 |
| 3 | TASK-FE-006 | Route Stubs for Order Pages | S | After FE-003 |
| 4 | TASK-ORD-001 | PricingService — Pure Calculation | S | After BE-002 |
| 4 | TASK-ORD-002 | OrderService — CRUD Operations | M | After ORD-001, BE-005–007 |
| 4 | TASK-ORD-003 | Order CRUD + Price Controller | M | After ORD-002 |
| 4 | TASK-ORD-004 | Order List Page UI | M | After FE-005, ORD-003 |
| 4 | TASK-ORD-005 | Order Form — Base Fields | M | After FE-004, ORD-003 |
| 4 | TASK-ORD-006 | Order Form — Options + Price UI | M | After ORD-005 |
| 4 | TASK-ORD-007 | Order Create/Edit Page — Save | M | After ORD-006 |
| 5 | TASK-AI-001 | Prompt Template Files | M | After BOOT-003 |
| 5 | TASK-AI-002 | Azure OpenAI Config + PromptLoader | S | After AI-001, BE-001 |
| 5 | TASK-AI-003 | AiOrchestrationService — Parse Text | M | After AI-002, BE-004 |
| 5 | TASK-AI-004 | PdfExtractService — PDFBox | S | After BE-006 |
| 5 | TASK-AI-005 | AiOrchestrationService — Parse PDF | S | After AI-003, AI-004 |
| 5 | TASK-AI-006 | AiController — Parse Endpoints | S | After AI-005, BE-001 |
| 5 | TASK-AI-007 | AiOrchestrationService — Summary + Email | M | After AI-002, ORD-002 |
| 5 | TASK-AI-008 | AiController — Generate Endpoints | S | After AI-007 |
| 5 | TASK-AI-009 | AI Input Panel UI | M | After FE-002, FE-004, AI-006 |
| 5 | TASK-AI-010 | AI Form Auto-Fill + Highlighting | M | After AI-009, ORD-005 |
| 5 | TASK-AI-011 | AI Summary Panel UI | M | After AI-008, FE-004, ORD-007 |
| 6 | TASK-DEPLOY-001 | Backend Dockerfile | S | After BOOT-003 |
| 6 | TASK-DEPLOY-002 | Frontend Dockerfile | S | After BOOT-002 |
| 6 | TASK-DEPLOY-003 | Prod Docker Compose + Nginx | S | After DEPLOY-001, 002 |
| 6 | TASK-DEPLOY-004 | GitHub Actions CI Pipeline | M | After DEPLOY-001, 002 |
| 6 | TASK-DEPLOY-005 | GitHub Actions Deploy + Azure VM | M | After DEPLOY-003, 004 |

**Total tasks:** 47
**S tasks (1h):** 28
**M tasks (2-3h):** 19
**L tasks:** 0

---

*End of TASKS.md*
