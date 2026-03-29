## Why

雀客旅館集團（CheckInn）目前網站 https://www.checkinn.com.tw/ 採用第三方訂房平台（Hexa）處理所有預訂，導致訂房資料無法直接進入 PMS，且缺乏品牌一致性的訂房體驗。同時，現有 PMS 已完整建立三層租戶架構與雀客集團的旅館、房型、住房率等資料——這些資料應被公開訂房網站直接使用，而非停留在後台管理系統中。

本次改動目標是以現有 PMS 的 checkinn tenant 資料為基礎，建立全新的公開訂房前端網站，重構 checkinn.com.tw 的使用者體驗，並實現原生訂房引擎（Native Booking Engine）。

## What Changes

- **新增公開 API router**：`/public/*` 路由，無需 JWT 驗證，以 hotel slug 為範圍存取
- **新增訂房確認碼**：Reservation model 加入 `confirmation_code` 欄位（唯一隨機字串）
- **新增 `frontend-public/` 專案**：獨立 Vite 應用，對應 checkinn.com.tw 的頁面結構
- **CORS 更新**：允許公開網站 origin 存取 PMS API

## Capabilities

### New Capabilities

- `public-hotel-discovery`：公開瀏覽旅館列表、品牌分類、地區篩選、旅館詳情
- `public-booking`：無需帳號的訂房流程（客人填寫資料 → 確認 → 取得確認碼）；確認碼查詢；自助取消

### Modified Capabilities

- `reservation-management`：Reservation 加入 `confirmation_code`；新增公開端點讓客人查詢 / 取消訂房
- `room-management`：`/rooms/availability` 開放公開存取（無 JWT，改用 hotel slug）

## Impact

- **後端**：新增 `routers/public.py`；Alembic migration 加 `confirmation_code`；CORS 更新
- **前端**：全新 `frontend-public/` Vite 專案（與 PMS 管理前端完全分離）
- **DB**：只新增欄位，不修改現有業務邏輯，現有 PMS 正常運作不受影響
- **現有資料**：checkinn tenant 的旅館 / 房型資料直接被新網站使用，無需另行匯入
