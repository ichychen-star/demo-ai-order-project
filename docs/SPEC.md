# SPEC.md — AI Vehicle Order System MVP

Version: `v1.0`
Target Release: `2 Weeks MVP`
Document Type: `Production-grade Functional + Technical Specification`
Audience: `Claude Code / Engineering Team / PM / Solution Architect`

---

# 1. Product Overview

## 1.1 Product Name

AI Vehicle Order System

---

## 1.2 Product Goal

建立一套 AI 輔助車輛訂單系統，讓業務可透過：

* 客戶需求文字
* PDF 訂單

快速建立車輛訂單。

系統透過 AI 自動解析訂單資訊並帶入表單，降低人工輸入時間與錯誤率。

---

## 1.3 MVP Success Criteria

MVP Demo 必須完成：

| 項目       | 驗收條件                     |
| -------- | ------------------------ |
| AI 文字解析  | 能從自然語言解析車型、顏色、選配         |
| PDF 解析   | 可上傳文字型 PDF 並成功解析         |
| 訂單建立     | 可成功建立與儲存訂單               |
| 價格計算     | 即時計算總價                   |
| AI 摘要    | 可產生訂單摘要                  |
| AI 客戶信   | 可產生客戶確認信                 |
| Azure 部署 | 可於 Azure VM 使用 Docker 啟動 |

---

# 2. System Scope

---

## 2.1 In Scope (MVP)

| Module            | Scope                         |
| ----------------- | ----------------------------- |
| Order Management  | CRUD                          |
| AI Parsing        | Text / PDF                    |
| Price Calculation | Vehicle + Options             |
| AI Summary        | Generate order summary        |
| AI Email          | Generate customer email draft |
| Deployment        | Azure Docker deployment       |

---

## 2.2 Out of Scope

| Feature             | Reason       |
| ------------------- | ------------ |
| Login/Auth          | MVP 不做       |
| RBAC                | MVP 不做       |
| OCR                 | 不處理掃描 PDF    |
| Real Email Sending  | 僅產生草稿        |
| Vehicle CRUD        | 使用 seed data |
| Option CRUD         | 使用 seed data |
| Reporting Dashboard | 非核心流程        |

---

# 3. Technology Stack

| Layer           | Technology              |
| --------------- | ----------------------- |
| Frontend        | React 19.2 + Next.js 16 App Router         |
| Backend         | Java 25 + Spring Boot 4 |
| Database        | Azure Database for MySQL |
| ORM             | Spring Data JPA         |
| Migration       | Flyway                  |
| AI              | Azure OpenAI            |
| PDF Parser      | Apache PDFBox           |
| Deployment      | Docker Compose          |
| Infra           | Azure VM                |
| Package Manager | pnpm                    |
| Build Tool      | Maven                  |
| API Spec        | OpenAPI 3               |
| UI Framework    | MUI / Tailwind          |

---

# 4. System Architecture

```text
[ Next.js Frontend ]
        |
 REST API
        |
[ Spring Boot Backend ]
        |
 ├── Azure Database for MySQL
 ├── Azure OpenAI
 └── PDFBox
```

---

# 5. User Flow

```text
1. User enters customer requirement text
   OR uploads PDF

2. AI parses content

3. Parsed result auto-fills form

4. User reviews & edits order

5. Backend calculates total price

6. User saves order

7. AI generates:
   - Order summary
   - Customer confirmation email
```

---

# 6. UI Specification

Reference UI:

* Layout based on provided design image
* Three-column layout:

  * Sidebar
  * Main Content
  * AI Panel

---

# 7. Page Specification

# 7.1 Order List Page

Route:

```text
/orders
```

---

## UI Sections

### Header

| Element       | Description |
| ------------- | ----------- |
| Page Title    | 車輛訂單        |
| Create Button | 建立訂單        |

---

### Search Area

| Field   | Type       |
| ------- | ---------- |
| Keyword | Text Input |
| Status  | Select     |

---

