## MODIFIED Requirements

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
