## Context

目前 PMS 為單一旅館架構：所有資料表無旅館歸屬欄位，認證 token 只攜帶 user_id 與 role，無法區分不同旅館的資料。MVP2 目標是將系統改造為 SaaS 平台，支援連鎖旅館集團的三層組織架構。

## Goals / Non-Goals

**Goals:**
- 三層租戶架構：**Tenant（集團）→ Brand（品牌）→ Hotel（旅館）**
- 旅館是業務資料的根節點，所有 Room / Guest / Reservation / Folio 等均歸屬 Hotel
- 各層可獨立管理帳號，權限由上至下繼承
- 旅館自助註冊流程（建立 Tenant + 第一個 Brand + 第一間 Hotel）
- Super Admin 可跨所有 Tenant 管理
- 現有資料無損遷移至預設 Tenant / Brand / Hotel
- 前端依登入 Hotel context 隔離所有操作

**Non-Goals:**
- 跨旅館共用客人資料或訂房記錄
- Subdomain routing（MVP2 使用 header 攜帶 hotel context）
- 計費 / 訂閱管理（留給 MVP3）
- 白標（White-label）客製化介面

## Decisions

### 1. 三層架構定義

```
Tenant（集團/公司）
  └── Brand（品牌，如 Marriott / Sheraton）
        └── Hotel（單一旅館/據點）
```

- **Tenant**：最高層，代表一個企業主體（如「ABC 旅館集團」）
- **Brand**：Tenant 下的品牌線（如「豪華系列」「商務系列」）；Tenant 可有多個 Brand
- **Hotel**：Brand 下的單一旅館（如「台北信義館」）；Brand 可有多家 Hotel
- 業務資料（Room、Guest、Reservation…）歸屬 **Hotel**，不跨層共用

### 2. 資料庫 Schema

```
Tenant: id, name, slug (unique), contact_email, is_active, created_at
Brand:  id, tenant_id (FK), name, slug, is_active, created_at
Hotel:  id, brand_id (FK), tenant_id (FK denorm), name, slug, address, is_active, created_at

User:        hotel_id (nullable = Super Admin / Tenant Admin / Brand Admin), role, scope
RoomType:    hotel_id
Room:        hotel_id
Guest:       hotel_id
Reservation: hotel_id
Folio:       hotel_id
```

> `hotel_id` 在 Tenant/Brand Admin 層為 NULL，改以 `tenant_id` / `brand_id` 識別其管理範圍。

### 3. 角色與權限層級

| Role | 層級 | 可管理範圍 |
|------|------|-----------|
| `SUPER_ADMIN` | 平台 | 所有 Tenant |
| `TENANT_ADMIN` | Tenant | 旗下所有 Brand 與 Hotel |
| `BRAND_ADMIN` | Brand | 旗下所有 Hotel |
| `ADMIN` | Hotel | 當前旅館 |
| `FRONT_DESK` | Hotel | 當前旅館（業務操作） |
| `HOUSEKEEPING` | Hotel | 當前旅館（房務） |
| `MANAGER` | Hotel | 當前旅館（查看報表） |

### 4. 認證與 Token 設計

JWT payload 加入：
```json
{
  "sub": "user_id",
  "role": "ADMIN",
  "hotel_id": 1,
  "brand_id": 2,
  "tenant_id": 3
}
```

上層管理員（TENANT_ADMIN / BRAND_ADMIN）登入後可「切換進入」某間 Hotel，取得該 Hotel context 的 token。

### 5. 註冊流程

`POST /register` 公開端點，一次建立：
1. `Tenant`（集團名稱、slug）
2. `Brand`（預設品牌，slug 可選）
3. `Hotel`（第一間旅館名稱、地址）
4. `User`（TENANT_ADMIN 帳號）

### 6. tenant context middleware

```python
# 業務 API dependency
async def get_hotel_context(token, db) -> Hotel:
    hotel = db.get(Hotel, token.hotel_id)
    if not hotel or not hotel.is_active:
        raise HTTPException(403)
    return hotel

# 所有查詢自動套用 hotel_id filter
q = db.query(Room).filter_by(hotel_id=hotel.id)
```

### 7. Migration 策略

1. Alembic migration：建立 `tenants`、`brands`、`hotels` 表
2. 現有 User / RoomType / Room / Guest / Reservation / Folio 加 `hotel_id`（nullable）
3. `migrate_to_multitenant.py`：建立預設 Tenant / Brand / Hotel，將現有資料全部指派
4. 第二次 migration：將 `hotel_id` 欄位改為 NOT NULL

### 8. 前端架構

- `AuthContext` 加入 `{ tenant, brand, hotel }` 物件
- 新增 `/register` 公開頁面（三步驟：集團→品牌→旅館→管理員帳號）
- 新增 `/admin` 系列頁面（SUPER_ADMIN 用）
- TENANT_ADMIN / BRAND_ADMIN 的管理介面（切換 Hotel）

## Risks / Trade-offs

| 風險 | 說明 | 緩解 |
|------|------|------|
| Schema 複雜度上升 | 三層 FK 關係增加 JOIN 複雜度 | 業務 API 僅需 hotel_id，Brand / Tenant 只在管理介面使用 |
| Migration 資料遺失 | 多層 migration 步驟風險 | 分兩次 migration，先 nullable 再 NOT NULL；備份 DB |
| 跨租戶資料洩漏 | 漏掉 hotel_id filter | 加 integration test 驗證每個 endpoint 的 isolation |
| 用戶角色設計變更 | 現有 UserRole enum 需擴充 | 向下相容：現有 ADMIN / FRONT_DESK / HOUSEKEEPING / MANAGER 不變，新增三個上層角色 |
