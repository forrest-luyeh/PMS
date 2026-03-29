## ADDED Requirements

### Requirement: Folio Isolation
系統 SHALL 確保帳單資料的查詢與操作限定於當前旅館範圍。

#### Scenario: Folio bound to hotel
- **WHEN** Check-in 時系統建立 Folio
- **THEN** Folio 自動綁定當前旅館的 hotel_id

#### Scenario: Access folio from other hotel
- **WHEN** 用戶嘗試存取屬於其他旅館的 Folio
- **THEN** 系統回傳 404 Not Found

---

### Requirement: View Folio
系統 SHALL 顯示帳單所有項目與目前餘額。

#### Scenario: Get folio
- **WHEN** 請求 GET /api/v1/folios/:id
- **THEN** 系統回傳 Folio 資訊、所有 FolioItem 列表、總消費金額、已付金額、餘額

---

### Requirement: Add Extra Charge
系統 SHALL 允許前台在 OPEN Folio 新增附加消費。

#### Scenario: Add mini bar charge
- **WHEN** 前台提交描述（如「Mini Bar」）、金額、類型 EXTRA_CHARGE
- **THEN** 系統新增 FolioItem，回傳更新後的 Folio 餘額

#### Scenario: Cannot add to closed folio
- **WHEN** 嘗試對 CLOSED Folio 新增項目
- **THEN** 系統回傳 400 Bad Request

---

### Requirement: Add Discount
系統 SHALL 允許前台（或 Manager）新增折扣項目。

#### Scenario: Add discount
- **WHEN** 提交描述、正數金額、類型 DISCOUNT
- **THEN** 系統新增 FolioItem（金額以負數儲存），減少應付金額

---

### Requirement: Record Payment
系統 SHALL 允許記錄收款（現金、刷卡、轉帳）。

#### Scenario: Full payment
- **WHEN** 前台提交支付金額等於餘額、付款方式
- **THEN** 系統新增 PAYMENT FolioItem，Folio balance 變為 0

#### Scenario: Partial payment
- **WHEN** 前台提交小於餘額的金額
- **THEN** 系統新增 PAYMENT FolioItem，餘額減少但不為 0

---

### Requirement: Folio Balance Calculation
系統 SHALL 即時計算正確餘額。

#### Scenario: Balance formula
- **WHEN** 系統計算餘額
- **THEN** balance = sum(ROOM_CHARGE + EXTRA_CHARGE) - sum(DISCOUNT) - sum(PAYMENT)
