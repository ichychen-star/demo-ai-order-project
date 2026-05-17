# Backend Integration Test Results

**Date:** 2026-05-17
**Branch:** main
**Tasks covered:** TASK-ORD-001, TASK-ORD-002, TASK-ORD-003

---

## Environment

| Component | Version / Config |
|---|---|
| Java | 26 (Oracle HotSpot) |
| Spring Boot | 4.x |
| MySQL | 8.0 (Docker container `aivehicleorder-mysql`) |
| Maven | 3.x |
| OS | Windows 11 Pro |

---

## Step 1 — Start Infrastructure

### 1.1 Start Docker Desktop

```powershell
# Launch Docker Desktop manually or via:
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
# Wait until engine is ready (~60s)
docker info
```

### 1.2 Start MySQL container

```powershell
cd c:\Vicky\demo-ai-order-project\docker
docker compose up mysql -d
# Wait for healthy status
docker inspect --format='{{.State.Health.Status}}' aivehicleorder-mysql
```

**Result:** `healthy`

### 1.3 Start Spring Boot backend

```powershell
cd c:\Vicky\demo-ai-order-project\backend
mvn spring-boot:run
```

**Result:** `Started AiVehicleOrderApplication` — backend listening on port 8080

---

## Step 2 — Unit Tests (no database required)

```powershell
cd c:\Vicky\demo-ai-order-project\backend
mvn test -Dtest="GlobalExceptionHandlerTest,OrderNoGeneratorTest,PricingServiceTest,MapperTest,LoggingFilterTest,DtoValidationTest,OrderServiceTest"
```

| Test Class | Tests | Result |
|---|---|---|
| `DtoValidationTest` | 9 | PASS |
| `GlobalExceptionHandlerTest` | 8 | PASS |
| `MapperTest` | 9 | PASS |
| `OrderServiceTest` | 7 | PASS |
| `PricingServiceTest` | 3 | PASS |
| `LoggingFilterTest` | 3 | PASS |
| `OrderNoGeneratorTest` | 5 | PASS |
| **Total** | **44** | **ALL PASS** |

---

## Step 3 — Repository Integration Tests (requires MySQL)

```powershell
mvn test -Dtest="OrderRepositoryTest,VehicleRepositoryTest,VehicleOptionRepositoryTest"
```

| Test Class | Tests | Result |
|---|---|---|
| `OrderRepositoryTest` | 9 | PASS |
| `VehicleRepositoryTest` | 4 | PASS |
| `VehicleOptionRepositoryTest` | 4 | PASS |
| **Total** | **17** | **ALL PASS** |

---

## Step 4 — API Endpoint Verification

Base URL: `http://localhost:8080`

---

### AC1 — GET /api/vehicles returns 5 seed vehicles

```bash
curl -s http://localhost:8080/api/vehicles
```

**Response (HTTP 200):**
```json
[
  {"id":"a1000000-0000-0000-0000-000000000005","brand":"Audi","model":"Q5","basePrice":2890000.00},
  {"id":"a1000000-0000-0000-0000-000000000003","brand":"BMW","model":"X3","basePrice":2990000.00},
  {"id":"a1000000-0000-0000-0000-000000000004","brand":"BMW","model":"X4","basePrice":3320000.00},
  {"id":"a1000000-0000-0000-0000-000000000002","brand":"Mercedes-Benz","model":"GLC 200","basePrice":2780000.00},
  {"id":"a1000000-0000-0000-0000-000000000001","brand":"Mercedes-Benz","model":"GLC 300 Coupe","basePrice":3450000.00}
]
```

**Result:** ✅ PASS — 5 vehicles returned, matches seed data

---

### AC2 — GET /api/options returns 6 seed options

```bash
curl -s http://localhost:8080/api/options
```

