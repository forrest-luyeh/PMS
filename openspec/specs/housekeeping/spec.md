## ADDED Requirements

### Requirement: Housekeeping Isolation
系統 SHALL 確保房務任務的查詢與操作限定於當前旅館範圍。

#### Scenario: List housekeeping tasks for current hotel
- **WHEN** 房務人員查詢待清房間
- **THEN** 僅回傳 hotel_id 符合當前旅館的房間狀態

#### Scenario: Mark clean for current hotel room
- **WHEN** 房務人員標記房間清潔完成
- **THEN** 系統驗證該房間屬於當前旅館，否則回傳 404

---

### Requirement: Housekeeping Board
系統 SHALL 提供房務看板，顯示所有需清潔的房間。

#### Scenario: View dirty rooms
- **WHEN** Housekeeping 或前台請求 GET /api/v1/housekeeping/board
- **THEN** 系統回傳所有 DIRTY 狀態的房間，依樓層排序

---

### Requirement: Update Room Cleaning Status
系統 SHALL 允許 Housekeeping 更新房間清潔狀態。

#### Scenario: Mark room as clean
- **WHEN** Housekeeping 將 DIRTY 房間更新為 AVAILABLE
- **THEN** 系統更新房態，記錄完成時間與操作人員

#### Scenario: Non-housekeeping role blocked
- **WHEN** 角色非 HOUSEKEEPING 或 ADMIN 的用戶嘗試更新房務狀態
- **THEN** 系統回傳 403 Forbidden

---

### Requirement: Room Inspection Note
系統 SHALL 允許 Housekeeping 在清潔完成時附加備註（如損壞報告）。

#### Scenario: Add inspection note
- **WHEN** Housekeeping 提交清潔完成 + 備註
- **THEN** 系統儲存備註並可於房間詳細頁查看
