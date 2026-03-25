## ADDED Requirements

### Requirement: Today's Operations Summary
系統 SHALL 提供今日作業摘要給 Manager 與前台。

#### Scenario: Get today stats
- **WHEN** 請求 GET /api/v1/dashboard/today
- **THEN** 系統回傳：
  - `expected_arrivals`：今日預計入住筆數（CONFIRMED）
  - `expected_departures`：今日預計退房筆數（CHECKED_IN 且 check_out_date = today）
  - `actual_checkins`：今日已完成入住數
  - `actual_checkouts`：今日已完成退房數
  - `occupied_rooms`：目前 OCCUPIED 房間數
  - `available_rooms`：目前 AVAILABLE 房間數
  - `occupancy_rate`：入住率（%）
  - `today_revenue`：今日已收款金額

---

### Requirement: Room Status Overview
系統 SHALL 提供各狀態房間數量的即時統計。

#### Scenario: Room status summary
- **WHEN** 請求 GET /api/v1/dashboard/room-status
- **THEN** 系統回傳每種狀態（AVAILABLE, RESERVED, OCCUPIED, DIRTY, OUT_OF_ORDER）的房間數

---

### Requirement: Arrivals & Departures List
系統 SHALL 提供今日抵達與離開的訂單列表。

#### Scenario: Today arrivals
- **WHEN** 請求 GET /api/v1/dashboard/arrivals
- **THEN** 系統回傳今日 check_in_date 的 CONFIRMED 訂單，含客人姓名、房型、備註

#### Scenario: Today departures
- **WHEN** 請求 GET /api/v1/dashboard/departures
- **THEN** 系統回傳今日 check_out_date 的 CHECKED_IN 訂單，含房號、客人姓名、Folio 餘額