**Response (HTTP 200):**
```json
[
  {"id":"b2000000-0000-0000-0000-000000000003","name":"23P 智慧駕駛輔助套件","price":150000.00},
  {"id":"b2000000-0000-0000-0000-000000000001","name":"AMG Line","price":180000.00},
  {"id":"b2000000-0000-0000-0000-000000000004","name":"Burmester 音響","price":90000.00},
  {"id":"b2000000-0000-0000-0000-000000000006","name":"HUD 抬頭顯示","price":70000.00},
  {"id":"b2000000-0000-0000-0000-000000000005","name":"MBUX AR 導航","price":60000.00},
  {"id":"b2000000-0000-0000-0000-000000000002","name":"夜色套件","price":120000.00}
]
```

**Result:** ✅ PASS — 6 options returned, matches seed data

---

### AC3 — POST /api/orders with missing customerName returns 400

```bash
curl -s -w "\nHTTP %{http_code}" -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customerPhone":"0912345678","vehicleId":"a1000000-0000-0000-0000-000000000001",
       "exteriorColor":"White","interiorColor":"Black",
       "expectedDeliveryMonth":"2026-08","status":"DRAFT"}'
```

**Response (HTTP 400):**
```json
{
  "timestamp": "2026-05-17T21:10:27.9452604",
  "status": 400,
  "message": "Validation failed",
  "errors": ["customerName: 不得空白"]
}
```

**Result:** ✅ PASS — `@Valid` triggers `GlobalExceptionHandler`, returns 400 with field-level error

---

### AC4 — POST /api/orders/calculate-price returns correct price breakdown

```bash
curl -s -w "\nHTTP %{http_code}" -X POST http://localhost:8080/api/orders/calculate-price \
  -H "Content-Type: application/json" \
  -d '{"vehicleId":"a1000000-0000-0000-0000-000000000001",
       "optionIds":["b2000000-0000-0000-0000-000000000001","b2000000-0000-0000-0000-000000000002"]}'
```

**Input:** GLC 300 Coupe (3,450,000) + AMG Line (180,000) + 夜色套件 (120,000)

**Response (HTTP 200):**
```json
{
  "vehicleBasePrice": 3450000.00,
  "optionsTotalPrice": 300000.00,
  "totalPrice": 3750000.00
}
```

**Result:** ✅ PASS — Formula correct: 3,450,000 + 180,000 + 120,000 = 3,750,000

---

### AC5 — POST /api/orders creates order with 201, orderNo, and option snapshots

```bash
curl -s -w "\nHTTP %{http_code}" -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Test User","customerPhone":"0912345678",
       "vehicleId":"a1000000-0000-0000-0000-000000000001",
       "exteriorColor":"White","interiorColor":"Black",
       "expectedDeliveryMonth":"2026-09","status":"DRAFT",
       "optionIds":["b2000000-0000-0000-0000-000000000001"]}'
```

**Response (HTTP 201):**
```json
{
  "id": "dc0eea13-dad5-479c-beef-7187990d66b7",
  "orderNo": "ORD-20260517-0001",
  "customerName": "Test User",
  "vehicleName": "Mercedes-Benz GLC 300 Coupe",
  "vehicleBasePrice": 3450000.00,
  "optionsTotalPrice": 180000.00,
  "totalPrice": 3630000.00,
  "status": "DRAFT",
  "deleted": false,
  "options": [
    {"optionId": "b2000000-0000-0000-0000-000000000001", "optionName": "AMG Line", "optionPrice": 180000.00}
  ]
}
```

**Result:** ✅ PASS — HTTP 201, orderNo generated (`ORD-YYYYMMDD-NNNN`), option name/price snapshot saved

---

### AC6 — DELETE /api/orders/{id} returns 204 (soft-delete)

```bash
curl -s -o /dev/null -w "HTTP %{http_code}" -X DELETE \
  http://localhost:8080/api/orders/dc0eea13-dad5-479c-beef-7187990d66b7
```

**Response:** `HTTP 204` (no body)

**Result:** ✅ PASS — 204 returned, no body

---

### AC7 — Soft-deleted order does not appear in GET /api/orders

