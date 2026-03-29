## 1. 資料庫 Schema — 三層租戶架構

- [x] 1.1 建立 `Tenant` model（id, name, slug unique, contact_email, is_active, created_at）
- [x] 1.2 建立 `Brand` model（id, tenant_id FK, name, slug, is_active, created_at）
- [x] 1.3 建立 `Hotel` model（id, brand_id FK, tenant_id FK denorm, name, slug, address, is_active, created_at）
- [x] 1.4 Alembic migration：建立 tenants / brands / hotels 表
- [x] 1.5 所有業務 model 新增 `hotel_id` 欄位（User, RoomType, Room, Guest, Reservation, Folio）— 先 nullable
- [x] 1.6 Alembic migration：業務表加 hotel_id 欄位
- [x] 1.7 建立 `migrate_to_multitenant.py`：建立預設 Tenant / Brand / Hotel，將現有資料全部指派
- [x] 1.8 第二次 migration：將 hotel_id 改為 NOT NULL，Guest 唯一性約束改為 (hotel_id, id_number)

## 2. 後端 — 角色與認證擴充

- [x] 2.1 擴充 `UserRole` enum：加入 SUPER_ADMIN、TENANT_ADMIN、BRAND_ADMIN
- [x] 2.2 JWT payload 加入 hotel_id / brand_id / tenant_id claims
- [x] 2.3 更新 `create_access_token()` 帶入三層 ID
- [x] 2.4 更新 `get_current_user()` dependency 解析新 claims
- [x] 2.5 新增 `require_role()` 支援多角色 + SUPER_ADMIN bypass

## 3. 後端 — Tenant Context Middleware

- [x] 3.1 新增 `get_hotel_context()` dependency：從 token 取得 Hotel 物件，驗證 is_active
- [x] 3.2 新增 `get_tenant_context()` / `get_brand_context()` dependency（上層管理 API 用）
- [x] 3.3 所有業務 router（rooms, guests, reservations, folio, housekeeping, dashboard）加入 hotel context dependency
- [x] 3.4 所有業務 API 的 query 加上 `filter_by(hotel_id=hotel.id)`
- [x] 3.5 新增 SUPER_ADMIN `X-Hotel-Id` header bypass 機制

## 4. 後端 — 旅館註冊 API

- [x] 4.1 新增 `POST /register` 端點：一次建立 Tenant + Brand + Hotel + TENANT_ADMIN 用戶
- [x] 4.2 新增 `GET/POST /admin/tenants` 端點（SUPER_ADMIN 用）
- [x] 4.3 新增 `GET/POST /admin/brands` 端點（SUPER_ADMIN / TENANT_ADMIN 用）
- [x] 4.4 新增 `GET/POST /admin/hotels` 端點（含停用旅館功能）
- [x] 4.5 新增 `GET /admin/dashboard` 跨旅館彙總端點（SUPER_ADMIN 用）
- [x] 4.6 新增 `POST /admin/switch-hotel` 端點：TENANT/BRAND ADMIN 取得指定 Hotel context token

## 5. 後端 — Schema 更新

- [x] 5.1 新增 `TenantCreate`, `BrandCreate`, `HotelCreate`, `RegisterRequest` schemas
- [x] 5.2 更新 `UserCreate` / `UserResponse` 加入 hotel_id / brand_id / tenant_id
- [x] 5.3 更新 `GuestCreate` 唯一性約束為 hotel 範圍
- [x] 5.4 更新 `TokenResponse` / `LoginResponse` 加入 hotel / brand / tenant 資訊

## 6. 前端 — AuthContext 與 API 擴充

- [x] 6.1 擴充 `AuthContext`：加入 `hotel`, `brand`, `tenant` 物件
- [x] 6.2 更新 `api.js`：請求自動帶 `X-Hotel-Id` header（從 AuthContext 取得）
- [x] 6.3 更新 `PrivateRoute`：支援多角色與上層管理路由

## 7. 前端 — 旅館自助註冊頁面

- [x] 7.1 建立 `/register` 頁面（三步驟表單：集團資訊 → 第一間旅館 → 管理員帳號）
- [x] 7.2 登入頁面加入「立即註冊旅館」連結

## 8. 前端 — Super Admin 管理介面

- [x] 8.1 建立 `/admin/tenants` 頁面：集團列表、停用/啟用
- [x] 8.2 建立 `/admin/hotels` 頁面：所有旅館列表、跨集團視圖
- [x] 8.3 建立 `/admin/dashboard` 頁面：跨集團彙總儀表板
- [x] 8.4 側邊欄加入 SUPER_ADMIN 專屬選單項目

## 9. 前端 — Tenant/Brand Admin 管理介面

- [x] 9.1 建立旅館切換元件（TENANT_ADMIN / BRAND_ADMIN 可切換進入不同旅館）
- [x] 9.2 建立 `/manage/hotels` 頁面：管理旗下所有旅館
- [x] 9.3 建立 `/manage/brands` 頁面（TENANT_ADMIN 用）

## 10. 測試與收尾

- [x] 10.1 驗證 tenant isolation：每個業務 API 加測試確認跨旅館存取回傳 404
- [x] 10.2 更新 `seed.py`：加入預設 Tenant / Brand / Hotel seed 資料
- [x] 10.3 更新 Playwright e2e tests：加入旅館註冊流程測試
- [x] 10.4 更新 README：新增 Multi-Tenant 架構說明與 Super Admin 操作指南
