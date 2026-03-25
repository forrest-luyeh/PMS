# 旅館管理系統 (Hotel PMS) - MVP1

連鎖旅館業 PMS，支援訂房、Check-in/out、房務、帳務管理。

## 快速啟動

### 後端

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt

# 第一次執行：初始化資料庫
alembic upgrade head
python seed.py                 # 建立初始帳號與範例資料

# 啟動
uvicorn main:app --reload --port 8007
```

API 文件：http://localhost:8007/docs

### 前端

```bash
cd frontend
npm install
npm run dev
```

前端：http://localhost:5177

---

## 預設帳號

| 角色     | 電子郵件                   | 密碼       |
|--------|--------------------------|----------|
| 管理員    | admin@example.com        | admin1234 |
| 前台     | front@example.com        | front1234 |
| 房務     | hk@example.com           | hk1234    |
| 主管     | manager@example.com      | mgr1234   |

---

## 系統功能

| 功能         | 路由              | 可存取角色                    |
|------------|-----------------|--------------------------|
| 儀表板        | /               | Admin, Front Desk, Manager |
| 房態看板       | /rooms          | 全部角色                     |
| 訂房管理       | /reservations   | Admin, Front Desk, Manager |
| 客人管理       | /guests         | Admin, Front Desk, Manager |
| 房務看板       | /housekeeping   | Admin, Housekeeping, Manager |
| 用戶管理       | /users          | Admin only               |

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

### 一般執行

```bash
cd frontend

npm run test:e2e          # 無頭執行（背景）
npm run test:e2e:headed   # 有視窗執行
```

### Demo 模式（有視窗 + 動作放慢）

```bash
cd frontend

npm run demo              # 全部流程，每步間隔 1 秒
npm run demo:slow         # 全部流程，每步間隔 2 秒
npm run demo:01           # 只跑主流程（Suite 01），間隔 1 秒
npm run demo:02           # 只跑完整流程（Suite 02），間隔 1 秒
```

### 自訂 delay（Windows 通用）

有兩個獨立參數可以組合使用：

| 參數 | 說明 | 建議值 |
|------|------|-------|
| `DEMO_DELAY` | 每個瀏覽器動作（點擊、輸入）之間的間隔 | `500`~`1500` ms |
| `DEMO_STEP_DELAY` | 每個邏輯步驟之間的停頓（填完表單後、確認前等） | `1000`~`2000` ms |

```bash
cd frontend

# 自訂兩個 delay（動作間 1 秒、步驟間 1.5 秒）
npx cross-env DEMO_DELAY=1000 DEMO_STEP_DELAY=1500 playwright test --workers=1

# 指定 suite + 自訂 delay
npx cross-env DEMO_DELAY=800 DEMO_STEP_DELAY=1200 DEMO_SUITE=01 playwright test --workers=1
npx cross-env DEMO_DELAY=800 DEMO_STEP_DELAY=1200 DEMO_SUITE=02 playwright test --workers=1
```

### 測試涵蓋範圍

| Suite | 檔案 | 涵蓋流程 |
|-------|------|--------|
| 01 | `01-main-flow.spec.js` | 登入 → 新增訂房 → Check-in → Check-out → 房態看板 |
| 02 | `02-full-flow.spec.js` | 新增客人 → 訂房 → Check-in → 附加消費 → 收款 → Check-out → 房務清潔 → 用戶管理 |

---

## 技術架構

- **後端**：FastAPI + SQLAlchemy + SQLite (hotel.db) + Alembic
- **認證**：JWT (Access Token 15min + Refresh Token 7d httpOnly Cookie)
- **前端**：React 18 + Vite + TailwindCSS + React Query + React Router
- **RBAC**：ADMIN / FRONT_DESK / HOUSEKEEPING / MANAGER
