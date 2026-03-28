## MODIFIED Requirements

### Requirement: Folio Isolation
系統 SHALL 確保帳單資料的查詢與操作限定於當前旅館範圍。

#### Scenario: Folio bound to hotel
- **WHEN** Check-in 時系統建立 Folio
- **THEN** Folio 自動綁定當前旅館的 hotel_id

#### Scenario: Access folio from other hotel
- **WHEN** 用戶嘗試存取屬於其他旅館的 Folio
- **THEN** 系統回傳 404 Not Found
