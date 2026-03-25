## ADDED Requirements

### Requirement: Create Reservation
系統 SHALL 允許前台建立訂房。

#### Scenario: Successful reservation
- **WHEN** 前台提交客人 ID、房型、入住日、退房日、人數、來源、每晚房價
- **THEN** 系統建立 Reservation（狀態 CONFIRMED），回傳 201

#### Scenario: Invalid date range
- **WHEN** 退房日 <= 入住日
- **THEN** 系統回傳 400 Bad Request

---

### Requirement: Check Room Type Availability
系統 SHALL 在訂房前查詢指定日期的可用房間數。

#### Scenario: Query availability
- **WHEN** 請求 GET /api/v1/rooms/availability?room_type_id=1&check_in=2025-06-01&check_out=2025-06-03
- **THEN** 系統回傳該房型在指定日期區間的可用房數（扣除已 CONFIRMED 或 CHECKED_IN 的訂單）

---

### Requirement: Modify Reservation
系統 SHALL 允許前台修改尚未 Check-in 的訂房（日期、人數、備註）。

#### Scenario: Modify confirmed reservation
- **WHEN** 前台修改 CONFIRMED 狀態的訂房
- **THEN** 系統更新並回傳最新資料

#### Scenario: Cannot modify checked-in reservation
- **WHEN** 嘗試修改 CHECKED_IN 狀態的訂房
- **THEN** 系統回傳 400 Bad Request

---

### Requirement: Cancel Reservation
系統 SHALL 允許前台取消 CONFIRMED 狀態的訂房。

#### Scenario: Successful cancellation
- **WHEN** 前台取消 CONFIRMED 訂房
- **THEN** 系統將狀態改為 CANCELLED，若已指定房間則釋放房間（RESERVED → AVAILABLE）

---

### Requirement: No-show
系統 SHALL 允許前台將未到店的訂房標記為 NO_SHOW。

#### Scenario: Mark no-show
- **WHEN** 前台將 CONFIRMED 訂房標為 NO_SHOW
- **THEN** 系統更新狀態並釋放已指定房間

---

### Requirement: List Reservations
系統 SHALL 提供訂房列表，支援依日期、狀態、客人姓名篩選。

#### Scenario: Today's arrivals
- **WHEN** 請求 GET /api/v1/reservations?check_in_date=today&status=CONFIRMED
- **THEN** 系統回傳今日預計入住且狀態為 CONFIRMED 的訂單列表
