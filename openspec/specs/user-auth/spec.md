## ADDED Requirements

### Requirement: User Login
系統 SHALL 驗證帳密並發行 JWT Access Token 與 Refresh Token。

#### Scenario: Successful login
- **WHEN** 用戶提交正確的 email 與密碼
- **THEN** 系統回傳 Access Token（15 分鐘效期）並以 httpOnly Cookie 設定 Refresh Token（7 天）

#### Scenario: Wrong credentials
- **WHEN** email 或密碼錯誤
- **THEN** 系統回傳 401 Unauthorized

---

### Requirement: Token Refresh
系統 SHALL 允許以有效 Refresh Token 取得新 Access Token 並輪換 Refresh Token。

#### Scenario: Valid refresh
- **WHEN** 請求攜帶有效且未列入黑名單的 Refresh Token
- **THEN** 系統發行新 Access Token 並輪換 Refresh Token

#### Scenario: Revoked token
- **WHEN** Refresh Token 已列入黑名單
- **THEN** 系統回傳 401

---

### Requirement: Logout
系統 SHALL 將 Refresh Token 列入黑名單並清除 Cookie。

#### Scenario: Successful logout
- **WHEN** 用戶發送登出請求
- **THEN** 系統將 Refresh Token 加入黑名單，清除 Cookie，回傳 200

---

### Requirement: Role-based Access Control
系統 SHALL 依角色限制 API 存取（Admin / Front Desk / Housekeeping / Manager）。

#### Scenario: Unauthorized role blocked
- **WHEN** 角色不足的用戶存取受保護端點
- **THEN** 系統回傳 403 Forbidden

#### Scenario: Unauthenticated request
- **WHEN** 請求未攜帶有效 Access Token
- **THEN** 系統回傳 401 Unauthorized

---

### Requirement: User Management
系統 SHALL 允許 Admin 建立、編輯、停用員工帳號。

#### Scenario: Create user
- **WHEN** Admin 提交 email、姓名、密碼、角色
- **THEN** 系統建立帳號，回傳 201

#### Scenario: Duplicate email rejected
- **WHEN** 提交已存在的 email
- **THEN** 系統回傳 409 Conflict
