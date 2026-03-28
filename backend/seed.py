"""Seed: default Tenant/Brand/Hotel, admin accounts, room types, rooms, guests."""
import sys
from database import SessionLocal
from models.tenant import Tenant, Brand, Hotel
from models.user import User, UserRole
from models.room import RoomType, Room, RoomStatus
from models.guest import Guest
from passlib.context import CryptContext

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
db = SessionLocal()

try:
    # --- Default Tenant / Brand / Hotel ---
    tenant = db.query(Tenant).filter_by(slug="default").first()
    if not tenant:
        tenant = Tenant(name="預設集團", slug="default", contact_email="admin@example.com")
        db.add(tenant); db.flush()

    brand = db.query(Brand).filter_by(tenant_id=tenant.id, slug="default").first()
    if not brand:
        brand = Brand(tenant_id=tenant.id, name="預設品牌", slug="default")
        db.add(brand); db.flush()

    hotel = db.query(Hotel).filter_by(brand_id=brand.id, slug="default").first()
    if not hotel:
        hotel = Hotel(brand_id=brand.id, tenant_id=tenant.id,
                      name="預設旅館", slug="default", address="台灣台北市")
        db.add(hotel); db.flush()

    hid = hotel.id

    # --- Users ---
    users = [
        ("super@example.com",   "super1234",  "超級管理員", UserRole.SUPER_ADMIN,  None,  None,       None),
        ("admin@example.com",   "admin1234",  "系統管理員", UserRole.TENANT_ADMIN, hid,   brand.id,   tenant.id),
        ("front@example.com",   "front1234",  "前台小陳",   UserRole.FRONT_DESK,   hid,   brand.id,   tenant.id),
        ("hk@example.com",      "hk1234",     "房務阿美",   UserRole.HOUSEKEEPING, hid,   brand.id,   tenant.id),
        ("manager@example.com", "mgr1234",    "主管王先生", UserRole.MANAGER,      hid,   brand.id,   tenant.id),
    ]
    for email, pw, name, role, h_id, b_id, t_id in users:
        if not db.query(User).filter_by(email=email).first():
            db.add(User(email=email, hashed_password=pwd.hash(pw), name=name, role=role,
                        hotel_id=h_id, brand_id=b_id, tenant_id=t_id))

    # --- Room types ---
    rt_data = [
        ("Standard",  "標準雙人房", 2200, 2),
        ("Deluxe",    "豪華雙人房", 3200, 2),
        ("Suite",     "套房",       5500, 4),
        ("Twin",      "標準雙床房", 2200, 2),
    ]
    rts = {}
    for name, desc, rate, occ in rt_data:
        rt = db.query(RoomType).filter_by(name=name, hotel_id=hid).first()
        if not rt:
            rt = RoomType(name=name, description=desc, base_rate=rate, max_occupancy=occ, hotel_id=hid)
            db.add(rt); db.flush()
        rts[name] = rt

    # --- Rooms ---
    room_data = [
        ("101", 1, "Standard"), ("102", 1, "Standard"), ("103", 1, "Twin"),
        ("201", 2, "Deluxe"),   ("202", 2, "Deluxe"),   ("203", 2, "Twin"),
        ("301", 3, "Suite"),    ("302", 3, "Suite"),
        ("401", 4, "Deluxe"),   ("402", 4, "Standard"),
    ]
    for number, floor, rt_name in room_data:
        if not db.query(Room).filter_by(number=number, hotel_id=hid).first():
            db.add(Room(number=number, floor=floor, room_type_id=rts[rt_name].id, hotel_id=hid))

    # --- Guests ---
    guests_data = [
        ("陳大明", "ID_CARD",  "A123456789", "0912345678", "chen@example.com", "台灣"),
        ("林小華", "ID_CARD",  "B234567890", "0923456789", "lin@example.com",  "台灣"),
        ("王美麗", "PASSPORT", "P12345678",  "0934567890", "wang@example.com", "台灣"),
    ]
    for name, id_type, id_num, phone, email, nat in guests_data:
        if not db.query(Guest).filter_by(id_number=id_num, hotel_id=hid).first():
            db.add(Guest(name=name, id_type=id_type, id_number=id_num,
                         phone=phone, email=email, nationality=nat, hotel_id=hid))

    db.commit()
    print("Seed completed.")
except Exception as e:
    db.rollback()
    print(f"Seed failed: {e}", file=sys.stderr)
    sys.exit(1)
finally:
    db.close()