```bash
# Count total orders (seed 10, one pre-deleted, one just deleted = 9 expected)
curl -s http://localhost:8080/api/orders | grep -o '"orderNo"' | wc -l

# Verify deleted order ID is absent
curl -s http://localhost:8080/api/orders | grep "dc0eea13-dad5-479c-beef-7187990d66b7"
```

**Result:**
- Order count: **9** (10 seed records minus 1 pre-seeded soft-delete `劉宗翰` = 9)
- Deleted order `dc0eea13...`: **not present** in list

**Result:** ✅ PASS — `findByDeletedFalseAnd*` query correctly excludes soft-deleted records

---

### AC8 — GET /api/orders?status=CONFIRMED filter

```bash
curl -s "http://localhost:8080/api/orders?status=CONFIRMED" | grep -o '"status":"[^"]*"' | sort | uniq -c
```

**Response:**
```
5 "status":"CONFIRMED"
```

**Result:** ✅ PASS — Returns only 5 CONFIRMED orders, no DRAFT or CANCELLED mixed in

---

### AC9 — GET /api/orders/{id} for non-existent ID returns 404

```bash
curl -s -w "\nHTTP %{http_code}" \
  http://localhost:8080/api/orders/00000000-0000-0000-0000-000000000000
```

**Response (HTTP 404):**
```json
{
  "timestamp": "2026-05-17T21:13:08.209007",
  "status": 404,
  "message": "Order not found: 00000000-0000-0000-0000-000000000000",
  "errors": []
}
```

**Result:** ✅ PASS — JSON 404 (not HTML), `EntityNotFoundException` handled by `GlobalExceptionHandler`

---

### AC10 — Swagger UI reachable at /swagger-ui/index.html

```bash
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:8080/swagger-ui/index.html
```

**Response:** `HTTP 200`

**Tag groups in OpenAPI spec:**
```bash
curl -s http://localhost:8080/v3/api-docs | grep -o '"name":"[^"]*"' | sort | uniq
```

```
"name":"Options"
"name":"Orders"
"name":"Vehicles"
```

**Result:** ✅ PASS — Swagger UI accessible, 3 tag groups documented (Orders 6 endpoints, Vehicles 1, Options 1)

---

## Summary

### Unit Tests

| Suite | Tests | Pass | Fail |
|---|---|---|---|
| Unit tests (no DB) | 44 | 44 | 0 |
| Repository integration (MySQL) | 17 | 17 | 0 |
| **Total** | **61** | **61** | **0** |

### API Acceptance Criteria

| # | Criterion | Status |
|---|---|---|
| AC1 | `GET /api/vehicles` returns 5 seed vehicles | ✅ PASS |
| AC2 | `GET /api/options` returns 6 seed options | ✅ PASS |
| AC3 | `POST /api/orders` missing field → 400 with `errors` list | ✅ PASS |
| AC4 | `POST /api/orders/calculate-price` returns correct 3-field breakdown | ✅ PASS |
| AC5 | `POST /api/orders` → 201 with `orderNo` and option snapshots | ✅ PASS |
| AC6 | `DELETE /api/orders/{id}` → 204 no body | ✅ PASS |
| AC7 | Soft-deleted orders absent from list | ✅ PASS |
| AC8 | `?status=` filter returns only matching status | ✅ PASS |
| AC9 | Unknown order ID → 404 JSON (not HTML) | ✅ PASS |
| AC10 | Swagger UI at `/swagger-ui/index.html` with 3 tag groups | ✅ PASS |

**All 10 API criteria passed. All 61 tests passed.**

---

## Notes

- Chinese characters in curl payloads cause UTF-8 encoding errors in Git Bash on Windows. Use ASCII values when testing field validation from the command line; the application itself handles UTF-8 correctly (confirmed by seed data and Flyway migration).
- The `mock-maker-subclass` Mockito extension (`backend/src/test/resources/mockito-extensions/org.mockito.plugins.MockMaker`) is required for Mockito to mock Spring Data JPA interfaces on Java 26. Without it, `@Mock` on repository interfaces throws a ByteBuddy instrumentation error.
