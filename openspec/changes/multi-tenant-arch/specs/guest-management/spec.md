## MODIFIED Requirements

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
