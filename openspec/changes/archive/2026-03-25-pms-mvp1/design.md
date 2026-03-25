## Context

單一旅館前台管理系統（MVP1）。目標用戶為旅館內部工作人員：前台、房務、主管、系統管理員。未來 MVP2 可擴展為多分館架構（加入 `hotel_id` 欄位）。

技術選型：
- 後端：Python + FastAPI + SQLAlchemy ORM + Alembic
- 資料庫：SQLite（MVP；日後升級 PostgreSQL 只需更改 connection string）
- 前端：React 18 + Vite + TailwindCSS + React Query
- 認證：JWT（Access Token 15min + Refresh Token 7d，httpOnly Cookie）

## Goals / Non-Goals

**Goals:**
- 完整前台作業流程：訂房 → Check-in → 消費記帳 → Check-out
- 即時房態看板（所有角色可見）
- 帳單（Folio）自動計算住房費並支援附加消費
- 房務看板：髒房列表與狀態更新
- Manager 儀表板：入住率、今日營收

**Non-Goals:**
- 線上訂房（OTA/Channel Manager 介接）
- 多分館切換（MVP2）
- 客房服務（Room Service）訂單系統
- 餐廳/SPA POS 整合
- 行動 App

## Decisions

### D1：資料庫選 SQLite（MVP）
SQLite + SQLAlchemy + Alembic；零配置啟動，日後遷移 PostgreSQL 成本極低。

### D2：JWT + Refresh Token（httpOnly Cookie）
Access Token 存前端 memory；Refresh Token 存 httpOnly Cookie，防 XSS 竊取。

### D3：房態狀態機（Room Status）
```
AVAILABLE → RESERVED（訂房確認）
RESERVED  → OCCUPIED（Check-in）
OCCUPIED  → DIRTY（Check-out）
DIRTY     → AVAILABLE（房務清潔完成）
任何狀態  → OUT_OF_ORDER（維修）
OUT_OF_ORDER → AVAILABLE（維修完成）
```

### D4：Folio 設計
每筆 Reservation 對應一個 Folio。Folio 包含多筆 FolioItem：
- `ROOM_CHARGE`：每日住房費（Check-in 時預建，或每日自動累計）
- `EXTRA_CHARGE`：附加消費（Mini bar、洗衣等）
- `DISCOUNT`：折扣（負數金額）
- `PAYMENT`：收款（Check-out 時記錄）

結帳邏輯：`balance = sum(amount for item if type != PAYMENT) - sum(amount for item if type == PAYMENT)`

### D5：資料模型
```
User         { id, email, hashed_password, role(ADMIN|FRONT_DESK|HOUSEKEEPING|MANAGER), name }
RoomType     { id, name, description, base_rate, max_occupancy }
Room         { id, number, floor, room_type_id, status(AVAILABLE|RESERVED|OCCUPIED|DIRTY|OUT_OF_ORDER) }
Guest        { id, name, id_type, id_number, phone, email, nationality, created_at }
Reservation  { id, guest_id, room_type_id, room_id(nullable), check_in_date, check_out_date,
               adults, children, rate_per_night, status(CONFIRMED|CHECKED_IN|CHECKED_OUT|CANCELLED|NO_SHOW),
               source(WALK_IN|PHONE|OTA|DIRECT), notes, created_at }
Folio        { id, reservation_id, status(OPEN|CLOSED), created_at }
FolioItem    { id, folio_id, description, amount, item_type(ROOM_CHARGE|EXTRA_CHARGE|DISCOUNT|PAYMENT), created_at }
```

### D6：API 路由
```
/api/v1/auth/*                    認證
/api/v1/room-types/*              房型 CRUD
/api/v1/rooms/*                   房間 CRUD + 房態更新
/api/v1/guests/*                  客人檔案 CRUD
/api/v1/reservations/*            訂房 CRUD + check-in + check-out
/api/v1/folios/:id/*              帳單查看 + 新增項目 + 收款
/api/v1/housekeeping/*            房務看板 + 狀態更新
/api/v1/dashboard/*               統計報表
```

## Risks / Trade-offs

- **房態並發衝突** → SQLite 單寫鎖可接受；PostgreSQL 升級後用 SELECT FOR UPDATE
- **住房費自動記帳** → MVP1 於 Check-in 時一次性建立所有 ROOM_CHARGE 項目（依夜數），避免排程複雜度
- **夜數跨日計算** → 使用 `(check_out_date - check_in_date).days` 計算住宿夜數

## Migration Plan

1. `alembic upgrade head` 建立資料表
2. `python seed.py` 建立 Admin 帳號、範例房型與房間
3. 後端：`uvicorn main:app --port 8001 --reload`
4. 前端：`npm run dev`（proxy → 8001）

## Open Questions

- 是否需要 Early Check-in / Late Check-out 加收費？→ MVP1 不做，留 notes 欄位記錄
- 多幣別？→ MVP1 統一 TWD
