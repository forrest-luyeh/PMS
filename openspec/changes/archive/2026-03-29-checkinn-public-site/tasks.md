## 1. 後端 — Reservation confirmation_code

- [x] 1.1 `Reservation` model 加入 `confirmation_code = Column(String(12), unique=True, index=True, nullable=True)`
- [x] 1.2 新增 helper function `generate_confirmation_code()` — 使用 `secrets.token_urlsafe(8)` 生成 12 字元代碼
- [x] 1.3 建立 Alembic migration：`add_confirmation_code_to_reservation`
- [x] 1.4 執行 `alembic upgrade head` 驗證 migration 成功

## 2. 後端 — 公開 API Router

- [x] 2.1 建立 `backend/routers/public.py`，實作 `GET /public/hotels`
  - 支援 query params：`tenant_slug`（必填）、`brand_slug`（選填）、`region`（選填）
  - 回傳：`[{ id, slug, name, brand_name, region, address, phone, check_in_time, check_out_time, images }]`
- [x] 2.2 實作 `GET /public/hotels/{hotel_slug}`
  - 回傳：旅館基本資訊 + amenities + images
- [x] 2.3 實作 `GET /public/hotels/{hotel_slug}/room-types`
  - 回傳：`[{ id, name, bed_type, max_occupancy, base_rate, description, images, amenities }]`
- [x] 2.4 實作 `GET /public/hotels/{hotel_slug}/availability`
  - Query params：`check_in`、`check_out`（必填）
  - 邏輯：計算指定日期區間各房型的可用房數（總房數 - 已確認訂房數）
  - 回傳：`[{ room_type_id, room_type_name, available_count, base_rate, total_price }]`
- [x] 2.5 實作 `POST /public/bookings`
  - Payload：`hotel_slug, room_type_id, check_in_date, check_out_date, adults, children, guest_name, guest_phone, guest_email, guest_id_type, notes`
  - 邏輯：查旅館 → 驗房型 → 查住房率 → upsert Guest → 建 Reservation（含 confirmation_code）
  - 回傳：`{ confirmation_code, hotel_name, room_type_name, check_in_date, check_out_date, total_amount }`
- [x] 2.6 實作 `GET /public/bookings/{confirmation_code}?email={email}`
  - 以 confirmation_code + guest email 雙重驗證後回傳訂房詳情
- [x] 2.7 實作 `POST /public/bookings/{confirmation_code}/cancel`
  - Body：`{ email }` 作為身份驗證
  - 邏輯：狀態必須為 CONFIRMED 才可取消；改為 CANCELLED
- [x] 2.8 在 `backend/main.py` 掛載 public router：`app.include_router(public_router, prefix="/api/v1")`
- [x] 2.9 更新 `main.py` CORS `allow_origins` 加入 `http://localhost:5920`

## 3. 後端 — Schemas

- [x] 3.1 建立 `backend/schemas/public.py`，定義所有公開 API 的 Request / Response schema
  - `PublicHotelResponse`、`PublicRoomTypeResponse`、`PublicAvailabilityResponse`
  - `PublicBookingCreate`（含 guest 欄位）、`PublicBookingResponse`、`PublicBookingDetail`

## 4. 前端 — 專案初始化

- [x] 4.1 在 `frontend-public/` 建立 Vite + React 專案：`npm create vite@latest frontend-public -- --template react`
- [x] 4.2 安裝依賴：`npm install tailwindcss @tanstack/react-query react-router-dom axios react-hook-form zod react-day-picker`
- [x] 4.3 設定 TailwindCSS（`tailwind.config.js`，顏色主題：primary `#32373c`）
- [x] 4.4 設定 `vite.config.js` proxy：`/api` → `http://localhost:8910`
- [x] 4.5 建立 `src/lib/api.js`：Axios instance，base URL `/api/v1/public`

## 5. 前端 — 共用元件

- [x] 5.1 `Navbar.jsx` — Logo（雀客）+ 導航連結（品牌系列、旅館位置、優惠、關於我們）+ RWD hamburger
- [x] 5.2 `Footer.jsx` — 電話、社群連結（Instagram / Facebook / LINE）、版權
- [x] 5.3 `HotelCard.jsx` — 旅館卡片（圖片、名稱、地區、品牌標籤、[查看詳情] 按鈕）
- [x] 5.4 `RoomTypeCard.jsx` — 房型卡片（圖片、名稱、床型、最大住客、價格、[立刻訂房] 按鈕）
- [x] 5.5 `BrandPill.jsx` — 品牌篩選標籤（全部 / 藏居 / 旅館 / 快捷）
- [x] 5.6 `BookingWidget.jsx` — 首頁快速訂房元件
  - 縣市/地區下拉 → 旅館下拉（依地區篩選）→ 入住/退房日期（react-day-picker）→ 人數 → [立刻預訂]
  - 送出後 navigate 至 `/hotels/:slug/book?check_in=&check_out=&adults=`
- [x] 5.7 `DateRangePicker.jsx` — 封裝 react-day-picker 的日期區間選擇器（含最小入住日 = 今天）（內嵌於 BookingWidget）

## 6. 前端 — 頁面

- [x] 6.1 `Home.jsx` — 首頁
  - Hero banner（全寬背景圖、標語 "STAY EASY. STAY SMART."、BookingWidget）
  - 品牌展示（3 張品牌卡：SELECT / HOTEL / EXPRESS，點選過濾旅館列表）
  - 地區旅館格（北部 / 中部 / 南部 / 東部，各顯示旅館卡片）
  - 最新優惠（靜態 placeholder 卡片）
- [x] 6.2 `Hotels.jsx` — 旅館列表頁 `/hotels`
  - BrandPill 篩選 + 地區篩選
  - HotelCard 網格（useQuery 呼叫 `GET /public/hotels?tenant_slug=checkinn`）
- [x] 6.3 `HotelDetail.jsx` — 旅館詳情頁 `/hotels/:slug`
  - 圖片輪播、基本資訊（地址、電話、入退時間）、設施列表
  - RoomTypeCard 列表（含 [訂房] 按鈕，帶入已選日期）
- [x] 6.4 `BookingForm.jsx` — 訂房表單頁 `/hotels/:slug/book`
  - 顯示旅館名、已選房型、日期、住房率（呼叫 `/public/availability`）
  - react-hook-form：姓名、電話、email、備註
  - 送出呼叫 `POST /public/bookings`，成功後 navigate 至確認頁
- [x] 6.5 `BookingConfirm.jsx` — 訂房確認頁 `/booking/confirm/:code`
  - 顯示確認碼（大字）、旅館、房型、入退日、總金額
  - [查詢訂房] 連結、[返回首頁] 按鈕
- [x] 6.6 `BookingLookup.jsx` — 訂房查詢頁 `/booking/lookup`
  - 輸入確認碼 + email → 呼叫 `GET /public/bookings/:code?email=`
  - 顯示訂房詳情 + [取消訂房] 按鈕（呼叫 `POST /public/bookings/:code/cancel`）
- [x] 6.7 `App.jsx` — React Router 路由設定，QueryClientProvider 包裹

## 7. 收尾

- [x] 7.1 更新根目錄 `README.md`：加入公開訂房前端啟動說明（port 5920）與新 API 端點列表
- [ ] 7.2 手動測試完整訂房流程：首頁 → 選旅館 → 選日期/房型 → 填資料 → 確認碼 → 查詢 → 取消
- [ ] 7.3 驗證 PMS 後台仍正常（現有 E2E 測試 Suite 01/02 通過）
- [ ] 7.4 驗證公開 API 端點回傳格式正確（curl 或 Swagger `/docs` 測試）
