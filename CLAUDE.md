# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (port 8910)
```bash
cd backend
venv\Scripts\activate          # Windows
uvicorn main:app --host 0.0.0.0 --port 8910 --reload
```

```bash
# Database migrations
alembic revision --autogenerate -m "description"
alembic upgrade head
alembic downgrade -1

# Seed scripts
python seed.py           # Default tenant/brand/hotel + 5 users + rooms
python checkinn_seed.py  # CheckInn chain: 3 brands, 29 hotels, 69 room types, ~688 rooms
```

API docs: http://localhost:8910/docs

### Frontend (port 5910)
```bash
cd frontend
npm run dev   # Vite proxies /api → http://localhost:8910
```

### E2E Tests
```bash
cd frontend
npx playwright test
npx playwright test e2e/01-main-flow.spec.js  # single suite
```

## Architecture

### Multi-Tenant Hierarchy
```
Tenant (集團)
  └── Brand (品牌)
        └── Hotel (旅館)
              ├── RoomType → Room
              ├── Reservation → Folio
              └── Guest
```

All business data is isolated by `hotel_id`. Every API endpoint that handles operational data depends on `get_hotel_context()` (in `backend/core/deps.py`) which reads `hotel_id` from the JWT claims. SUPER_ADMIN can override with `X-Hotel-Id` header.

### Authentication & JWT Claims

Access tokens (15 min) carry: `sub` (user_id), `role`, `hotel_id`, `brand_id`, `tenant_id`.
Refresh tokens (7 days) are httpOnly cookies, tracked in a blacklist table for logout.

**Hotel context switching** — TENANT_ADMIN and BRAND_ADMIN start without a `hotel_id` in their token. They call `POST /api/v1/admin/switch-hotel?hotel_id=X` to receive a new token scoped to that hotel. The frontend (`AuthContext.switchHotel`) stores this token and sets the `X-Hotel-Id` header on all subsequent requests via the Axios interceptor in `frontend/src/lib/api.js`.

### Role Hierarchy
| Role | Scope |
|------|-------|
| SUPER_ADMIN | All tenants (via X-Hotel-Id header) |
| TENANT_ADMIN | Own tenant's brands/hotels |
| BRAND_ADMIN | Own brand's hotels |
| ADMIN | Single hotel, full ops |
| FRONT_DESK | Single hotel, reservations |
| HOUSEKEEPING | Single hotel, room status |
| MANAGER | Single hotel, read-all |

### Backend Structure

- `main.py` — FastAPI app, CORS (`localhost:5910`), router mounts (all prefixed `/api/v1`)
- `core/deps.py` — All dependency injection: `get_db`, `get_current_user`, `require_role(*roles)`, `get_hotel_context`, `get_tenant_context`
- `core/security.py` — `hash_password`, `verify_password`, `create_access_token(sub, role, hotel_id, brand_id, tenant_id)`
- `database.py` — SQLite engine (`hotel.db`), SQLAlchemy `SessionLocal`, `Base`
- `routers/admin.py` — Tenant/Brand/Hotel CRUD, self-registration (`POST /register`), hotel switching, aggregate dashboard (`GET /admin/aggregate-dashboard?brand_id=X`)
- `routers/dashboard.py` — Single-hotel today stats, room status, arrivals/departures (all require `get_hotel_context`)

### Frontend Structure

- `src/lib/api.js` — Axios instance: auto-injects `Authorization` + `X-Hotel-Id` headers, handles 401→refresh→retry
- `src/contexts/AuthContext.jsx` — `user`, `hotelCtx {hotel_id, brand_id, tenant_id}`, `login`, `logout`, `switchHotel`
- `src/App.jsx` — All route definitions with role-based `PrivateRoute` wrappers
- `src/components/Layout.jsx` — Sidebar nav + `HotelContextBar` (shows current brand/hotel for TENANT_ADMIN/BRAND_ADMIN)
- `src/pages/Dashboard.jsx` — Three-tier view: 全部 (aggregate), 品牌 (brand aggregate), 旅館 (single hotel ops); uses `GET /admin/aggregate-dashboard` for first two levels

### SQLite Constraints Note

SQLite does not support `DROP CONSTRAINT`. When removing unnamed UNIQUE constraints (as occurred on `room_types.name` and `rooms.number`), use table-recreation in migrations: `CREATE TABLE new_X ... → INSERT ... → DROP TABLE X → ALTER TABLE new_X RENAME TO X`. See existing migrations `333bab161081` and `f297d82f9384` for the pattern.

## Default Accounts

| Role | Email | Password |
|------|-------|----------|
| SUPER_ADMIN | super@example.com | super1234 |
| TENANT_ADMIN (default) | admin@example.com | admin1234 |
| TENANT_ADMIN (CheckInn) | admin@checkinn.com.tw | Admin1234! |
| FRONT_DESK | front@example.com | front1234 |
| HOUSEKEEPING | hk@example.com | hk1234 |
| MANAGER | manager@example.com | mgr1234 |

## Key Patterns

**Backend — adding a new hotel-scoped endpoint:**
```python
@router.get("/my-resource")
def get_resource(db: Session = Depends(get_db), hotel: Hotel = Depends(get_hotel_context)):
    return db.query(MyModel).filter_by(hotel_id=hotel.id).all()
```

**Backend — require_role allows multiple roles and always permits SUPER_ADMIN:**
```python
current_user = Depends(require_role("TENANT_ADMIN", "BRAND_ADMIN"))
```

**Frontend — data fetching with React Query:**
All pages use TanStack Query (`useQuery`/`useMutation`). Query keys are arrays: `['reservations', filters]`. Cache invalidation uses `qc.invalidateQueries(['key'])`.

**Frontend — hotel management role check:**
```js
const isHotelMgmt = ['TENANT_ADMIN', 'BRAND_ADMIN'].includes(user?.role)
```
