## ADDED Requirements

### Requirement: Automatic Tenant Filtering
系統 SHALL 在所有業務資料 API 自動套用 hotel_id 過濾，確保旅館間資料完全隔離。

#### Scenario: Query isolation
- **WHEN** 已認證的旅館用戶呼叫任何業務 API（rooms、guests、reservations 等）
- **THEN** 回傳結果 SHALL 僅包含 hotel_id 與當前旅館相符的記錄

#### Scenario: Cross-tenant access attempt
- **WHEN** 用戶嘗試存取屬於其他旅館的資源（如 GET /reservations/999，該 reservation 屬於他旅館）
- **THEN** 系統回傳 404 Not Found（不洩漏記錄存在性）

---

### Requirement: Tenant Context Injection
系統 SHALL 透過 dependency injection 將當前旅館 context 注入所有需要隔離的 API handler。

#### Scenario: Valid hotel context
- **WHEN** 請求攜帶有效 JWT，其中包含 hotel_id claim
- **THEN** API handler 可透過 `get_current_hotel()` dependency 取得 Hotel 物件

#### Scenario: Inactive hotel
- **WHEN** JWT 中的 hotel_id 對應的旅館 is_active = false
- **THEN** 系統回傳 403 Forbidden（Hotel is inactive）

---

### Requirement: Super Admin Bypass
系統 SHALL 允許 SUPER_ADMIN 在指定旅館 context 下操作（查詢任意旅館資料）。

#### Scenario: Super admin with hotel scope
- **WHEN** SUPER_ADMIN 在請求中指定 X-Hotel-Id header
- **THEN** 系統以該 hotel_id 作為 tenant context 執行查詢

#### Scenario: Super admin without hotel scope
- **WHEN** SUPER_ADMIN 未指定 hotel scope 呼叫業務 API
- **THEN** 系統回傳 400（需指定目標旅館）
