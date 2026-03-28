"""
demo_tenant_seed.py
建立「晴天旅宿集團」示範租戶：
  - 1 個集團（Tenant）
  - 1 個品牌（Brand）：晴天精選旅宿
  - 4 間旅館（Hotel）：台北東區館、台北西門館、新竹竹北館、台中勤美館
  - 4 個帳號：TENANT_ADMIN、BRAND_ADMIN、FRONT_DESK、MANAGER
  - 每館 3 個房型 × 每樓 3 間 × 4 樓 = 36 間
  - 每館 5 位住客範例資料

Idempotent：重複執行不會新增重複資料。
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal
from models.user import User, UserRole
from models.tenant import Tenant, Brand, Hotel
from models.room import RoomType, Room, RoomStatus
from models.guest import Guest
from passlib.context import CryptContext

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── 集團 / 品牌 ───────────────────────────────────────────────────────────────
TENANT = {
    "name": "晴天旅宿集團",
    "slug": "sunnystay",
    "contact_email": "admin@sunnystay.com.tw",
}

BRAND = {
    "name": "晴天精選旅宿 SunnyStay Select",
    "slug": "sunnystay-select",
}

# ── 旅館 ─────────────────────────────────────────────────────────────────────
HOTELS = [
    {"name": "晴天台北東區館", "slug": "sunny-taipei-east",  "address": "台北市大安區忠孝東路四段", "region": "北部",
     "phone": "+886-2-2771-8800", "check_in_time": "15:00", "check_out_time": "11:00"},
    {"name": "晴天台北西門館", "slug": "sunny-taipei-west",  "address": "台北市萬華區成都路",       "region": "北部",
     "phone": "+886-2-2381-5566", "check_in_time": "15:00", "check_out_time": "11:00"},
    {"name": "晴天新竹竹北館", "slug": "sunny-hsinchu",      "address": "新竹縣竹北市縣政二路",     "region": "中部",
     "phone": "+886-3-558-7700",  "check_in_time": "15:00", "check_out_time": "11:00"},
    {"name": "晴天台中勤美館", "slug": "sunny-taichung",     "address": "台中市西區公益路",         "region": "中部",
     "phone": "+886-4-2320-9900", "check_in_time": "15:00", "check_out_time": "11:00"},
]

# ── 房型（每館共用同套定義） ──────────────────────────────────────────────────
ROOM_TYPES = [
    {"name": "晴天標準雙人房", "room_code": "STD", "bed_type": "DOUBLE",
     "has_window": True,  "base_rate": 2400, "max_occupancy": 2,
     "description": "22 坪，落地窗，市景"},
    {"name": "晴天精選雙床房", "room_code": "TWN", "bed_type": "TWIN",
     "has_window": True,  "base_rate": 2800, "max_occupancy": 3,
     "description": "26 坪，雙床，適合三人"},
    {"name": "晴天景觀套房",   "room_code": "STE", "bed_type": "DOUBLE",
     "has_window": True,  "base_rate": 4800, "max_occupancy": 2,
     "description": "42 坪，全景落地窗，獨立客廳"},
]

# 每館 4 樓，每樓每房型 3 間
FLOORS = [2, 3, 4, 5]
ROOMS_PER_RT_PER_FLOOR = 3

# ── 帳號 ─────────────────────────────────────────────────────────────────────
# (email, password, name, role, hotel_slug_or_None)
ACCOUNTS = [
    ("admin@sunnystay.com.tw",   "Sunny1234!", "晴天集團管理員", UserRole.TENANT_ADMIN, None),
    ("brand@sunnystay.com.tw",   "Sunny1234!", "晴天品牌管理員", UserRole.BRAND_ADMIN,  None),
    # 前台和主管指定到第一間旅館（台北東區館）
    ("front@sunnystay.com.tw",   "Sunny1234!", "東區前台小林",   UserRole.FRONT_DESK,   "sunny-taipei-east"),
    ("manager@sunnystay.com.tw", "Sunny1234!", "東區主管陳先生", UserRole.MANAGER,      "sunny-taipei-east"),
]

# ── 每館範例客人 ──────────────────────────────────────────────────────────────
GUESTS_PER_HOTEL = [
    {"name": "王志明", "id_type": "ID_CARD",  "id_number": None,    "phone": "0912-001-{idx:03d}", "email": "wang{idx:03d}@example.com", "nationality": "台灣"},
    {"name": "陳雅婷", "id_type": "ID_CARD",  "id_number": None,    "phone": "0923-002-{idx:03d}", "email": "chen{idx:03d}@example.com", "nationality": "台灣"},
    {"name": "李建宏", "id_type": "ID_CARD",  "id_number": None,    "phone": "0934-003-{idx:03d}", "email": "lee{idx:03d}@example.com",  "nationality": "台灣"},
    {"name": "Kim Minho",  "id_type": "PASSPORT", "id_number": None, "phone": "010-4567-{idx:04d}", "email": "kim{idx:03d}@example.com",  "nationality": "韓國"},
    {"name": "Tanaka Yuki","id_type": "PASSPORT", "id_number": None, "phone": "090-1234-{idx:04d}", "email": "tanaka{idx:03d}@example.com","nationality": "日本"},
]


def get_or_create(db, model, defaults=None, **kwargs):
    obj = db.query(model).filter_by(**kwargs).first()
    if not obj:
        obj = model(**{**kwargs, **(defaults or {})})
        db.add(obj)
        db.flush()
        return obj, True
    return obj, False


def run():
    db = SessionLocal()
    try:
        # ── Tenant ────────────────────────────────────────────────────────────
        tenant, t_created = get_or_create(
            db, Tenant, slug=TENANT["slug"],
            defaults={"name": TENANT["name"], "contact_email": TENANT["contact_email"], "is_active": True},
        )
        print(f"Tenant: {tenant.name} (id={tenant.id}, created={t_created})")

        # ── Brand ─────────────────────────────────────────────────────────────
        brand, b_created = get_or_create(
            db, Brand, slug=BRAND["slug"], tenant_id=tenant.id,
            defaults={"name": BRAND["name"], "is_active": True},
        )
        print(f"Brand:  {brand.name} (id={brand.id}, created={b_created})")

        # ── Hotels + RoomTypes + Rooms + Guests ───────────────────────────────
        hotel_objs = []
        for hotel_data in HOTELS:
            hotel, h_created = get_or_create(
                db, Hotel,
                slug=hotel_data["slug"], tenant_id=tenant.id,
                defaults={
                    "brand_id":       brand.id,
                    "name":           hotel_data["name"],
                    "address":        hotel_data["address"],
                    "region":         hotel_data["region"],
                    "phone":          hotel_data["phone"],
                    "check_in_time":  hotel_data["check_in_time"],
                    "check_out_time": hotel_data["check_out_time"],
                    "is_active":      True,
                },
            )
            hotel_objs.append(hotel)
            print(f"  Hotel: {hotel.name} (id={hotel.id}, created={h_created})")

            # Room types
            rt_objs = []
            for rt_data in ROOM_TYPES:
                rt, rt_created = get_or_create(
                    db, RoomType,
                    name=rt_data["name"], hotel_id=hotel.id,
                    defaults={
                        "room_code":     rt_data["room_code"],
                        "bed_type":      rt_data["bed_type"],
                        "has_window":    rt_data["has_window"],
                        "base_rate":     rt_data["base_rate"],
                        "max_occupancy": rt_data["max_occupancy"],
                        "description":   rt_data["description"],
                    },
                )
                rt_objs.append(rt)

            # Rooms: 4 floors × 3 room types × 3 rooms each
            room_count = 0
            for floor in FLOORS:
                seq = 1
                for rt in rt_objs:
                    for r in range(ROOMS_PER_RT_PER_FLOOR):
                        number = f"{floor}{seq:02d}"
                        _, added = get_or_create(
                            db, Room,
                            hotel_id=hotel.id, number=number,
                            defaults={
                                "floor": floor,
                                "room_type_id": rt.id,
                                "status": RoomStatus.AVAILABLE,
                            },
                        )
                        if added:
                            room_count += 1
                        seq += 1
            if room_count:
                print(f"    → 新增房間 {room_count} 間")

            # Guests (5 per hotel, use hotel index to keep id_number unique)
            h_idx = hotel_objs.index(hotel)
            guest_count = 0
            for g_idx, g_tpl in enumerate(GUESTS_PER_HOTEL):
                idx = h_idx * 10 + g_idx + 1
                phone    = g_tpl["phone"].format(idx=idx)
                email    = g_tpl["email"].format(idx=idx)
                # Use email as unique identifier (no id_number to avoid collision)
                existing = db.query(Guest).filter_by(email=email, hotel_id=hotel.id).first()
                if not existing:
                    db.add(Guest(
                        name=g_tpl["name"],
                        id_type=g_tpl["id_type"],
                        phone=phone,
                        email=email,
                        nationality=g_tpl["nationality"],
                        hotel_id=hotel.id,
                    ))
                    guest_count += 1
            if guest_count:
                print(f"    → 新增客人 {guest_count} 位")

        # ── Users ─────────────────────────────────────────────────────────────
        print("\n帳號：")
        user_count = 0
        for email, password, name, role, hotel_slug in ACCOUNTS:
            if db.query(User).filter_by(email=email).first():
                print(f"  skip  {email}")
                continue

            hotel_id = None
            if hotel_slug:
                hotel = next((h for h in hotel_objs if h.slug == hotel_slug), None)
                if hotel:
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
            user_count += 1

        db.commit()
        print(f"\n完成！帳號 {user_count} 個。")
        print("\n登入帳號一覽：")
        print(f"  集團管理員  admin@sunnystay.com.tw     / Sunny1234!")
        print(f"  品牌管理員  brand@sunnystay.com.tw     / Sunny1234!")
        print(f"  前台        front@sunnystay.com.tw     / Sunny1234!")
        print(f"  主管        manager@sunnystay.com.tw   / Sunny1234!")

    except Exception as e:
        db.rollback()
        print(f"失敗：{e}", file=sys.stderr)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run()
