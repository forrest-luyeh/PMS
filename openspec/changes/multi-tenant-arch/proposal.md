## Why

目前系統為單一旅館設計（Single-Tenant），所有資料共用同一資料庫且無旅館歸屬。MVP2 目標是將 PMS 改造為 SaaS 平台，支援連鎖旅館集團以「集團 → 品牌 → 旅館」三層架構自助註冊，多間旅館共用平台但資料完全隔離。

## What Changes

- **新增三層租戶架構**：`Tenant`（集團）→ `Brand`（品牌）→ `Hotel`（旅館）
- **新增旅館自助註冊流程**：一次建立集團、品牌、第一間旅館與管理員帳號
- **所有業務資料表**加入 `hotel_id` 外鍵（Room、RoomType、Guest、Reservation、Folio）
- **新增上層管理角色**：`SUPER_ADMIN`、`TENANT_ADMIN`、`BRAND_ADMIN`
- **API 層加入 tenant context**：所有查詢自動套用當前旅館過濾
- **認證系統擴充**：JWT token 攜帶 hotel_id / brand_id / tenant_id
- **前端新增管理介面**：Super Admin 跨集團管理、Tenant/Brand Admin 切換旅館
- **BREAKING**：現有資料需遷移至預設 Tenant / Brand / Hotel

## Capabilities

### New Capabilities

- `tenant-management`: 三層租戶（Tenant / Brand / Hotel）的建立與管理；自助註冊流程；Super Admin 跨集團操作介面
- `tenant-isolation`: API 層自動套用 hotel_id 過濾的機制；tenant context middleware；資料隔離保證

### Modified Capabilities

- `user-auth`: JWT token 加入三層 ID claim；擴充角色（SUPER_ADMIN / TENANT_ADMIN / BRAND_ADMIN）；用戶綁定 Hotel
- `room-management`: Room / RoomType 加入 hotel_id，查詢限定當前旅館
- `reservation-management`: Reservation 加入 hotel_id
- `guest-management`: Guest 加入 hotel_id，各旅館獨立客人庫；唯一性約束改為 hotel 範圍內
- `folio-management`: Folio 加入 hotel_id
- `housekeeping`: 房務任務限定當前旅館
- `dashboard`: 數據限定當前旅館；Super Admin 可看跨集團彙總

## Impact

- **資料庫**：新增 `tenants`、`brands`、`hotels` 表；所有主要表加 hotel_id；需兩次 Alembic migration
- **後端**：新增 tenant context middleware；`get_hotel_context()` dependency；`/register`、`/admin/*` 新端點
- **前端**：AuthContext 擴充三層 context；新增 `/register`、`/admin` 頁面
- **現有資料**：一次性 migration script 建立預設三層結構並指派所有現有資料