### Order Table

| Column         | Description                   |
| -------------- | ----------------------------- |
| Order No       | 系統編號                          |
| Customer Name  | 客戶名稱                          |
| Vehicle Model  | 車型                            |
| Total Price    | 訂單總價                          |
| Status         | Draft / Confirmed / Cancelled |
| Delivery Month | 預計交車月份                        |
| Created At     | 建立時間                          |
| Actions        | Edit/Delete                   |

---

# 7.2 Create/Edit Order Page

Routes:

```text
/orders/new
/orders/:id
```

---

# 8. Screen Layout

```text
---------------------------------------------------
| Sidebar | Main Order Form | AI Summary Panel |
---------------------------------------------------
```

---

# 9. Sidebar Specification

## Menu Items

| Menu            | Route      |
| --------------- | ---------- |
| Dashboard       | /dashboard |
| Vehicle Orders  | /orders    |
| Vehicle Catalog | /vehicles  |
| Options Catalog | /options   |
| AI Assistant    | /ai        |
| Reports         | /reports   |
| Settings        | /settings  |

MVP 中只有：

* `/orders`

真正實作。

其餘可為 disabled menu。

---

# 10. Order Creation Workflow

---

## Step 1 — Select Creation Method

### Options

| Method     | Description |
| ---------- | ----------- |
| Paste Text | 貼上客戶需求      |
| Upload PDF | 上傳 PDF      |

---

## Step 2 — Input Source Data

### Paste Text Mode

Textarea:

```text
maxLength = 2000
```

---

### Upload PDF Mode

Upload Area:

```text
Accept:
- application/pdf

Max Size:
- 10MB
```

---

## Step 3 — AI Parse

Button:

```text
AI 解析需求
```

Frontend call:

```http
POST /api/ai/parse-text
POST /api/ai/parse-pdf
```

---

## Step 4 — Auto Fill Order Form

AI 回傳後：

Frontend 必須：

* 自動帶入表單
* 高亮 AI 自動填入欄位
* 顯示 confidence score

---

## Step 5 — User Manual Adjustment

User 可修改：

| Field          |
| -------------- |
| Customer Name  |
| Vehicle        |
| Colors         |
| Options        |
| Delivery Month |

---

## Step 6 — Price Calculation

Trigger Conditions:

* vehicle changed
* option changed

Frontend call:

```http
POST /api/orders/calculate-price
```

---

## Step 7 — Save Order

Button:

```text
儲存訂單
```

API:

```http
POST /api/orders
```

---

## Step 8 — AI Generate Content

Buttons:

```text
AI 產生摘要
AI 產生客戶確認信
```

---

# 11. Form Specification

# 11.1 Order Form Fields

| Field                 | Type         | Required |
| --------------------- | ------------ | -------- |
| customerName          | text         | Y        |
| customerPhone         | text         | Y        |
| customerEmail         | email        | N        |
| vehicleId             | select       | Y        |
| exteriorColor         | select       | Y        |
| interiorColor         | select       | Y        |
| optionIds             | checkbox[]   | N        |
| expectedDeliveryMonth | month picker | Y        |
| status                | select       | Y        |

---

# 12. AI Summary Panel

右側 Panel。

---

## Section A — AI Order Summary

顯示：

| Field       |
| ----------- |
| Customer    |
| Vehicle     |
| Colors      |
| Options     |
| Delivery    |
| Total Price |

---

## Section B — AI Customer Email Draft

內容：

```text
親愛的王先生您好：

以下為您的訂單資訊...
```

---

# 13. Domain Model

# 13.1 Entities

```text
Order
Vehicle
VehicleOption
OrderOption
```

---

# 14. Database Design

# 14.1 vehicles

| Column     | Type          |
| ---------- | ------------- |
| id         | UUID          |
| brand      | varchar(100)  |
| model      | varchar(100)  |
| base_price | decimal(15,2) |
| active     | boolean       |
| created_at | timestamp     |

---

