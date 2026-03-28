## MODIFIED Requirements

### Requirement: User Login
系統 SHALL 驗證帳密並發行 JWT Access Token 與 Refresh Token，token 中 SHALL 包含 hotel_id claim。

#### Scenario: Successful login
- **WHEN** 用戶提交正確的 email 與密碼
- **THEN** 系統回傳 Access Token（含 hotel_id claim，15 分鐘效期）並以 httpOnly Cookie 設定 Refresh Token（7 天）

#### Scenario: Wrong credentials
- **WHEN** email 或密碼錯誤
- **THEN** 系統回傳 401 Unauthorized

#### Scenario: Login to inactive hotel
- **WHEN** 用戶所屬旅館 is_active = false
- **THEN** 系統回傳 403 Forbidden（Hotel is inactive）

---

## ADDED Requirements

### Requirement: Super Admin Role
系統 SHALL 支援 SUPER_ADMIN 角色，不綁定特定旅館（hotel_id = NULL），可管理所有旅館。

#### Scenario: Super admin login
- **WHEN** SUPER_ADMIN 登入
- **THEN** Access Token 中 hotel_id claim 為 null，role 為 SUPER_ADMIN

#### Scenario: Super admin accessing admin endpoints
- **WHEN** SUPER_ADMIN 呼叫 /admin/* 端點
- **THEN** 系統正常處理請求

#### Scenario: Regular admin blocked from super admin endpoints
- **WHEN** 非 SUPER_ADMIN 呼叫 /admin/* 端點
- **THEN** 系統回傳 403 Forbidden

---

### Requirement: User-Hotel Binding
系統 SHALL 確保每個用戶（SUPER_ADMIN 除外）必須綁定一個旅館。

#### Scenario: Create user with hotel binding
- **WHEN** 旅館 ADMIN 建立新用戶
- **THEN** 新用戶自動繼承 ADMIN 所屬的 hotel_id

#### Scenario: User cannot access other hotel
- **WHEN** 用戶嘗試以自己的 token 存取其他旅館的資源
- **THEN** 系統回傳 404 或 403（tenant isolation 機制）
