# 旅館管理系統 (Hotel PMS)

連鎖旅館業 PMS 平台，支援多集團 / 多品牌 / 多旅館三層租戶架構，以及訂房、Check-in/out、房務、帳務管理。

內建雀客旅館集團（CHECKinn）完整範例資料：3 品牌、29 旅館、69 房型、約 688 間實際房間。

## 快速啟動

### 後端（port 8910）

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt

# 第一次執行：初始化資料庫
alembic upgrade head
python seed.py                # 建立預設集團帳號與範例資料
python checkinn_seed.py       # 匯入雀客旅館集團（可選）
python checkinn_users_seed.py # 建立雀客各館操作帳號（需先執行 checkinn_seed.py）
python demo_tenant_seed.py    # 建立晴天旅宿集團示範資料（可選）

# 若為既有 DB 升級（已有舊資料需補 hotel_id）：
python migrate_to_multitenant.py  # 將舊資料指派至預設旅館

# 啟動
uvicorn main:app --host 0.0.0.0 --port 8910 --reload
```

API 文件：http://localhost:8910/docs

### 前端（port 5910）

```bash
cd frontend
npm install
npm run dev
```

前端：http://localhost:5910（Vite 自動代理 `/api` → `http://localhost:8910`）

---

## 預設帳號

### 系統內建

| 角色 | 電子郵件 | 密碼 |
|------|---------|------|
| 超級管理員 | super@example.com | super1234 |
| 集團管理員（預設） | admin@example.com | admin1234 |
| 前台 | front@example.com | front1234 |
| 房務 | hk@example.com | hk1234 |
| 主管 | manager@example.com | mgr1234 |

### 雀客旅館集團（需執行 `checkinn_seed.py` + `checkinn_users_seed.py`）

| 角色 | 電子郵件 | 密碼 | 範圍 |
|------|---------|------|------|
| 集團管理員 | admin@checkinn.com.tw | Admin1234! | 全集團 |
| 品牌管理員（藏居） | brand-select@checkinn.com.tw | Select1234! | 藏居 SELECT 品牌 |
| 品牌管理員（旅館） | brand-hotel@checkinn.com.tw | Hotel1234! | 旅館 HOTEL 品牌 |
| 品牌管理員（快捷） | brand-express@checkinn.com.tw | Express1234! | 快捷 EXPRESS 品牌 |
| 前台（陽明山） | front-yangmingshan@checkinn.com.tw | Front1234! | 台北陽明山溫泉館 |
| 房務（陽明山） | hk-yangmingshan@checkinn.com.tw | Hk1234! | 台北陽明山溫泉館 |
| 主管（陽明山） | mgr-yangmingshan@checkinn.com.tw | Mgr1234! | 台北陽明山溫泉館 |
| 前台（松江） | front-songjiang@checkinn.com.tw | Front1234! | 台北松江館 |
| 房務（松江） | hk-songjiang@checkinn.com.tw | Hk1234! | 台北松江館 |
| 主管（松江） | mgr-songjiang@checkinn.com.tw | Mgr1234! | 台北松江館 |
| 前台（車站） | front-taipei-station@checkinn.com.tw | Front1234! | 台北車站館 |
| 房務（車站） | hk-taipei-station@checkinn.com.tw | Hk1234! | 台北車站館 |
| 主管（車站） | mgr-taipei-station@checkinn.com.tw | Mgr1234! | 台北車站館 |

### 晴天旅宿集團（需執行 `demo_tenant_seed.py`）

1 品牌・4 旅館（台北東區館、台北西門館、新竹竹北館、台中勤美館）・每館 36 間・每館 5 位範例客人

| 角色 | 電子郵件 | 密碼 | 範圍 |
|------|---------|------|------|
| 集團管理員 | admin@sunnystay.com.tw | Sunny1234! | 全集團 |
| 品牌管理員 | brand@sunnystay.com.tw | Sunny1234! | 晴天精選旅宿品牌 |
| 前台 | front@sunnystay.com.tw | Sunny1234! | 台北東區館 |
| 主管 | manager@sunnystay.com.tw | Sunny1234! | 台北東區館 |

---

## 系統功能

### 旅館日常操作

| 功能 | 路由 | 可存取角色 |
|------|------|-----------|
| 儀表板（三層視角） | / | Admin, Front Desk, Manager, Tenant/Brand Admin |
| 房態看板 | /rooms | 全部角色 |
| 訂房管理 | /reservations | Admin, Front Desk, Manager, Tenant/Brand Admin |
| 客人管理 | /guests | Admin, Front Desk, Manager, Tenant/Brand Admin |
| 房務看板 | /housekeeping | Admin, Housekeeping, Manager |
| 用戶管理 | /users | Admin, Tenant/Brand Admin |

### 多租戶管理