# 14.2 vehicle_options

| Column     | Type          |
| ---------- | ------------- |
| id         | UUID          |
| name       | varchar(100)  |
| price      | decimal(15,2) |
| active     | boolean       |
| created_at | timestamp     |

---

# 14.3 orders

| Column                  | Type          |
| ----------------------- | ------------- |
| id                      | UUID          |
| order_no                | varchar(50)   |
| customer_name           | varchar(100)  |
| customer_phone          | varchar(50)   |
| customer_email          | varchar(255)  |
| vehicle_id              | UUID          |
| exterior_color          | varchar(50)   |
| interior_color          | varchar(50)   |
| vehicle_base_price      | decimal(15,2) |
| options_total_price     | decimal(15,2) |
| total_price             | decimal(15,2) |
| expected_delivery_month | varchar(7)    |
| status                  | varchar(30)   |
| source_type             | varchar(20)   |
| source_text             | text          |
| uploaded_file_name      | varchar(255)  |
| ai_summary              | text          |
| ai_email                | text          |
| deleted                 | boolean       |
| created_at              | timestamp     |
| updated_at              | timestamp     |

---

# 14.4 order_options

| Column       | Type          |
| ------------ | ------------- |
| order_id     | UUID          |
| option_id    | UUID          |
| option_name  | varchar(100)  |
| option_price | decimal(15,2) |

---

# 15. Pricing Rules

公式：

total_price = vehicle_base_price + \sum(option_price)

---

## Example

3{,}450{,}000 + 180{,}000 + 120{,}000 = 3{,}750{,}000

---

# 16. API Specification

# 16.1 Orders

| Method | Endpoint         |
| ------ | ---------------- |
| GET    | /api/orders      |
| GET    | /api/orders/{id} |
| POST   | /api/orders      |
| PUT    | /api/orders/{id} |
| DELETE | /api/orders/{id} |

---

# 16.2 Master Data

| Method | Endpoint      |
| ------ | ------------- |
| GET    | /api/vehicles |
| GET    | /api/options  |

---

# 16.3 Pricing

| Method | Endpoint                    |
| ------ | --------------------------- |
| POST   | /api/orders/calculate-price |

---

# 16.4 AI APIs

| Method | Endpoint                 |
| ------ | ------------------------ |
| POST   | /api/ai/parse-text       |
| POST   | /api/ai/parse-pdf        |
| POST   | /api/ai/generate-summary |
| POST   | /api/ai/generate-email   |

---

# 17. API Request/Response

# 17.1 AI Parse Request

```json
{
  "sourceText": "王先生想買白色 GLC 300 Coupe..."
}
```

---

# 17.2 AI Parse Response

```json
{
  "customerName": "王先生",
  "customerPhone": "0912-xxx-xxx",
  "customerEmail": "wang@example.com",
  "brand": "Mercedes-Benz",
  "model": "GLC 300 Coupe",
  "exteriorColor": "白色",
  "interiorColor": "黑色",
  "options": [
    "AMG Line",
    "夜色套件"
  ],
  "expectedDeliveryMonth": "2026-06",
  "confidence": 0.92,
  "missingFields": []
}
```

---

# 18. AI Prompt Design

# 18.1 Parse Prompt Rules

AI Responsibilities:

* Extract structured fields only
* Never calculate price
* Never invent unavailable options

---

## System Prompt

```text
You are an order parsing assistant.

Extract vehicle order information into JSON.

Rules:
- Return JSON only
- Do not explain
- Do not calculate price
- Unknown field => null
```

---

# 19. AI Decision Boundary

| Responsibility            | AI  | Backend |
| ------------------------- | --- | ------- |
| Parse text                | YES | NO      |
| Parse PDF text            | YES | NO      |
| Calculate price           | NO  | YES     |
| Validate option existence | NO  | YES     |
| Generate summary          | YES | NO      |

---

# 20. Validation Rules

