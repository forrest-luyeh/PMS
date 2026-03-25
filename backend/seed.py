"""Seed: admin account, room types, rooms, guests."""
import sys
from database import SessionLocal
from models.user import User, UserRole
from models.room import RoomType, Room, RoomStatus
from models.guest import Guest
from passlib.context import CryptContext

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
db = SessionLocal()

try:
    # Users
    users = [
        ("admin@example.com",   "admin1234",  "系統管理員", UserRole.ADMIN),
        ("front@example.com",   "front1234",  "前台小陳",   UserRole.FRONT_DESK),
        ("hk@example.com",      "hk1234",     "房務阿美",   UserRole.HOUSEKEEPING),
        ("manager@example.com", "mgr1234",    "主管王先生", UserRole.MANAGER),
    ]
    for email, pw, name, role in users:
        if not db.query(User).filter_by(email=email).first():
            db.add(User(email=email, hashed_password=pwd.hash(pw), name=name, role=role))

    # Room types
    rt_data = [
        ("Standard",  "標準雙人房",        2200, 2),
        ("Deluxe",    "豪華雙人房",        3200, 2),
        ("Suite",     "套房",             5500, 4),
        ("Twin",      "標準雙床房",        2200, 2),
    ]
    rts = {}
    for name, desc, rate, occ in rt_data:
        rt = db.query(RoomType).filter_by(name=name).first()
        if not rt:
            rt = RoomType(name=name, description=desc, base_rate=rate, max_occupancy=occ)
            db.add(rt)
            db.flush()
        rts[name] = rt

    # Rooms
    room_data = [
        ("101", 1, "Standard"), ("102", 1, "Standard"), ("103", 1, "Twin"),
        ("201", 2, "Deluxe"),   ("202", 2, "Deluxe"),   ("203", 2, "Twin"),
        ("301", 3, "Suite"),    ("302", 3, "Suite"),
        ("401", 4, "Deluxe"),   ("402", 4, "Standard"),
    ]
    for number, floor, rt_name in room_data:
        if not db.query(Room).filter_by(number=number).first():
            db.add(Room(number=number, floor=floor, room_type_id=rts[rt_name].id))

    # Guests
    guests_data = [
        ("陳大明", "ID_CARD", "A123456789", "0912345678", "chen@example.com", "台灣"),
        ("林小華", "ID_CARD", "B234567890", "0923456789", "lin@example.com",  "台灣"),
        ("王美麗", "PASSPORT","P12345678",  "0934567890", "wang@example.com", "台灣"),
    ]
    for name, id_type, id_num, phone, email, nat in guests_data:
        if not db.query(Guest).filter_by(id_number=id_num).first():
            db.add(Guest(name=name, id_type=id_type, id_number=id_num,
                         phone=phone, email=email, nationality=nat))

    db.commit()
    print("Seed completed.")
except Exception as e:
    db.rollback()
    print(f"Seed failed: {e}", file=sys.stderr)
    sys.exit(1)
finally:
    db.close()
