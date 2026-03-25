## ADDED Requirements

### Requirement: Check-in
系統 SHALL 辦理入住：指定房間、建立 Folio、更新狀態。

#### Scenario: Successful check-in
- **WHEN** 前台指定一間 AVAILABLE 房間並執行 Check-in
- **THEN** 系統：
  1. 將 Reservation 狀態改為 CHECKED_IN
  2. 將 Room 狀態改為 OCCUPIED
  3. 建立 Folio（OPEN）
  4. 依住宿夜數自動建立對應筆數的 ROOM_CHARGE FolioItem
  5. 回傳 Folio ID

#### Scenario: Room not available
- **WHEN** 指定的房間狀態不是 AVAILABLE
- **THEN** 系統回傳 409 Conflict 並說明原因

#### Scenario: Room type mismatch
- **WHEN** 指定的房間房型與訂單房型不符
- **THEN** 系統回傳 400 Bad Request（可由前台確認後強制 override）

---

### Requirement: Early Check-in / Walk-in
系統 SHALL 支援非提前預約的 Walk-in 客人直接辦理入住。

#### Scenario: Walk-in check-in
- **WHEN** 前台先建立訂房（來源 WALK_IN）再立即 Check-in
- **THEN** 系統允許同日入住

---

### Requirement: Check-out
系統 SHALL 辦理退房：結清帳單、更新房態。

#### Scenario: Successful check-out
- **WHEN** 前台對 CHECKED_IN 的訂房執行 Check-out，且 Folio balance = 0
- **THEN** 系統：
  1. 將 Reservation 狀態改為 CHECKED_OUT
  2. 將 Room 狀態改為 DIRTY
  3. 將 Folio 狀態改為 CLOSED
  4. 回傳 200

#### Scenario: Outstanding balance blocks check-out
- **WHEN** Folio 尚有未付餘額（balance > 0）
- **THEN** 系統回傳 402 Payment Required 並顯示餘額

#### Scenario: Force check-out with balance
- **WHEN** 前台以 force=true 強制退房
- **THEN** 系統允許，但在 Folio 上記錄欠帳備註
