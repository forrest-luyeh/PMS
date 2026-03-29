## ADDED Requirements

### Requirement: Room and RoomType Isolation
系統 SHALL 確保 Room 與 RoomType 的查詢、建立、修改皆限定於當前旅館範圍。

#### Scenario: List rooms for current hotel
- **WHEN** 用戶查詢房間列表
- **THEN** 僅回傳 hotel_id 符合當前旅館的房間

#### Scenario: Create room type with hotel binding
- **WHEN** 旅館 ADMIN 建立新 RoomType
- **THEN** RoomType 自動綁定當前旅館的 hotel_id

#### Scenario: Create room with hotel binding
- **WHEN** 旅館 ADMIN 建立新 Room
- **THEN** Room 自動綁定當前旅館的 hotel_id

#### Scenario: Access room from other hotel
- **WHEN** 用戶嘗試存取屬於其他旅館的 Room
- **THEN** 系統回傳 404 Not Found

---

### Requirement: Room Type CRUD
系統 SHALL 允許 Admin 管理房型（名稱、說明、基本房價、最大入住人數）。

#### Scenario: Create room type
- **WHEN** Admin 提交房型名稱、基本房價、最大人數
- **THEN** 系統建立房型，回傳 201

#### Scenario: List room types
- **WHEN** 任何已認證用戶請求房型列表
- **THEN** 系統回傳所有房型

---

### Requirement: Room CRUD
系統 SHALL 允許 Admin 管理實體房間（房號、樓層、房型）。

#### Scenario: Create room
- **WHEN** Admin 提交房號、樓層、房型 ID
- **THEN** 系統建立房間，預設狀態為 AVAILABLE，回傳 201

#### Scenario: Duplicate room number rejected
- **WHEN** 提交已存在的房號
- **THEN** 系統回傳 409 Conflict

---

### Requirement: Room Status Board
系統 SHALL 提供即時房態看板，顯示每間房間的目前狀態。

#### Scenario: View room status board
- **WHEN** 任何已認證用戶請求 GET /api/v1/rooms
- **THEN** 系統回傳所有房間清單，包含房號、樓層、房型、目前狀態、當前住客（如有）

#### Scenario: Filter by status
- **WHEN** 請求加入 ?status=DIRTY 篩選
- **THEN** 系統只回傳符合狀態的房間

---

### Requirement: Room Status State Machine
系統 SHALL 依照狀態機規則限制房間狀態轉換。

#### Scenario: Valid transition
- **WHEN** 管理員將 OUT_OF_ORDER 房間設為 AVAILABLE
- **THEN** 系統接受並更新狀態

#### Scenario: Invalid transition blocked
- **WHEN** 嘗試將 OCCUPIED 房間直接設為 AVAILABLE（未經 Check-out）
- **THEN** 系統回傳 409 Conflict 並說明需先辦理退房

---

### Requirement: Manual Room Status Update
系統 SHALL 允許前台（Front Desk）與房務（Housekeeping）更新房態，但各自範圍不同。

#### Scenario: Housekeeping updates dirty to available
- **WHEN** Housekeeping 將 DIRTY 房間更新為 AVAILABLE
- **THEN** 系統接受並更新

#### Scenario: Admin sets room out of order
- **WHEN** Admin 將任何房間設為 OUT_OF_ORDER 並附上原因
- **THEN** 系統接受並記錄
