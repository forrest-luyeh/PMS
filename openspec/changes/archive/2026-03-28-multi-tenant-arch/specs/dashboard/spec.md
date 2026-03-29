## MODIFIED Requirements

### Requirement: Dashboard Isolation
系統 SHALL 確保儀表板所有統計數據限定於當前旅館範圍。

#### Scenario: Dashboard shows current hotel data only
- **WHEN** 用戶查看儀表板
- **THEN** 今日抵達、退房、住房率等數據僅統計當前旅館的記錄

## ADDED Requirements

### Requirement: Super Admin Cross-Hotel Dashboard
系統 SHALL 為 SUPER_ADMIN 提供跨旅館彙總視圖。

#### Scenario: Super admin views all hotels summary
- **WHEN** SUPER_ADMIN 查看 /admin/dashboard
- **THEN** 系統回傳所有活躍旅館的總住客數、總訂房數等彙總數據

#### Scenario: Super admin drills into specific hotel
- **WHEN** SUPER_ADMIN 選擇特定旅館查看儀表板
- **THEN** 系統以該旅館 context 顯示標準儀表板數據
