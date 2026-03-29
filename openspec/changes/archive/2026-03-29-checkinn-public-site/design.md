## Context

現有 PMS 後端（FastAPI + SQLite）已有完整的 CheckInn 集團資料（3 品牌、29 旅館、69 房型、688 間房）。所有業務端點均需 JWT 認證並以 hotel_id 隔離。本次需在不破壞現有 staff 功能的前提下，額外暴露一組公開 API，並建立全新的消費者前端。

## Goals / Non-Goals

**Goals:**
- 公開 API：以旅館 slug 為識別，無需登入即可查詢旅館、房型、住房率
- 公開訂房：客人填寫姓名 / 電話 / email 即可完成預訂，取得確認碼
- 訂房查詢與取消：以確認碼 + email 查詢 / 自助取消
- 前端重構 checkinn.com.tw：首頁、品牌展示、旅館列表、旅館詳情、訂房流程、確認頁
- 共用 DB：直接讀取 PMS SQLite 的 checkinn tenant 資料

**Non-Goals:**
- 會員系統（Guest account / 登入）— Phase 2
- 線上付款串接 — Phase 2
- AsiaMiles 積分整合 — Phase 2
- 多語言 (i18n) — Phase 2
- 旅館管理員後台（已有 PMS 承擔）

## Decisions

### 1. 後端：公開 API Router

新增 `backend/routers/public.py`，掛載於 `/api/v1/public`，**不經過 `get_hotel_context()` dependency**。

```
GET  /public/hotels?tenant_slug=checkinn[&brand_slug=select][&region=北部]
GET  /public/hotels/{hotel_slug}
GET  /public/hotels/{hotel_slug}/room-types
GET  /public/hotels/{hotel_slug}/availability?check_in=YYYY-MM-DD&check_out=YYYY-MM-DD
POST /public/bookings
GET  /public/bookings/{confirmation_code}?email={email}
POST /public/bookings/{confirmation_code}/cancel
```

Auth：全部無需 Bearer token。Rate limiting 以後 nginx 層處理，MVP 先不實作。

### 2. 資料模型：confirmation_code

`Reservation` model 加入：

```python
confirmation_code = Column(String(12), unique=True, index=True, nullable=True)
```

生成規則：建立時以 `secrets.token_urlsafe(8)` 生成 12 字元大小寫英數字串。公開訂房 endpoint 必填；現有 staff 建立訂房可為 NULL（向下相容）。

Alembic migration：`alembic revision --autogenerate -m "add_confirmation_code_to_reservation"`

### 3. 公開訂房 Payload

```json
POST /public/bookings
{
  "hotel_slug": "songjiang",
  "room_type_id": 3,
  "check_in_date": "2026-04-10",
  "check_out_date": "2026-04-12",
  "adults": 2,
  "children": 0,
  "guest_name": "王志明",
  "guest_phone": "0912-345-678",
  "guest_email": "wang@example.com",
  "guest_id_type": "ID_CARD",
  "notes": ""
}
```

邏輯：
1. 查 `hotel` by slug + tenant_slug=checkinn
2. 驗證房型屬於該旅館
3. 查詢指定日期住房率，確認有餘量（`available_count > 0`）
4. upsert Guest（以 email + hotel_id 為唯一鍵）
5. 建立 `Reservation`（status=CONFIRMED, source=DIRECT, confirmation_code 生成）
6. 回傳 `{ confirmation_code, hotel_name, room_type_name, check_in_date, check_out_date, total_amount }`

### 4. 前端架構

**獨立 Vite 專案**：`frontend-public/`（port 5920）

```
frontend-public/
├── src/
│   ├── lib/api.js          # Axios，base URL → /api（proxy 到 8910）
│   ├── pages/
│   │   ├── Home.jsx        # 首頁
│   │   ├── Hotels.jsx      # 旅館列表
│   │   ├── HotelDetail.jsx # 旅館詳情
│   │   ├── BookingForm.jsx # 訂房表單
│   │   ├── BookingConfirm.jsx  # 確認頁
│   │   └── BookingLookup.jsx   # 訂房查詢
│   ├── components/
│   │   ├── BookingWidget.jsx   # 首頁快速訂房元件
│   │   ├── HotelCard.jsx
│   │   ├── RoomTypeCard.jsx
│   │   ├── BrandPill.jsx
│   │   └── Navbar.jsx
│   └── App.jsx
├── index.html
├── vite.config.js          # proxy /api → http://localhost:8910
├── tailwind.config.js
└── package.json
```

**Tech Stack：**
- React 18 + Vite
- TailwindCSS（白底、深灰 #32373c 主色，符合 CheckInn 視覺）
- TanStack Query v5
- React Router v6
- react-hook-form + zod
- react-day-picker（訂房日期選擇器）

### 5. 頁面路由與對應 API

| 路由 | 頁面 | API |
|------|------|-----|
| `/` | 首頁 | `GET /public/hotels?tenant_slug=checkinn` |
| `/hotels` | 旅館列表（可篩品牌/地區） | 同上 |
| `/hotels/:slug` | 旅館詳情 | `GET /public/hotels/:slug` + `/room-types` |
| `/hotels/:slug/book` | 訂房表單 | `GET /public/hotels/:slug/availability` |
| `/booking/confirm/:code` | 訂房確認頁 | `GET /public/bookings/:code?email=` |
| `/booking/lookup` | 訂房查詢 | 同上 |

### 6. 首頁結構（對應 checkinn.com.tw）

```
[Navbar] — Logo + 品牌系列 + 旅館位置 + 優惠 + 關於我們

[Hero Banner]
  ↳ BookingWidget：縣市 → 旅館 → 入住/退房日期 → 人數 → [立刻預訂]

[品牌展示]
  ↳ 三張品牌卡：藏居 SELECT / 旅館 HOTEL / 快捷 EXPRESS

[旅館位置格]
  ↳ 按地區分組（北部 / 中部 / 南部 / 東部）的旅館卡片

[最新優惠]（靜態展示，Phase 2 再接 API）

[Footer] — 電話、社群連結、版權
```

### 7. CORS 更新

`backend/main.py` 的 `allow_origins` 加入：
```python
"http://localhost:5920",      # 公開前端開發
"https://book.checkinn.com.tw"  # 未來生產域名（placeholder）
```

## Risks / Trade-offs

| 風險 | 說明 | 緩解 |
|------|------|------|
| 住房率計算無 room assignment | 公開端點只能看 room_type 餘量，無法保留特定房間 | 訂房時先到先得；check-in 時 staff 再分配實際房間 |
| SQLite 並發寫入 | 同時多人訂房可能 race condition | MVP 可接受；Phase 2 改 PostgreSQL |
| 無付款保護 | 訂房後客人可能不到 | 加 notes 欄位填「信用卡保留」；Phase 2 串金流 |
| confirmation_code nullable | 舊資料 NULL 值 | 公開查詢只接受非 NULL 值；staff 建立的訂房不影響 |
