"""Admin & registration endpoints for multi-tenant management."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.deps import get_db, require_role, get_current_user, get_hotel_context
from core.security import hash_password, create_access_token
from models.tenant import Tenant, Brand, Hotel, HotelImage, HotelAmenity
from models.user import User, UserRole
from schemas.tenant import (TenantCreate, TenantResponse, BrandCreate, BrandUpdate, BrandResponse,
                             HotelCreate, HotelUpdate, HotelResponse, RegisterRequest,
                             TenantTree, BrandWithHotels, HotelBrief,
                             HotelImageCreate, HotelImageResponse,
                             HotelAmenityCreate, HotelAmenityResponse,
                             TenantSettingsUpdate, TenantSettingsResponse)
from schemas.auth import TokenResponse

router = APIRouter(tags=["admin"])


# ---- Self-service registration ----

@router.post("/register", response_model=TokenResponse, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """Create Tenant + default Brand + Hotel + TENANT_ADMIN user in one request."""
    if db.query(Tenant).filter_by(slug=body.tenant_slug).first():
        raise HTTPException(409, f"Tenant slug '{body.tenant_slug}' already taken")
    if db.query(User).filter_by(email=body.admin_email).first():
        raise HTTPException(409, "Admin email already registered")

    tenant = Tenant(name=body.tenant_name, slug=body.tenant_slug, contact_email=body.contact_email)
    db.add(tenant); db.flush()

    brand = Brand(tenant_id=tenant.id, name=body.tenant_name, slug="default")
    db.add(brand); db.flush()

    hotel = Hotel(brand_id=brand.id, tenant_id=tenant.id,
                  name=body.hotel_name, slug=body.hotel_slug, address=body.hotel_address)
    db.add(hotel); db.flush()

    admin = User(
        email=body.admin_email,
        hashed_password=hash_password(body.admin_password),
        name=body.admin_name,
        role=UserRole.TENANT_ADMIN,
        hotel_id=hotel.id,
        brand_id=brand.id,
        tenant_id=tenant.id,
    )
    db.add(admin); db.commit(); db.refresh(admin)

    token = create_access_token(str(admin.id), admin.role.value,
                                hotel_id=hotel.id, brand_id=brand.id, tenant_id=tenant.id)
    return TokenResponse(access_token=token)


# ---- SUPER_ADMIN: Tenant management ----

@router.get("/admin/tenants", response_model=list[TenantResponse])
def list_tenants(db: Session = Depends(get_db), _=Depends(require_role("SUPER_ADMIN"))):
    return db.query(Tenant).all()


@router.get("/admin/tenants/tree", response_model=list[TenantTree])
def tenants_tree(db: Session = Depends(get_db), _=Depends(require_role("SUPER_ADMIN"))):
    tenants = db.query(Tenant).all()
    result = []
    for t in tenants:
        brands = db.query(Brand).filter_by(tenant_id=t.id).all()
        brand_list = []
        for b in brands:
            hotels = db.query(Hotel).filter_by(brand_id=b.id).all()
            brand_list.append(BrandWithHotels(
                id=b.id, name=b.name, slug=b.slug, is_active=b.is_active,
                hotels=[HotelBrief(id=h.id, name=h.name, slug=h.slug,
                                   address=h.address or '', region=h.region,
                                   is_active=h.is_active) for h in hotels],
            ))
        result.append(TenantTree(
            id=t.id, name=t.name, slug=t.slug, contact_email=t.contact_email,
            is_active=t.is_active, brands=brand_list,
        ))
    return result


@router.post("/admin/tenants", response_model=TenantResponse, status_code=201)
def create_tenant(body: TenantCreate, db: Session = Depends(get_db), _=Depends(require_role("SUPER_ADMIN"))):
    if db.query(Tenant).filter_by(slug=body.slug).first():
        raise HTTPException(409, "Slug already taken")
    tenant = Tenant(**body.model_dump())
    db.add(tenant); db.commit(); db.refresh(tenant)
    return tenant


@router.patch("/admin/tenants/{tenant_id}/deactivate")
def deactivate_tenant(tenant_id: int, db: Session = Depends(get_db), _=Depends(require_role("SUPER_ADMIN"))):
    tenant = db.get(Tenant, tenant_id)
    if not tenant: raise HTTPException(404, "Tenant not found")
    tenant.is_active = False
    db.commit()
    return {"message": "Tenant deactivated"}


@router.patch("/admin/tenants/{tenant_id}/activate")
def activate_tenant(tenant_id: int, db: Session = Depends(get_db), _=Depends(require_role("SUPER_ADMIN"))):
    tenant = db.get(Tenant, tenant_id)
    if not tenant: raise HTTPException(404, "Tenant not found")
    tenant.is_active = True
    db.commit()
    return {"message": "Tenant activated"}


# ---- SUPER_ADMIN / TENANT_ADMIN: Brand management ----

@router.get("/admin/brands", response_model=list[BrandResponse])
def list_brands(db: Session = Depends(get_db), current_user=Depends(require_role("SUPER_ADMIN", "TENANT_ADMIN"))):
    q = db.query(Brand)
    if current_user.role != UserRole.SUPER_ADMIN:
        q = q.filter_by(tenant_id=current_user.tenant_id)
    return q.all()


@router.post("/admin/brands", response_model=BrandResponse, status_code=201)
def create_brand(body: BrandCreate, db: Session = Depends(get_db),
                 current_user=Depends(require_role("SUPER_ADMIN", "TENANT_ADMIN"))):
    if current_user.role != UserRole.SUPER_ADMIN and body.tenant_id != current_user.tenant_id:
        raise HTTPException(403, "Cannot create brand for another tenant")
    if db.query(Brand).filter_by(tenant_id=body.tenant_id, slug=body.slug).first():
        raise HTTPException(409, "Brand slug already taken in this tenant")
    brand = Brand(**body.model_dump())
    db.add(brand); db.commit(); db.refresh(brand)
    return brand


@router.put("/admin/brands/{brand_id}", response_model=BrandResponse)
def update_brand(brand_id: int, body: BrandUpdate, db: Session = Depends(get_db),
                 current_user=Depends(require_role("SUPER_ADMIN", "TENANT_ADMIN"))):
    brand = db.get(Brand, brand_id)
    if not brand: raise HTTPException(404, "Brand not found")
    if current_user.role != UserRole.SUPER_ADMIN and brand.tenant_id != current_user.tenant_id:
        raise HTTPException(403, "Not your tenant's brand")
    brand.name = body.name
    db.commit(); db.refresh(brand)
    return brand


@router.patch("/admin/brands/{brand_id}/deactivate")
def deactivate_brand(brand_id: int, db: Session = Depends(get_db),
                     current_user=Depends(require_role("SUPER_ADMIN", "TENANT_ADMIN"))):
    brand = db.get(Brand, brand_id)
    if not brand: raise HTTPException(404, "Brand not found")
    if current_user.role != UserRole.SUPER_ADMIN and brand.tenant_id != current_user.tenant_id:
        raise HTTPException(403, "Not your tenant's brand")
    brand.is_active = False; db.commit()
    return {"message": "Brand deactivated"}


@router.patch("/admin/brands/{brand_id}/activate")
def activate_brand(brand_id: int, db: Session = Depends(get_db),
                   current_user=Depends(require_role("SUPER_ADMIN", "TENANT_ADMIN"))):
    brand = db.get(Brand, brand_id)
    if not brand: raise HTTPException(404, "Brand not found")
    if current_user.role != UserRole.SUPER_ADMIN and brand.tenant_id != current_user.tenant_id:
        raise HTTPException(403, "Not your tenant's brand")
    brand.is_active = True; db.commit()
    return {"message": "Brand activated"}


# ---- SUPER_ADMIN / TENANT_ADMIN / BRAND_ADMIN: Hotel management ----

@router.get("/admin/hotels", response_model=list[HotelResponse])
def list_hotels(db: Session = Depends(get_db),
                current_user=Depends(require_role("SUPER_ADMIN", "TENANT_ADMIN", "BRAND_ADMIN"))):
    q = db.query(Hotel)
    if current_user.role == UserRole.TENANT_ADMIN:
        if current_user.tenant_id is not None:
            q = q.filter_by(tenant_id=current_user.tenant_id)
        elif current_user.hotel_id is not None:
            q = q.filter(Hotel.id == current_user.hotel_id)
    elif current_user.role == UserRole.BRAND_ADMIN:
        if current_user.brand_id is not None:
            q = q.filter_by(brand_id=current_user.brand_id)
        elif current_user.hotel_id is not None:
            q = q.filter(Hotel.id == current_user.hotel_id)
    return q.all()


@router.post("/admin/hotels", response_model=HotelResponse, status_code=201)
def create_hotel(body: HotelCreate, db: Session = Depends(get_db),
                 current_user=Depends(require_role("SUPER_ADMIN", "TENANT_ADMIN", "BRAND_ADMIN"))):
    if current_user.role == UserRole.TENANT_ADMIN and body.tenant_id != current_user.tenant_id:
        raise HTTPException(403, "Cannot create hotel for another tenant")
    if current_user.role == UserRole.BRAND_ADMIN and body.brand_id != current_user.brand_id:
        raise HTTPException(403, "Cannot create hotel for another brand")
    if db.query(Hotel).filter_by(brand_id=body.brand_id, slug=body.slug).first():
        raise HTTPException(409, "Hotel slug already taken in this brand")
    hotel = Hotel(**body.model_dump())
    db.add(hotel); db.commit(); db.refresh(hotel)
    return hotel


@router.put("/admin/hotels/{hotel_id}", response_model=HotelResponse)
def update_hotel(hotel_id: int, body: HotelUpdate, db: Session = Depends(get_db),
                 current_user=Depends(require_role("SUPER_ADMIN", "TENANT_ADMIN", "BRAND_ADMIN"))):
    hotel = db.get(Hotel, hotel_id)
    if not hotel:
        raise HTTPException(404, "Hotel not found")
    if current_user.role == UserRole.TENANT_ADMIN and hotel.tenant_id != current_user.tenant_id:
        raise HTTPException(403, "Not your tenant's hotel")
    if current_user.role == UserRole.BRAND_ADMIN and hotel.brand_id != current_user.brand_id:
        raise HTTPException(403, "Not your brand's hotel")
    for k, v in body.model_dump().items():
        setattr(hotel, k, v)
    db.commit(); db.refresh(hotel)
    return hotel


@router.patch("/admin/hotels/{hotel_id}/deactivate")
def deactivate_hotel(hotel_id: int, db: Session = Depends(get_db),
                     current_user=Depends(require_role("SUPER_ADMIN", "TENANT_ADMIN"))):
    hotel = db.get(Hotel, hotel_id)
    if not hotel: raise HTTPException(404, "Hotel not found")
    if current_user.role == UserRole.TENANT_ADMIN and hotel.tenant_id != current_user.tenant_id:
        raise HTTPException(403, "Not your tenant's hotel")
    hotel.is_active = False
    db.commit()
    return {"message": "Hotel deactivated"}


@router.patch("/admin/hotels/{hotel_id}/activate")
def activate_hotel(hotel_id: int, db: Session = Depends(get_db),
                   current_user=Depends(require_role("SUPER_ADMIN", "TENANT_ADMIN"))):
    hotel = db.get(Hotel, hotel_id)
    if not hotel: raise HTTPException(404, "Hotel not found")
    if current_user.role == UserRole.TENANT_ADMIN and hotel.tenant_id != current_user.tenant_id:
        raise HTTPException(403, "Not your tenant's hotel")
    hotel.is_active = True
    db.commit()
    return {"message": "Hotel activated"}


# ---- Hotel Images ----

def _check_hotel_access(hotel, current_user):
    if current_user.role == UserRole.SUPER_ADMIN:
        return
    if current_user.role == UserRole.TENANT_ADMIN and hotel.tenant_id != current_user.tenant_id:
        raise HTTPException(403, "Not your tenant's hotel")
    if current_user.role == UserRole.BRAND_ADMIN and hotel.brand_id != current_user.brand_id:
        raise HTTPException(403, "Not your brand's hotel")


@router.get("/admin/hotels/{hotel_id}/images", response_model=list[HotelImageResponse])
def list_hotel_images(hotel_id: int, db: Session = Depends(get_db),
                      current_user=Depends(require_role("SUPER_ADMIN", "TENANT_ADMIN", "BRAND_ADMIN"))):
    hotel = db.get(Hotel, hotel_id)
    if not hotel: raise HTTPException(404, "Hotel not found")
    _check_hotel_access(hotel, current_user)
    return db.query(HotelImage).filter_by(hotel_id=hotel_id).order_by(HotelImage.sort_order).all()


@router.post("/admin/hotels/{hotel_id}/images", response_model=HotelImageResponse, status_code=201)
def add_hotel_image(hotel_id: int, body: HotelImageCreate, db: Session = Depends(get_db),
                    current_user=Depends(require_role("SUPER_ADMIN", "TENANT_ADMIN", "BRAND_ADMIN"))):
    hotel = db.get(Hotel, hotel_id)
    if not hotel: raise HTTPException(404, "Hotel not found")
    _check_hotel_access(hotel, current_user)
    img = HotelImage(hotel_id=hotel_id, **body.model_dump())
    db.add(img); db.commit(); db.refresh(img)
    return img


@router.delete("/admin/hotels/{hotel_id}/images/{img_id}", status_code=204)
def delete_hotel_image(hotel_id: int, img_id: int, db: Session = Depends(get_db),
                       current_user=Depends(require_role("SUPER_ADMIN", "TENANT_ADMIN", "BRAND_ADMIN"))):
    hotel = db.get(Hotel, hotel_id)
    if not hotel: raise HTTPException(404, "Hotel not found")
    _check_hotel_access(hotel, current_user)
    img = db.query(HotelImage).filter_by(id=img_id, hotel_id=hotel_id).first()
    if not img: raise HTTPException(404, "Image not found")
    db.delete(img); db.commit()


# ---- Hotel Amenities ----

@router.get("/admin/hotels/{hotel_id}/amenities", response_model=list[HotelAmenityResponse])
def list_hotel_amenities(hotel_id: int, db: Session = Depends(get_db),
                         current_user=Depends(require_role("SUPER_ADMIN", "TENANT_ADMIN", "BRAND_ADMIN"))):
    hotel = db.get(Hotel, hotel_id)
    if not hotel: raise HTTPException(404, "Hotel not found")
    _check_hotel_access(hotel, current_user)
    return db.query(HotelAmenity).filter_by(hotel_id=hotel_id).all()


@router.post("/admin/hotels/{hotel_id}/amenities", response_model=HotelAmenityResponse, status_code=201)
def add_hotel_amenity(hotel_id: int, body: HotelAmenityCreate, db: Session = Depends(get_db),
                      current_user=Depends(require_role("SUPER_ADMIN", "TENANT_ADMIN", "BRAND_ADMIN"))):
    hotel = db.get(Hotel, hotel_id)
    if not hotel: raise HTTPException(404, "Hotel not found")
    _check_hotel_access(hotel, current_user)
    a = HotelAmenity(hotel_id=hotel_id, **body.model_dump())
    db.add(a); db.commit(); db.refresh(a)
    return a


@router.delete("/admin/hotels/{hotel_id}/amenities/{amenity_id}", status_code=204)
def delete_hotel_amenity(hotel_id: int, amenity_id: int, db: Session = Depends(get_db),
                         current_user=Depends(require_role("SUPER_ADMIN", "TENANT_ADMIN", "BRAND_ADMIN"))):
    hotel = db.get(Hotel, hotel_id)
    if not hotel: raise HTTPException(404, "Hotel not found")
    _check_hotel_access(hotel, current_user)
    a = db.query(HotelAmenity).filter_by(id=amenity_id, hotel_id=hotel_id).first()
    if not a: raise HTTPException(404, "Amenity not found")
    db.delete(a); db.commit()


# ---- SUPER_ADMIN: Cross-tenant dashboard ----

@router.get("/admin/dashboard")
def super_admin_dashboard(db: Session = Depends(get_db), _=Depends(require_role("SUPER_ADMIN"))):
    from models.reservation import Reservation
    from models.room import Room
    return {
        "tenants": db.query(Tenant).count(),
        "active_tenants": db.query(Tenant).filter_by(is_active=True).count(),
        "hotels": db.query(Hotel).count(),
        "active_hotels": db.query(Hotel).filter_by(is_active=True).count(),
        "total_rooms": db.query(Room).count(),
        "total_reservations": db.query(Reservation).count(),
    }


# ---- TENANT_ADMIN / BRAND_ADMIN: Aggregate dashboard ----

@router.get("/admin/aggregate-dashboard")
def aggregate_dashboard(
    brand_id: int = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("SUPER_ADMIN", "TENANT_ADMIN", "BRAND_ADMIN")),
):
    """Aggregated today stats across all hotels (optionally filtered by brand)."""
    from datetime import date
    from models.room import Room, RoomStatus
    from models.reservation import Reservation, ReservationStatus

    today = date.today()

    # Build hotel list scoped to caller
    q = db.query(Hotel)
    if current_user.role == UserRole.TENANT_ADMIN:
        q = q.filter_by(tenant_id=current_user.tenant_id)
    elif current_user.role == UserRole.BRAND_ADMIN:
        q = q.filter_by(brand_id=current_user.brand_id)
    if brand_id:
        q = q.filter_by(brand_id=brand_id)
    hotels = q.all()
    hotel_map = {h.id: h.name for h in hotels}
    hotel_ids = list(hotel_map.keys())

    if not hotel_ids:
        return {"today": {}, "room_status": {}, "arrivals": [], "departures": []}

    # Room status aggregation
    rooms = db.query(Room).filter(Room.hotel_id.in_(hotel_ids)).all()
    room_status: dict = {}
    for r in rooms:
        k = r.status.value
        room_status[k] = room_status.get(k, 0) + 1

    total_rooms = len(rooms)
    occupied_count = room_status.get(RoomStatus.OCCUPIED.value, 0)
    occupancy_rate = round(occupied_count / total_rooms * 100, 1) if total_rooms else 0.0

    # Today stats
    arrivals_count = db.query(Reservation).filter(
        Reservation.hotel_id.in_(hotel_ids),
        Reservation.check_in_date == today,
        Reservation.status == ReservationStatus.CONFIRMED,
    ).count()
    departures_count = db.query(Reservation).filter(
        Reservation.hotel_id.in_(hotel_ids),
        Reservation.check_out_date == today,
        Reservation.status == ReservationStatus.CHECKED_IN,
    ).count()
    current_occupied = db.query(Reservation).filter(
        Reservation.hotel_id.in_(hotel_ids),
        Reservation.status == ReservationStatus.CHECKED_IN,
    ).count()

    # Arrivals list
    arrival_rows = db.query(Reservation).filter(
        Reservation.hotel_id.in_(hotel_ids),
        Reservation.check_in_date == today,
        Reservation.status.in_([ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN]),
    ).order_by(Reservation.check_in_date).limit(50).all()

    # Departures list
    departure_rows = db.query(Reservation).filter(
        Reservation.hotel_id.in_(hotel_ids),
        Reservation.check_out_date == today,
        Reservation.status == ReservationStatus.CHECKED_IN,
    ).order_by(Reservation.check_out_date).limit(50).all()

    def _fmt_res(r):
        nights = (r.check_out_date - r.check_in_date).days
        return {
            "id": r.id,
            "hotel_id": r.hotel_id,
            "hotel_name": hotel_map.get(r.hotel_id, ""),
            "status": r.status.value,
            "nights": nights,
            "guest_name": r.guest.name if r.guest else "",
            "room_type_name": r.room_type.name if r.room_type else "",
            "room_number": r.room.number if r.room else None,
        }

    return {
        "today": {
            "arrivals_today": arrivals_count,
            "departures_today": departures_count,
            "current_occupied": current_occupied,
            "total_rooms": total_rooms,
            "occupancy_rate": occupancy_rate,
        },
        "room_status": room_status,
        "arrivals": [_fmt_res(r) for r in arrival_rows],
        "departures": [_fmt_res(r) for r in departure_rows],
    }


# ---- Tenant Settings ----

@router.get("/admin/tenant-settings", response_model=TenantSettingsResponse)
def get_tenant_settings(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("SUPER_ADMIN", "TENANT_ADMIN")),
):
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(400, "No tenant context")
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(404, "Tenant not found")
    return tenant


@router.put("/admin/tenant-settings", response_model=TenantSettingsResponse)
def update_tenant_settings(
    body: TenantSettingsUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("SUPER_ADMIN", "TENANT_ADMIN")),
):
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(400, "No tenant context")
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(404, "Tenant not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(tenant, k, v)
    db.commit()
    db.refresh(tenant)
    return tenant


# ---- TENANT_ADMIN / BRAND_ADMIN: Switch hotel context ----

@router.post("/admin/switch-hotel", response_model=TokenResponse)
def switch_hotel(hotel_id: int, db: Session = Depends(get_db),
                 current_user=Depends(require_role("SUPER_ADMIN", "TENANT_ADMIN", "BRAND_ADMIN"))):
    """Issue a new token scoped to the specified hotel."""
    hotel = db.get(Hotel, hotel_id)
    if not hotel or not hotel.is_active:
        raise HTTPException(404, "Hotel not found or inactive")
    # Scope check（tenant_id/brand_id 若為 None 表示舊資料尚未遷移，略過此檢查）
    if current_user.role == UserRole.TENANT_ADMIN and current_user.tenant_id is not None:
        if hotel.tenant_id != current_user.tenant_id:
            raise HTTPException(403, "Hotel not in your tenant")
    if current_user.role == UserRole.BRAND_ADMIN and current_user.brand_id is not None:
        if hotel.brand_id != current_user.brand_id:
            raise HTTPException(403, "Hotel not in your brand")
    token = create_access_token(str(current_user.id), current_user.role.value,
                                hotel_id=hotel.id, brand_id=hotel.brand_id, tenant_id=hotel.tenant_id)
    return TokenResponse(access_token=token)
