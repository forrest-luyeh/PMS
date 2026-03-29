## ADDED Requirements

### Requirement: Guest Isolation
系統 SHALL 確保各旅館維護獨立的客人資料庫，旅館間客人資料不互相共用。

#### Scenario: List guests for current hotel
- **WHEN** 用戶查詢客人列表
- **THEN** 僅回傳 hotel_id 符合當前旅館的客人記錄

#### Scenario: Create guest with hotel binding
- **WHEN** 前台建立新客人
- **THEN** Guest 自動綁定當前旅館的 hotel_id

#### Scenario: Same ID number in different hotels
- **WHEN** 兩間旅館的客人具有相同證件號碼
- **THEN** 系統允許此情況（唯一性約束限定在同一 hotel_id 內）

---

### Requirement: Guest Profile CRUD
系統 SHALL 允許前台建立與維護客人檔案。

#### Scenario: Create guest
- **WHEN** 前台提交客人姓名、電話、證件類型與號碼
- **THEN** 系統建立客人檔案，回傳 201

#### Scenario: Duplicate ID number rejected
- **WHEN** 提交已存在的證件號碼（同一旅館內）
- **THEN** 系統回傳 409 Conflict

---

### Requirement: Guest Search
系統 SHALL 支援依姓名、電話或證件號碼快速搜尋客人。

#### Scenario: Search by name
- **WHEN** 請求 GET /api/v1/guests?search=王小明
- **THEN** 系統回傳姓名包含關鍵字的客人列表

---

### Requirement: Guest Stay History
系統 SHALL 在客人詳細頁顯示歷史訂房記錄。

#### Scenario: View stay history
- **WHEN** 請求 GET /api/v1/guests/:id
- **THEN** 系統回傳客人資料及其所有 Reservation（含歷史）
