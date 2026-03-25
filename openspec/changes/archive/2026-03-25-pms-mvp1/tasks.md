## 1. 專案初始化

- [x] 1.1 清除舊程式碼（後端 models/routers/schemas）、保留專案骨架與虛擬環境
- [x] 1.2 確認 requirements.txt 依賴完整（fastapi, sqlalchemy, alembic, python-jose, passlib, etc.）
- [x] 1.3 確認前端依賴完整（react-query, axios, react-router-dom, tailwindcss, react-hook-form）

## 2. 資料庫 Schema

- [x] 2.1 定義 `User` model（id, email, hashed_password, role, name, is_active）
- [x] 2.2 定義 `RefreshTokenBlacklist` model（id, token, expires_at）
- [x] 2.3 定義 `RoomType` model（id, name, description, base_rate, max_occupancy）
- [x] 2.4 定義 `Room` model（id, number, floor, room_type_id, status, notes）
- [x] 2.5 定義 `Guest` model（id, name, id_type, id_number, phone, email, nationality, created_at）
- [x] 2.6 定義 `Reservation` model（id, guest_id, room_type_id, room_id, check_in_date, check_out_date, adults, children, rate_per_night, status, source, notes, created_at）
- [x] 2.7 定義 `Folio` model（id, reservation_id, status, created_at）
- [x] 2.8 定義 `FolioItem` model（id, folio_id, description, amount, item_type, created_at）
- [x] 2.9 執行 `alembic revision --autogenerate -m "hotel_pms_init"` 與 `alembic upgrade head`
- [x] 2.10 建立 `seed.py`：Admin 帳號、範例房型（Standard/Deluxe/Suite）、範例房間（10 間）

## 3. 後端基礎設施

- [x] 3.1 更新 `main.py`：掛載所有新路由
- [x] 3.2 確認 `core/security.py`（JWT 工具）、`core/deps.py`（get_current_user, require_role）
- [x] 3.3 建立各 capability 的 Pydantic schemas（`schemas/`）
- [x] 3.4 建立 `core/config.py`（Settings with SECRET_KEY, DB URL）

## 4. 認證 API（user-auth）

- [x] 4.1 實作 `POST /api/v1/auth/login`
- [x] 4.2 實作 `POST /api/v1/auth/refresh`
- [x] 4.3 實作 `POST /api/v1/auth/logout`
- [x] 4.4 實作 `GET /api/v1/auth/me`
- [x] 4.5 實作 `GET/POST /api/v1/users`（Admin 用戶管理）
- [x] 4.6 實作 `PUT /api/v1/users/:id`（編輯用戶）

## 5. 房型與房間 API（room-management）

- [x] 5.1 實作 `GET/POST /api/v1/room-types`
- [x] 5.2 實作 `GET/PUT/DELETE /api/v1/room-types/:id`
- [x] 5.3 實作 `GET /api/v1/rooms`（房態看板，支援 ?status= 篩選）
- [x] 5.4 實作 `POST /api/v1/rooms`（Admin 新增房間）
- [x] 5.5 實作 `GET/PUT /api/v1/rooms/:id`
- [x] 5.6 實作 `PATCH /api/v1/rooms/:id/status`（手動更新房態，含狀態機驗證）
- [x] 5.7 實作 `GET /api/v1/rooms/availability`（查詢日期區間可用房數）

## 6. 客人管理 API（guest-management）

- [x] 6.1 實作 `GET /api/v1/guests`（列表 + 搜尋）
- [x] 6.2 實作 `POST /api/v1/guests`
- [x] 6.3 實作 `GET /api/v1/guests/:id`（含歷史訂房）
- [x] 6.4 實作 `PUT /api/v1/guests/:id`

## 7. 訂房管理 API（reservation-management）

- [x] 7.1 實作 `GET /api/v1/reservations`（列表，支援 ?date=, ?status=, ?search= 篩選）
- [x] 7.2 實作 `POST /api/v1/reservations`（建立訂房）
- [x] 7.3 實作 `GET /api/v1/reservations/:id`
- [x] 7.4 實作 `PUT /api/v1/reservations/:id`（修改，僅限 CONFIRMED）
- [x] 7.5 實作 `POST /api/v1/reservations/:id/cancel`
- [x] 7.6 實作 `POST /api/v1/reservations/:id/no-show`

## 8. Check-in / Check-out API（checkin-checkout）