| Field                 | Validation      |
| --------------------- | --------------- |
| customerName          | required        |
| vehicleId             | required        |
| expectedDeliveryMonth | required        |
| PDF Size              | <= 10MB         |
| PDF Type              | application/pdf |

---

# 21. Error Handling

## AI Parse Failure

UI Message:

```text
AI 無法解析訂單內容，請手動調整。
```

---

## PDF Invalid

```text
僅支援 PDF 檔案。
```

---

# 22. Security Requirements

| Area        | Requirement                 |
| ----------- | --------------------------- |
| API         | Input validation            |
| File Upload | MIME validation             |
| SQL         | Prepared statement          |
| AI Prompt   | Prompt injection protection |
| Logging     | No sensitive prompt logging |

---

# 23. Logging

Required Logs:

| Type              | Description        |
| ----------------- | ------------------ |
| API Request       | endpoint + latency |
| AI Request        | token usage        |
| Error Log         | stack trace        |
| Price Calculation | calculation detail |

---

# 24. Performance Targets

| Metric            | Target   |
| ----------------- | -------- |
| Order Save API    | < 1 sec  |
| Price Calculation | < 300ms  |
| AI Parse          | < 10 sec |
| Order List        | < 2 sec  |

---

# 25. Docker Structure

```text
/frontend
/backend
/docker
```

---

# 26. Docker Compose

Services:

```text
frontend
backend
mysql
nginx
```

---

# 27. Environment Variables

# Frontend

```env
NEXT_PUBLIC_API_BASE_URL=
```

---

# Backend

```env
SPRING_DATASOURCE_URL=
SPRING_DATASOURCE_USERNAME=
SPRING_DATASOURCE_PASSWORD=
OPENAI_API_KEY=
OPENAI_ENDPOINT=
```

---

# 28. Repository Structure

```text
repo-root/
├── frontend/
├── backend/
├── docker/
├── docs/
└── README.md
```

---

# 29. Backend Package Structure

```text
com.company.aivehicleorder

├── controller
├── service
├── repository
├── entity
├── dto
├── mapper
├── config
├── ai
├── pricing
├── exception
└── util
```

---

# 30. Frontend Structure

```text
src/

├── app/
├── components/
├── features/
├── services/
├── hooks/
├── store/
├── types/
└── utils/
```

---

# 31. Seed Data

# Vehicles

| Brand         | Model         | Price   |
| ------------- | ------------- | ------- |
| Mercedes-Benz | GLC 300 Coupe | 3450000 |
| Mercedes-Benz | GLC 200       | 2780000 |
| BMW           | X3            | 2990000 |
| BMW           | X4            | 3320000 |
| Audi          | Q5            | 2890000 |

---

# Options

| Name         | Price  |
| ------------ | ------ |
| AMG Line     | 180000 |
| 夜色套件         | 120000 |
| 23P 智慧駕駛輔助套件 | 150000 |
| Burmester 音響 | 90000  |
| MBUX AR 導航   | 60000  |
| HUD 抬頭顯示     | 70000  |

---

# 32. Delivery Plan

| Day | Scope                 |
| --- | --------------------- |
| D1  | Repo + infra setup    |
| D2  | Flyway migration      |
| D3  | CRUD APIs             |
| D4  | Pricing service       |
| D5  | Order UI              |
| D6  | Frontend integration  |
| D7  | AI parse text         |
| D8  | PDF parsing           |
| D9  | AI summary/email      |
| D10 | Docker + Azure deploy |

---

# 33. Definition of Done

Feature 完成條件：

* Code review completed
* API tested
* Frontend integrated
* Error handling completed
* Docker build success
* Demo flow verified

---

# 34. Future Enhancement (Post MVP)

| Feature             | Priority |
| ------------------- | -------- |
| Login/Auth          | High     |
| RBAC                | High     |
| OCR                 | Medium   |
| Real Email Sending  | Medium   |
| Vehicle CRUD        | Medium   |
| Reporting Dashboard | Low      |
| AI Chat Assistant   | Low      |
