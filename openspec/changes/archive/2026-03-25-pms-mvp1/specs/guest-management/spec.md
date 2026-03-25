## ADDED Requirements

### Requirement: Guest Profile CRUD
系統 SHALL 允許前台建立與維護客人檔案。

#### Scenario: Create guest
- **WHEN** 前台提交客人姓名、電話、證件類型與號碼
- **THEN** 系統建立客人檔案，回傳 201

#### Scenario: Duplicate ID number rejected
- **WHEN** 提交已存在的證件號碼
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