- [x] 8.1 實作 `POST /api/v1/reservations/:id/checkin`（指定 room_id，建立 Folio，自動建 ROOM_CHARGE）
- [x] 8.2 實作 `POST /api/v1/reservations/:id/checkout`（結清驗證，更新房態為 DIRTY）
- [x] 8.3 支援 `checkout` 的 `force=true` 參數（欠帳強制退房）

## 9. 帳務 API（folio-management）

- [x] 9.1 實作 `GET /api/v1/folios/:id`（帳單詳細 + 餘額計算）
- [x] 9.2 實作 `POST /api/v1/folios/:id/items`（新增 FolioItem：EXTRA_CHARGE / DISCOUNT / PAYMENT）
- [x] 9.3 實作 `DELETE /api/v1/folios/:id/items/:item_id`（刪除非 ROOM_CHARGE 項目，僅 OPEN Folio）

## 10. 房務 API（housekeeping）

- [x] 10.1 實作 `GET /api/v1/housekeeping/board`（髒房列表，依樓層排序）
- [x] 10.2 實作 `PATCH /api/v1/housekeeping/rooms/:id`（更新清潔狀態 + 備註，Housekeeping/Admin only）

## 11. 儀表板 API（dashboard）

- [x] 11.1 實作 `GET /api/v1/dashboard/today`（今日作業摘要）
- [x] 11.2 實作 `GET /api/v1/dashboard/room-status`（各狀態房間數）
- [x] 11.3 實作 `GET /api/v1/dashboard/arrivals`（今日預計入住列表）
- [x] 11.4 實作 `GET /api/v1/dashboard/departures`（今日預計退房列表）

## 12. 前端基礎設施

- [x] 12.1 清除舊頁面，保留 Auth Context、axios instance、Layout、PrivateRoute 骨架
- [x] 12.2 更新 Layout 側邊欄導航（儀表板、訂房、房態、客人、帳務、房務、設定）
- [x] 12.3 建立 role-based 路由（Housekeeping 只能看房務板）

## 13. 前端登入與用戶管理

- [x] 13.1 更新登入頁（顯示旅館 PMS 品牌）
- [x] 13.2 建立用戶管理頁（Admin only）

## 14. 前端儀表板

- [x] 14.1 建立 Dashboard 頁（今日統計卡片：預計到/離、目前入住率）
- [x] 14.2 建立今日抵達列表 Widget（快速 Check-in 按鈕）
- [x] 14.3 建立今日退房列表 Widget（快速 Check-out 按鈕）
- [x] 14.4 建立房態總覽圖示（各狀態數量）

## 15. 前端房態看板

- [x] 15.1 建立房態看板頁（Room Status Board）：依樓層分組，色碼顯示狀態
- [x] 15.2 點擊房間開啟側邊 Panel：顯示目前訂單、快速操作（Check-in / Out / 更新狀態）

## 16. 前端訂房管理

- [x] 16.1 建立訂房列表頁（支援日期/狀態篩選）
- [x] 16.2 建立新增訂房 Modal（選房型、客人、日期、人數）
- [x] 16.3 建立訂房詳細 Side Panel（修改、取消、No-show、Check-in 按鈕）
- [x] 16.4 建立 Check-in Modal（選擇可用房間、確認房價）

## 17. 前端客人管理

- [x] 17.1 建立客人列表頁（含搜尋）
- [x] 17.2 建立客人詳細頁（含歷史入住記錄）
- [x] 17.3 建立新增/編輯客人 Modal

## 18. 前端帳務（Folio）

- [x] 18.1 建立帳單詳細頁（FolioItem 列表、餘額顯示）
- [x] 18.2 建立新增附加消費 Modal（EXTRA_CHARGE）
- [x] 18.3 建立收款 Modal（PAYMENT，支援現金/刷卡）
- [x] 18.4 建立折扣 Modal（DISCOUNT）

## 19. 前端房務看板

- [x] 19.1 建立房務看板頁（Housekeeping Board）：髒房列表
- [x] 19.2 實作「標記清潔完成」按鈕（含備註輸入）

## 20. 收尾

- [x] 20.1 更新 `README.md`（旅館 PMS 啟動指南）
- [x] 20.2 更新 seed.py 帳號（admin@example.com / admin1234）
- [x] 20.3 端對端測試：訂房 → Check-in → 加消費 → 收款 → Check-out → 房務清潔