| 功能 | 路由 | 可存取角色 |
|------|------|-----------|
| 集團管理 | /admin/tenants | Super Admin |
| 旅館列表 | /admin/hotels | Super Admin, Tenant/Brand Admin |
| 跨集團儀表板 | /admin/dashboard | Super Admin |
| 管理旗下旅館 | /manage/hotels | Tenant Admin, Brand Admin |
| 品牌管理 | /manage/brands | Tenant Admin |
| 房型／房間設定 | /manage/rooms | Tenant Admin, Brand Admin, Admin |
| 旅館自助註冊 | /register | 公開（無需登入） |

---

## 儀表板三層視角（Tenant/Brand Admin）

儀表板頂部提供品牌和旅館兩個下拉選單，根據選擇呈現不同層次的資料：

| 選擇狀態 | 內容 |
|---------|------|
| 全部品牌，未選旅館 | 集團總覽：各品牌旅館數＋彙總今日抵達/退房/住房率＋全館抵達退房列表 |
| 選定品牌，未選旅館 | 品牌總覽：該品牌旅館卡片＋品牌彙總統計 |
| 選定旅館 | 單館今日營運：抵達/退房/住客/住房率＋房態總覽＋含操作的列表 |

---

## 端對端作業流程

1. **建立客人** → 客人管理 → 新增客人
2. **新增訂房** → 訂房管理 → 新增訂房（選客人、房型、日期）
3. **Check-in** → 訂房管理 → 詳細 → Check-in（選可用房間）
4. **附加消費/收款** → 訂房管理 → 詳細 → 查看帳單
5. **Check-out** → 訂房管理 → 詳細 → Check-out（需結清餘額）
6. **清潔** → 房務看板 → 標記清潔完成

---

## 自動化測試 / Demo

測試檔案位於 `frontend/e2e/`，使用 Playwright。

**前置條件**：後端（port 8910）與前端（port 5910）須同時執行，且已完成 seed 資料匯入（含 `checkinn_seed.py`）。

```bash
cd frontend
npm run test:e2e          # 無頭執行（全部 suite）
npm run test:e2e:headed   # 有視窗執行（全部 suite）
npm run demo              # Demo 模式（每步間隔 1 秒）
npm run demo:slow         # Demo 模式（每步間隔 2 秒）

# 執行單一 Suite
DEMO_SUITE=01 npm run test:e2e   # 只跑 Suite 01
DEMO_SUITE=02 npm run test:e2e   # 只跑 Suite 02
DEMO_SUITE=03 npm run test:e2e   # 只跑 Suite 03
DEMO_SUITE=04 npm run test:e2e   # 只跑 Suite 04（需雀客集團資料）
```

| Suite | 檔案 | 測試帳號 | 涵蓋流程 |
|-------|------|---------|---------|
| 01 | `01-main-flow.spec.js` | admin@example.com | 登入 → 新增訂房 → Check-in → Check-out → 房態看板 |
| 02 | `02-full-flow.spec.js` | admin@example.com | 新增客人 → 訂房 → Check-in → 附加消費 → 收款 → Check-out → 房務 → 用戶管理 |
| 03 | `03-registration-flow.spec.js` | 新帳號（自助註冊） | 旅館自助註冊 → 以新帳號登入 |
| 04 | `04-dashboard-views.spec.js` | admin@checkinn.com.tw | 多品牌集團總覽 → 單品牌總覽 → 單館今日儀表板 → 切換驗證 → Context Bar |

---

## 技術架構

- **後端**：FastAPI + SQLAlchemy + SQLite (`hotel.db`) + Alembic
- **認證**：JWT（Access Token 15min + Refresh Token 7d httpOnly Cookie）
- **前端**：React + Vite + TailwindCSS + TanStack Query + React Router
- **Multi-Tenant**：Tenant → Brand → Hotel 三層架構，`hotel_id` 隔離所有業務資料
- **RBAC**：SUPER_ADMIN / TENANT_ADMIN / BRAND_ADMIN / ADMIN / FRONT_DESK / HOUSEKEEPING / MANAGER

---

## Multi-Tenant 架構

```
Tenant（集團）
  └── Brand（品牌）
        └── Hotel（旅館）
              ├── RoomType / Room（房型 / 房間）
              ├── Guest（客人）
              ├── Reservation（訂房）
              └── Folio（帳單）
```

所有業務 API 依 `hotel_id` 過濾；跨旅館存取回傳 404。

每個 JWT 攜帶 `hotel_id`, `brand_id`, `tenant_id`，後端 `get_hotel_context()` dependency 自動驗證。

### Tenant/Brand Admin 切換旅館

TENANT_ADMIN 和 BRAND_ADMIN 登入後先在儀表板下拉選取旅館（自動呼叫 `POST /api/v1/admin/switch-hotel`），取得含 `hotel_id` 的新 token，之後的所有操作均限定於該旅館。

選定旅館後，所有頁面（房態看板、訂房管理、房務看板等）頂部均會顯示目前的品牌與旅館名稱。

### Super Admin

Super Admin 可透過 `X-Hotel-Id` header 存取任意旅館：

```bash
curl -H "Authorization: Bearer <super_token>" \
     -H "X-Hotel-Id: 2" \
     http://localhost:8910/api/v1/rooms
```
