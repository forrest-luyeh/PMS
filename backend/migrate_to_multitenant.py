"""
Migration script: assign all existing data to a default Tenant / Brand / Hotel.
Run ONCE after applying the hotel_id migration:
    python migrate_to_multitenant.py
"""
import sys
from database import SessionLocal
from models.tenant import Tenant, Brand, Hotel
from models.user import User
from models.room import RoomType, Room
from models.guest import Guest
from models.reservation import Reservation
from models.folio import Folio

db = SessionLocal()

try:
    # --- 1. Create default Tenant ---
    tenant = db.query(Tenant).filter_by(slug="default").first()
    if not tenant:
        tenant = Tenant(name="預設集團", slug="default", contact_email="admin@example.com")
        db.add(tenant)
        db.flush()
        print(f"Created Tenant id={tenant.id}")
    else:
        print(f"Tenant already exists id={tenant.id}")

    # --- 2. Create default Brand ---
    brand = db.query(Brand).filter_by(tenant_id=tenant.id, slug="default").first()
    if not brand:
        brand = Brand(tenant_id=tenant.id, name="預設品牌", slug="default")
        db.add(brand)
        db.flush()
        print(f"Created Brand id={brand.id}")
    else:
        print(f"Brand already exists id={brand.id}")

    # --- 3. Create default Hotel ---
    hotel = db.query(Hotel).filter_by(brand_id=brand.id, slug="default").first()
    if not hotel:
        hotel = Hotel(
            brand_id=brand.id,
            tenant_id=tenant.id,
            name="預設旅館",
            slug="default",
            address="",
        )
        db.add(hotel)
        db.flush()
        print(f"Created Hotel id={hotel.id}")
    else:
        print(f"Hotel already exists id={hotel.id}")

    hid = hotel.id

    # --- 4. Assign all existing business data to default hotel ---
    counts = {}

    counts["users"] = db.query(User).filter(User.hotel_id == None).update(  # noqa: E711
        {"hotel_id": hid, "brand_id": brand.id, "tenant_id": tenant.id},
        synchronize_session=False,
    )
    counts["room_types"] = db.query(RoomType).filter(RoomType.hotel_id == None).update(  # noqa: E711
        {"hotel_id": hid}, synchronize_session=False
    )
    counts["rooms"] = db.query(Room).filter(Room.hotel_id == None).update(  # noqa: E711
        {"hotel_id": hid}, synchronize_session=False
    )
    counts["guests"] = db.query(Guest).filter(Guest.hotel_id == None).update(  # noqa: E711
        {"hotel_id": hid}, synchronize_session=False
    )
    counts["reservations"] = db.query(Reservation).filter(Reservation.hotel_id == None).update(  # noqa: E711
        {"hotel_id": hid}, synchronize_session=False
    )
    counts["folios"] = db.query(Folio).filter(Folio.hotel_id == None).update(  # noqa: E711
        {"hotel_id": hid}, synchronize_session=False
    )

    db.commit()
    print("\nMigration complete:")
    for table, n in counts.items():
        print(f"  {table}: {n} rows updated → hotel_id={hid}")

except Exception as e:
    db.rollback()
    print(f"Migration failed: {e}", file=sys.stderr)
    sys.exit(1)
finally:
    db.close()
