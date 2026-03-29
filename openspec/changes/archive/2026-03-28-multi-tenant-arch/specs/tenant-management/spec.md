## ADDED Requirements

### Requirement: Hotel Registration
系統 SHALL 提供公開端點讓新旅館自助完成註冊，同時建立旅館記錄與第一個管理員帳號。

#### Scenario: Successful hotel registration
- **WHEN** 使用者提交旅館名稱、slug、聯絡信箱、管理員姓名、管理員密碼
- **THEN** 系統建立 Hotel 記錄與 ADMIN 用戶（hotel_id 綁定），回傳 Access Token 直接登入

#### Scenario: Duplicate slug
- **WHEN** 提交的 slug 已被其他旅館使用
- **THEN** 系統回傳 409 Conflict，錯誤訊息指出 slug 衝突

#### Scenario: Missing required fields
- **WHEN** 必填欄位（旅館名稱、slug、管理員帳密）缺少任一
- **THEN** 系統回傳 422 Validation Error

---

### Requirement: Super Admin Hotel Management
系統 SHALL 允許 SUPER_ADMIN 查看、建立、停用所有旅館。

#### Scenario: List all hotels
- **WHEN** SUPER_ADMIN 呼叫 GET /admin/hotels
- **THEN** 系統回傳所有旅館列表（含 is_active 狀態、建立日期、用戶數）

#### Scenario: Deactivate hotel
- **WHEN** SUPER_ADMIN 將某旅館 is_active 設為 false
- **THEN** 該旅館所有用戶登入時收到 403（Hotel is inactive），現有 session 失效

#### Scenario: Non-super-admin access
- **WHEN** 非 SUPER_ADMIN 角色存取 /admin/* 端點
- **THEN** 系統回傳 403 Forbidden

---

### Requirement: Hotel Settings
系統 SHALL 允許旅館 ADMIN 查看與更新自己旅館的設定資訊。

#### Scenario: Update hotel info
- **WHEN** 旅館 ADMIN 提交更新（旅館名稱、聯絡信箱）
- **THEN** 系統更新 Hotel 記錄並回傳最新資料

#### Scenario: Cannot change slug
- **WHEN** 旅館 ADMIN 嘗試修改 slug
- **THEN** 系統忽略 slug 欄位（slug 一旦建立不可變更）
