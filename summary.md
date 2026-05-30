# AI Vehicle Order System — Project Summary

> 本文件為系統開發執行過程與結果的總結，涵蓋系統需求、系統架構、部署架構與開發流程。

---

## 1. 系統需求

### 1.1 產品目標

為汽車經銷商的業務人員開發一套 AI 輔助 B2B 車輛訂單管理系統。業務人員將客戶需求文字或 PDF 貼入系統，AI 自動解析並填寫訂單表單，後端即時計算價格，完成後 AI 產生訂單摘要。

### 1.2 核心使用流程

```
客戶需求文字 / PDF 上傳
        ↓
AI 解析 → 自動填入訂單表單
        ↓
業務人員審核 / 手動調整
        ↓
後端即時計算總價
        ↓
儲存訂單
        ↓
AI 產生訂單摘要
```

### 1.3 MVP 功能範圍

| 功能 | 說明 |
|---|---|
| 訂單 CRUD | 建立、查詢、編輯、刪除（軟刪除）訂單 |
| AI 文字解析 | 貼上客戶文字，AI 解析為結構化訂單欄位 |
| AI PDF 解析 | 上傳文字型 PDF（最大 10MB、5 頁），後端提取文字後 AI 解析 |
| 即時價格計算 | 車款基本售價 + 選配加總，後端計算 |
| AI 訂單摘要 | 訂單完成後，AI 產生繁體中文摘要段落 |
| 車款推薦 | 客戶未指定車款時，AI 依預算與偏好推薦 |
| Azure Docker 部署 | HTTPS + Let's Encrypt，單一 Azure VM |

**MVP 明確不含：** 登入驗證、RBAC、OCR、真實寄信、車款 CRUD、報表儀表板

### 1.4 車款目錄（15 款）

| 品牌 | 車款 | 參考售價 |
|---|---|---|
| Mercedes-Benz | GLC 300 Coupe | NT$3,450,000 |
| Mercedes-Benz | GLC 200 | NT$2,780,000 |
| Mercedes-Benz | E 300 | NT$3,890,000 |
| Mercedes-Benz | GLE 450 | NT$5,200,000 |
| BMW | X3 | NT$2,990,000 |
| BMW | X4 | NT$3,320,000 |
| BMW | 3 Series 330i | NT$2,490,000 |
| BMW | X5 xDrive40i | NT$4,780,000 |
| BMW | 5 Series 530i | NT$3,680,000 |
| Audi | Q5 | NT$2,890,000 |
| Audi | Q3 | NT$2,190,000 |
| Audi | A4 | NT$2,480,000 |
| Volvo | XC60 | NT$2,590,000 |
| Volvo | XC40 | NT$1,990,000 |
| Lexus | RX 350 | NT$3,290,000 |

### 1.5 選配目錄（6 項）

| 選配名稱 | 價格 |
|---|---|
| AMG Line | NT$180,000 |
| 夜色套件 | NT$120,000 |
| 23P 智慧駕駛輔助套件 | NT$150,000 |
| Burmester 音響 | NT$90,000 |
| MBUX AR 導航 | NT$60,000 |
| HUD 抬頭顯示 | NT$70,000 |

---

## 2. 系統架構

### 2.1 技術選型

| 層 | 技術 |
|---|---|
| Frontend | Next.js 15 App Router + React 19.1 + TypeScript |
| UI | MUI v6 + Tailwind CSS 4 |
| 狀態管理 | Zustand |
| HTTP Client | Axios |
| 表單驗證 | react-hook-form + zod |
| Backend | Java 25 + Spring Boot 3.4.5 |
| ORM | Spring Data JPA (Hibernate 7) |
| DB Migration | Flyway |
| AI SDK | Spring AI (Azure OpenAI adapter) |
| PDF 處理 | Apache PDFBox 3（後端伺服器端） |
| API 文件 | SpringDoc OpenAPI 3 / Swagger UI |
| Package Manager | pnpm（前端）/ Maven（後端） |

### 2.2 分層架構

```
Frontend (Next.js 15)
    ↕ REST API (/api/*)
Nginx Reverse Proxy
    ↕
Backend (Spring Boot 3.4.5)
  ┌─ Controller Layer    ← 薄層，僅驗證輸入、委派 Service
  ├─ Service Layer       ← 商業邏輯，@Transactional
  ├─ Repository Layer    ← Spring Data JPA
  ├─ AI Orchestration    ← 隔離於 ai/ 套件，唯一 AI 呼叫入口
  └─ Pricing             ← PriceCalculator 純函數，無 I/O
    ↕
Azure Database for MySQL
Azure OpenAI (GPT-4o)
```

### 2.3 API 端點

| Method | Endpoint | 說明 |
|---|---|---|
| GET | /api/orders | 訂單列表（支援 keyword/status 篩選，orderNo DESC 排序） |
| GET | /api/orders/{id} | 取得單一訂單 |
| POST | /api/orders | 建立訂單 |
| PUT | /api/orders/{id} | 更新訂單 |
| DELETE | /api/orders/{id} | 軟刪除訂單 |
| POST | /api/orders/calculate-price | 即時計算價格 |
| GET | /api/vehicles | 車款列表 |
| GET | /api/options | 選配列表 |
| POST | /api/ai/parse-text | AI 解析文字 |
| POST | /api/ai/parse-pdf | AI 解析 PDF |
| POST | /api/ai/generate-summary | AI 產生訂單摘要 |

### 2.4 AI 設計原則

- **AI 只做：** 自然語言解析、摘要生成
- **後端只做：** 價格計算、選配驗證
- 所有 AI 呼叫由 `AiOrchestrationService` 統一處理，前端不直接呼叫 Azure OpenAI
- Prompt 為 `.txt` 檔案，存放於 `backend/src/main/resources/prompts/`
- 使用者輸入置於 `user` role，永不注入 `system` role（防止 Prompt Injection）
- AI 呼叫硬性超時：15 秒
- AI 失敗不影響訂單儲存

