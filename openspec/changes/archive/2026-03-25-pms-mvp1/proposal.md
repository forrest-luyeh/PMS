## Why

連鎖旅館業目前缺乏統一的前台作業系統，訂房、入住、退房、帳單等流程分散在試算表或老舊系統中，導致超訂風險高、帳務錯誤頻繁、跨班交接困難。MVP1 建立單一旅館的完整前台作業核心，讓前台、房務、主管能在同一平台完成日常作業。

## What Changes

- 新增用戶認證系統，支援四種角色（Admin / Front Desk / Housekeeping / Manager）
- 新增房型與房間管理（房型定價、實體房間、即時房態看板）
- 新增客人檔案管理（Guest Profile）
- 新增訂房管理（Reservation）：建立、修改、取消、No-show
- 新增前台作業：Check-in（指定房間、建立帳單）、Check-out（結帳、房間轉髒）
- 新增帳務模組（Folio）：住房費、附加消費、折扣、收款、列印帳單
- 新增房態管理：前台/房務即時更新房間狀態
- 新增 Manager 報表：當日營收、入住率、訂房來源統計

## Capabilities

### New Capabilities

- `user-auth`: 用戶登入、JWT 認證、四角色 RBAC（Admin/Front Desk/Housekeeping/Manager）
- `room-management`: 房型 CRUD、房間 CRUD、即時房態看板（Available/Reserved/Occupied/Dirty/Out of Order）
- `guest-management`: 客人檔案 CRUD（姓名、證件、聯絡方式、入住歷史）
- `reservation-management`: 訂房建立/修改/取消/No-show，支援多房型查詢可用房
- `checkin-checkout`: Check-in 指定房間並開立 Folio；Check-out 結帳並更新房態
- `folio-management`: 帳單明細（住房費自動記帳、附加費、折扣、收款）、帳單列印
- `housekeeping`: 房務看板（髒房列表）、更新清潔狀態（Dirty → Clean → Available）
- `dashboard`: Manager 儀表板（今日入住/退房數、入住率、應收金額、房態總覽）

### Modified Capabilities

（無現有功能，此為全新系統）

## Impact

- 全新專案，無既有程式碼相依性
- 後端：Python + FastAPI + SQLite（MVP）
- 前端：React + Vite + TailwindCSS
- 認證：JWT（Access Token + Refresh Token）
- 部署：本機開發優先，架構支援未來多分館擴展
