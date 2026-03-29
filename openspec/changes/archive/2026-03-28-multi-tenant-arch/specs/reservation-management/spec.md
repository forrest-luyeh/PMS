## MODIFIED Requirements

### Requirement: Reservation Isolation
系統 SHALL 確保訂房資料的查詢、建立、狀態變更皆限定於當前旅館範圍。

#### Scenario: List reservations for current hotel
- **WHEN** 用戶查詢訂房列表
- **THEN** 僅回傳 hotel_id 符合當前旅館的訂房記錄

#### Scenario: Create reservation with hotel binding
- **WHEN** 前台建立新訂房
- **THEN** Reservation 自動綁定當前旅館的 hotel_id

#### Scenario: Access reservation from other hotel
- **WHEN** 用戶嘗試存取屬於其他旅館的 Reservation
- **THEN** 系統回傳 404 Not Found