### 2.5 資料庫設計

```
vehicles (15筆種子資料)
  └── (1:M) → orders
              └── (M:M via order_options) → vehicle_options (6筆)
```

- UUID 主鍵，由 Java 生成
- 訂單號格式：`ORD-YYYYMMDD-XXXX`
- 價格快照：下單時將車款售價、選配價格寫入訂單，不依賴即時 join
- 軟刪除：`orders.deleted = TRUE`
- Flyway migration 命名：`V{n}__{description}.sql`（已提交不可修改）

### 2.6 前端頁面結構

| 路由 | 功能 |
|---|---|
| `/orders` | 訂單列表：搜尋、狀態篩選、統計 Card、可排序表頭 |
| `/orders/new` | 建立訂單：AI 輸入面板 + 訂單表單 + 摘要面板 |
| `/orders/[id]` | 編輯訂單：同上，預填現有資料 |

---

## 3. 部署架構

### 3.1 生產環境

```
Internet
   ↓ HTTPS (443)
Azure VM (Ubuntu 22.04)
  └─ Docker Compose
      ├─ nginx:alpine        ← 反向代理 + SSL 終止
      │   ├─ /api/* → backend:8080
      │   └─ /*    → frontend:3000
      ├─ frontend (Next.js)  ← ghcr.io/.../frontend:latest
      └─ backend (Spring Boot) ← ghcr.io/.../backend:latest
           ↕
      Azure Database for MySQL (外部託管)
      Azure OpenAI (外部 API)
```

### 3.2 HTTPS 憑證

- Let's Encrypt 免費 SSL 憑證
- Certbot 自動更新（90 天到期）
- 憑證路徑 mount 進 nginx 容器：`/etc/letsencrypt:/etc/letsencrypt:ro`
- HTTP (80) 自動 redirect → HTTPS (443)
- 域名：`vickychenaidemo.westus2.cloudapp.azure.com`

### 3.3 環境變數管理

| 類型 | 管理方式 |
|---|---|
| DB 連線資訊 | `/opt/aivehicleorder/backend.env`（chmod 600） |
| Azure OpenAI 金鑰 | `/opt/aivehicleorder/backend.env` |
| 域名設定 | `/opt/aivehicleorder/.env`（DOMAIN、GITHUB_REPOSITORY） |
| 前端 API URL | `docker-compose.prod.yml` 內 `NEXT_PUBLIC_API_BASE_URL` |
| CI/CD 密鑰 | GitHub Actions Secrets |

### 3.4 CI/CD 流程（GitHub Actions）

```
PR to main
  └─ CI Pipeline
      ├─ mvn test (backend)
      └─ pnpm build (frontend)

Push to main
  └─ Deploy Pipeline
      ├─ Build Docker images
      ├─ Push to GHCR
      └─ SSH to Azure VM
          └─ docker compose pull && up -d
```

### 3.5 Azure NSG 開放 Ports

| Port | 用途 |
|---|---|
| 22 | SSH 管理 |
| 80 | HTTP（自動 redirect 至 HTTPS） |
| 443 | HTTPS 正式流量 |

---

## 4. 開發流程

### 4.1 本機啟動步驟

```bash
# 1. 後端（需有 backend/local.env）
cd backend
.\start-local.ps1        # Windows PowerShell

# 2. 前端
cd frontend
pnpm dev
```

- 後端：`http://localhost:8080`
- 前端：`http://localhost:3000`
- Swagger UI：`http://localhost:8080/swagger-ui.html`

### 4.2 主要開發規範

- **後端：** Controller 薄層、Service 含商業邏輯、Repository 只做 JPA、AI 層隔離
- **前端：** Page 為薄編排層、業務邏輯在 `features/` hooks、元件接收 props
- **Migration：** 已 commit 的 `.sql` 不可修改，新變更建新版本號
- **AI Prompt：** 純 `.txt` 檔案，啟動時由 `PromptTemplateLoader` 載入

### 4.3 測試策略

| 層 | 工具 | 範圍 |
|---|---|---|
| Backend Unit Test | JUnit 5 + Mockito | Service、Repository、AI、Mapper |
| Backend Integration Test | @DataJpaTest + H2 | Repository 查詢、排序、軟刪除 |
| Frontend Type Check | `pnpm type-check` | TypeScript 靜態型別驗證 |
| Frontend Build | `pnpm build` | 完整 Next.js 建置 |
| AI 測試 | Mock `AiOrchestrationService` | CI 環境不呼叫真實 Azure OpenAI |

### 4.4 本次執行的主要修改項目

| 類別 | 修改內容 |
|---|---|
| UI 優化 | 調整標題字體大小一致、AiInputPanel 行高、全版面佈局、按鈕位置 |
| AI 解析 | 注入當前日期修正相對日期解析（明年三月 → 正確年份） |
| AI 車款推薦 | 無指定車款時依預算/偏好推薦，加入各車款 keyword profile |
| 訂單排序 | 後端 `orderNo DESC` 排序；前端表頭可點擊排序（6 欄） |
| 訂單摘要 | 修正編輯頁面訂單摘要欄位不顯示的問題 |
| 車款擴充 | 從 5 款擴充至 15 款（含 Volvo、Lexus） |
| HTTPS | Azure VM 配置 Let's Encrypt，Nginx HTTPS + HTTP redirect |
| CORS | 新增 `https://*.cloudapp.azure.com` 允許正式環境 API 存取 |
| 文件同步 | SPEC.md、ARCHITECTURE.md、README.md 與實作對齊 |

---

*Generated: 2026-05-30*
