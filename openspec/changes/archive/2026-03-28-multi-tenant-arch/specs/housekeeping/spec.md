## MODIFIED Requirements

### Requirement: Housekeeping Isolation
系統 SHALL 確保房務任務的查詢與操作限定於當前旅館範圍。

#### Scenario: List housekeeping tasks for current hotel
- **WHEN** 房務人員查詢待清房間
- **THEN** 僅回傳 hotel_id 符合當前旅館的房間狀態

#### Scenario: Mark clean for current hotel room
- **WHEN** 房務人員標記房間清潔完成
- **THEN** 系統驗證該房間屬於當前旅館，否則回傳 404
