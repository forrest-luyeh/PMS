"""
checkinn_users_seed.py
為雀客旅館集團建立操作帳號：
  - 3 個 BRAND_ADMIN（每品牌各一）
  - 各品牌代表旅館的 FRONT_DESK / HOUSEKEEPING / MANAGER 帳號

代表旅館（每品牌取一間）：
  - 藏居 SELECT  → 台北陽明山溫泉館 (slug=yangmingshan)
  - 旅館 HOTEL   → 台北松江館       (slug=songjiang)
  - 快捷 EXPRESS → 台北車站館       (slug=taipei-station)

Idempotent：重複執行不會新增重複帳號。
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal
from models.user import User, UserRole
from models.tenant import Tenant, Brand, Hotel
from passlib.context import CryptContext

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── 帳號定義 ──────────────────────────────────────────────────────────────────
# (email, password, name, role, brand_slug, hotel_slug_or_None)
ACCOUNTS = [
    # ── Brand Admins ──────────────────────────────────────────────────────
    ("brand-select@checkinn.com.tw",  "Select1234!",  "藏居品牌管理員",  UserRole.BRAND_ADMIN,  "select",  None),
    ("brand-hotel@checkinn.com.tw",   "Hotel1234!",   "旅館品牌管理員",  UserRole.BRAND_ADMIN,  "hotel",   None),
    ("brand-express@checkinn.com.tw", "Express1234!", "快捷品牌管理員",  UserRole.BRAND_ADMIN,  "express", None),

    # ── 藏居 SELECT：台北陽明山溫泉館 ────────────────────────────────────
    ("front-yangmingshan@checkinn.com.tw", "Front1234!", "陽明山前台",  UserRole.FRONT_DESK,   "select", "yangmingshan"),
    ("hk-yangmingshan@checkinn.com.tw",    "Hk1234!",    "陽明山房務",  UserRole.HOUSEKEEPING, "select", "yangmingshan"),
    ("mgr-yangmingshan@checkinn.com.tw",   "Mgr1234!",   "陽明山主管",  UserRole.MANAGER,      "select", "yangmingshan"),

    # ── 旅館 HOTEL：台北松江館 ────────────────────────────────────────────
    ("front-songjiang@checkinn.com.tw",    "Front1234!", "松江前台",    UserRole.FRONT_DESK,   "hotel",  "songjiang"),
    ("hk-songjiang@checkinn.com.tw",       "Hk1234!",    "松江房務",    UserRole.HOUSEKEEPING, "hotel",  "songjiang"),
    ("mgr-songjiang@checkinn.com.tw",      "Mgr1234!",   "松江主管",    UserRole.MANAGER,      "hotel",  "songjiang"),

    # ── 快捷 EXPRESS：台北車站館 ─────────────────────────────────────────
    ("front-taipei-station@checkinn.com.tw", "Front1234!", "車站前台",  UserRole.FRONT_DESK,   "express", "taipei-station"),
    ("hk-taipei-station@checkinn.com.tw",    "Hk1234!",    "車站房務",  UserRole.HOUSEKEEPING, "express", "taipei-station"),
    ("mgr-taipei-station@checkinn.com.tw",   "Mgr1234!",   "車站主管",  UserRole.MANAGER,      "express", "taipei-station"),
]


def run():
    db = SessionLocal()
    try:
        tenant = db.query(Tenant).filter_by(slug="checkinn").first()
        if not tenant:
            print("❌ 找不到雀客旅館集團（checkinn）Tenant，請先執行 checkinn_seed.py")
            sys.exit(1)

        created = 0
        for email, password, name, role, brand_slug, hotel_slug in ACCOUNTS:
            if db.query(User).filter_by(email=email).first():
                print(f"  skip  {email}")
                continue

            brand = db.query(Brand).filter_by(slug=brand_slug, tenant_id=tenant.id).first()
            if not brand:
                print(f"  ⚠️  找不到品牌 slug={brand_slug}，跳過 {email}")
                continue

            hotel_id = None
            if hotel_slug:
                hotel = db.query(Hotel).filter_by(slug=hotel_slug, tenant_id=tenant.id).first()
                if not hotel:
                    print(f"  ⚠️  找不到旅館 slug={hotel_slug}，跳過 {email}")
                    continue
                hotel_id = hotel.id

            db.add(User(
                email=email,
                hashed_password=pwd.hash(password),
                name=name,
                role=role,
                hotel_id=hotel_id,
                brand_id=brand.id,
                tenant_id=tenant.id,
                is_active=True,
            ))
            print(f"  create {email}  ({role.value})")
            created += 1

        db.commit()
        print(f"\n完成！新增 {created} 個帳號。")

    except Exception as e:
        db.rollback()
        print(f"失敗：{e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    run()
