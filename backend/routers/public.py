"""
Public API router — no JWT required.
All endpoints are scoped by hotel slug (and optionally tenant_slug).
"""
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from core.deps import get_db
from models.tenant import Tenant, Brand, Hotel, HotelImage, HotelAmenity
from models.room import RoomType, Room, RoomStatus, RoomTypeImage, RoomTypeAmenity
from models.guest import Guest
from models.reservation import Reservation, ReservationStatus, ReservationSource, generate_confirmation_code
from models.testimonial import Testimonial
from models.hero_slide import HeroSlide
from schemas.public import (
    PublicHotelResponse, PublicRoomTypeResponse, PublicAvailabilityResponse,
    PublicBookingCreate, PublicBookingResponse, PublicBookingDetail, PublicCancelRequest,
    PublicTestimonialResponse, PublicHeroSlideResponse, PublicTenantConfigResponse,
)

router = APIRouter(prefix="/public", tags=["public"])


# ── helpers ───────────────────────────────────────────────────────────────────

def _get_hotel(db: Session, hotel_slug: str) -> Hotel:
    hotel = db.query(Hotel).filter_by(slug=hotel_slug, is_active=True).first()
    if not hotel:
        raise HTTPException(404, "Hotel not found")
    return hotel


def _hotel_to_response(hotel: Hotel) -> dict:
    return {
        "id": hotel.id,
        "slug": hotel.slug,
        "name": hotel.name,
        "brand_name": hotel.brand.name if hotel.brand else "",
        "brand_slug": hotel.brand.slug if hotel.brand else "",
        "region": hotel.region,
        "address": hotel.address,
        "phone": hotel.phone,
        "check_in_time": hotel.check_in_time,
        "check_out_time": hotel.check_out_time,
        "description": hotel.description,
        "is_featured": hotel.is_featured,
        "images": [{"url": i.url, "alt_text": i.alt_text, "sort_order": i.sort_order} for i in hotel.images],
        "amenities": [{"name": a.name, "category": a.category} for a in hotel.amenities],
    }


# ── GET /public/hotels ────────────────────────────────────────────────────────

@router.get("/hotels", response_model=list[PublicHotelResponse])
def list_hotels(
    tenant_slug: str = Query(..., description="Tenant slug (e.g. checkinn)"),
    brand_slug: str = Query(None),
    region: str = Query(None),
    featured: bool = Query(False),
    db: Session = Depends(get_db),
):
    tenant = db.query(Tenant).filter_by(slug=tenant_slug, is_active=True).first()
    if not tenant:
        raise HTTPException(404, "Tenant not found")

    q = db.query(Hotel).filter_by(tenant_id=tenant.id, is_active=True)

    if brand_slug:
        brand = db.query(Brand).filter_by(slug=brand_slug, tenant_id=tenant.id).first()
        if not brand:
            raise HTTPException(404, "Brand not found")
        q = q.filter_by(brand_id=brand.id)

    if region:
        q = q.filter(Hotel.region == region)

    if featured:
        q = q.filter(Hotel.is_featured == True)

    hotels = q.order_by(Hotel.name).all()
    return [_hotel_to_response(h) for h in hotels]


# ── GET /public/hotels/{hotel_slug} ──────────────────────────────────────────

@router.get("/hotels/{hotel_slug}", response_model=PublicHotelResponse)
def get_hotel(hotel_slug: str, db: Session = Depends(get_db)):
    hotel = _get_hotel(db, hotel_slug)
    return _hotel_to_response(hotel)


# ── GET /public/hotels/{hotel_slug}/room-types ────────────────────────────────

@router.get("/hotels/{hotel_slug}/room-types", response_model=list[PublicRoomTypeResponse])
def list_room_types(hotel_slug: str, db: Session = Depends(get_db)):
    hotel = _get_hotel(db, hotel_slug)
    return db.query(RoomType).filter_by(hotel_id=hotel.id).all()


# ── GET /public/hotels/{hotel_slug}/availability ─────────────────────────────

@router.get("/hotels/{hotel_slug}/availability", response_model=list[PublicAvailabilityResponse])
def check_availability(
    hotel_slug: str,
    check_in: date = Query(...),
    check_out: date = Query(...),
    db: Session = Depends(get_db),
):
    if check_out <= check_in:
        raise HTTPException(400, "check_out must be after check_in")

    hotel = _get_hotel(db, hotel_slug)
    nights = (check_out - check_in).days

    # Reservations that overlap the requested period (no room assignment needed for count)
    booked_counts: dict[int, int] = {}
    overlapping = (
        db.query(Reservation)
        .filter(
            Reservation.hotel_id == hotel.id,
            Reservation.status.in_([ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN]),
            Reservation.check_in_date < check_out,
            Reservation.check_out_date > check_in,
        )
        .all()
    )
    for res in overlapping:
        booked_counts[res.room_type_id] = booked_counts.get(res.room_type_id, 0) + 1

    result = []
    for rt in db.query(RoomType).filter_by(hotel_id=hotel.id).all():
        total_rooms = db.query(Room).filter(
            Room.room_type_id == rt.id,
            Room.hotel_id == hotel.id,
            Room.status != RoomStatus.OUT_OF_ORDER,
        ).count()
        booked = booked_counts.get(rt.id, 0)
        available = max(0, total_rooms - booked)
        total_price = Decimal(str(rt.base_rate)) * nights
        result.append(PublicAvailabilityResponse(
            room_type_id=rt.id,
            room_type_name=rt.name,
            available_count=available,
            base_rate=rt.base_rate,
            nights=nights,
            total_price=total_price,
        ))
    return result


# ── POST /public/bookings ─────────────────────────────────────────────────────

@router.post("/bookings", response_model=PublicBookingResponse, status_code=201)
def create_booking(body: PublicBookingCreate, db: Session = Depends(get_db)):
    hotel = _get_hotel(db, body.hotel_slug)

    room_type = db.query(RoomType).filter_by(id=body.room_type_id, hotel_id=hotel.id).first()
    if not room_type:
        raise HTTPException(404, "Room type not found for this hotel")

    if body.check_out_date <= body.check_in_date:
        raise HTTPException(400, "check_out must be after check_in")

    nights = (body.check_out_date - body.check_in_date).days

    # Check availability
    booked = (
        db.query(Reservation)
        .filter(
            Reservation.hotel_id == hotel.id,
            Reservation.room_type_id == body.room_type_id,
            Reservation.status.in_([ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN]),
            Reservation.check_in_date < body.check_out_date,
            Reservation.check_out_date > body.check_in_date,
        )
        .count()
    )
    total_rooms = db.query(Room).filter(
        Room.room_type_id == body.room_type_id,
        Room.hotel_id == hotel.id,
        Room.status != RoomStatus.OUT_OF_ORDER,
    ).count()
    if booked >= total_rooms:
        raise HTTPException(409, "No rooms available for the selected dates")

    # Upsert guest by email + hotel_id
    guest = db.query(Guest).filter_by(email=body.guest_email, hotel_id=hotel.id).first()
    if not guest:
        guest = Guest(
            hotel_id=hotel.id,
            name=body.guest_name,
            phone=body.guest_phone,
            email=body.guest_email,
            id_type=body.guest_id_type,
        )
        db.add(guest)
        db.flush()
    else:
        guest.name = body.guest_name
        guest.phone = body.guest_phone

    # Generate unique confirmation code
    for _ in range(10):
        code = generate_confirmation_code()
        if not db.query(Reservation).filter_by(confirmation_code=code).first():
            break

    reservation = Reservation(
        hotel_id=hotel.id,
        guest_id=guest.id,
        room_type_id=body.room_type_id,
        check_in_date=body.check_in_date,
        check_out_date=body.check_out_date,
        adults=body.adults,
        children=body.children,
        rate_per_night=room_type.base_rate,
        status=ReservationStatus.CONFIRMED,
        source=ReservationSource.DIRECT,
        notes=body.notes,
        confirmation_code=code,
    )
    db.add(reservation)
    db.commit()

    total_amount = Decimal(str(room_type.base_rate)) * nights
    return PublicBookingResponse(
        confirmation_code=code,
        hotel_name=hotel.name,
        room_type_name=room_type.name,
        check_in_date=body.check_in_date,
        check_out_date=body.check_out_date,
        adults=body.adults,
        children=body.children,
        total_amount=total_amount,
    )


# ── GET /public/bookings/{confirmation_code} ──────────────────────────────────

@router.get("/bookings/{confirmation_code}", response_model=PublicBookingDetail)
def get_booking(
    confirmation_code: str,
    email: str = Query(..., description="Guest email for verification"),
    db: Session = Depends(get_db),
):
    res = db.query(Reservation).filter_by(confirmation_code=confirmation_code).first()
    if not res:
        raise HTTPException(404, "Booking not found")

    guest = db.query(Guest).filter_by(id=res.guest_id).first()
    if not guest or (guest.email or "").lower() != email.lower():
        raise HTTPException(403, "Email does not match booking")

    hotel = db.query(Hotel).filter_by(id=res.hotel_id).first()
    room_type = db.query(RoomType).filter_by(id=res.room_type_id).first()
    nights = (res.check_out_date - res.check_in_date).days
    total_amount = Decimal(str(res.rate_per_night)) * nights

    return PublicBookingDetail(
        confirmation_code=confirmation_code,
        hotel_name=hotel.name if hotel else "",
        hotel_slug=hotel.slug if hotel else "",
        room_type_name=room_type.name if room_type else "",
        check_in_date=res.check_in_date,
        check_out_date=res.check_out_date,
        adults=res.adults,
        children=res.children,
        status=res.status.value,
        total_amount=total_amount,
        guest_name=guest.name,
        guest_email=guest.email or "",
        notes=res.notes,
    )


# ── POST /public/bookings/{confirmation_code}/cancel ─────────────────────────

@router.post("/bookings/{confirmation_code}/cancel")
def cancel_booking(
    confirmation_code: str,
    body: PublicCancelRequest,
    db: Session = Depends(get_db),
):
    res = db.query(Reservation).filter_by(confirmation_code=confirmation_code).first()
    if not res:
        raise HTTPException(404, "Booking not found")

    guest = db.query(Guest).filter_by(id=res.guest_id).first()
    if not guest or (guest.email or "").lower() != body.email.lower():
        raise HTTPException(403, "Email does not match booking")

    if res.status != ReservationStatus.CONFIRMED:
        raise HTTPException(409, f"Cannot cancel booking with status: {res.status.value}")

    res.status = ReservationStatus.CANCELLED
    db.commit()
    return {"message": "Booking cancelled successfully", "confirmation_code": confirmation_code}


# ── Public Posts ──────────────────────────────────────────────────────────────

from models.post import Post, PostType as _PostType
from schemas.post import PostListResponse as _PostListResponse, PostResponse as _PostResponse


@router.get("/posts", response_model=list[_PostListResponse])
def list_public_posts(
    tenant_slug: str = Query(...),
    type: _PostType | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    tenant = db.query(Tenant).filter_by(slug=tenant_slug, is_active=True).first()
    if not tenant:
        raise HTTPException(404, "Tenant not found")
    q = db.query(Post).filter_by(tenant_id=tenant.id, is_published=True)
    if type:
        q = q.filter(Post.post_type == type)
    q = q.order_by(Post.published_at.desc(), Post.created_at.desc())
    return q.offset((page - 1) * limit).limit(limit).all()


@router.get("/posts/{slug}", response_model=_PostResponse)
def get_public_post(
    slug: str,
    tenant_slug: str = Query(...),
    db: Session = Depends(get_db),
):
    tenant = db.query(Tenant).filter_by(slug=tenant_slug, is_active=True).first()
    if not tenant:
        raise HTTPException(404, "Tenant not found")
    post = db.query(Post).filter_by(tenant_id=tenant.id, slug=slug, is_published=True).first()
    if not post:
        raise HTTPException(404, "Post not found")
    return post


# ── Tenant Config ─────────────────────────────────────────────────────────────

@router.get("/tenant-config", response_model=PublicTenantConfigResponse)
def get_tenant_config(
    tenant_slug: str = Query(...),
    db: Session = Depends(get_db),
):
    tenant = db.query(Tenant).filter_by(slug=tenant_slug, is_active=True).first()
    if not tenant:
        raise HTTPException(404, "Tenant not found")
    return tenant


# ── Testimonials ──────────────────────────────────────────────────────────────

@router.get("/testimonials", response_model=list[PublicTestimonialResponse])
def list_public_testimonials(
    tenant_slug: str = Query(...),
    db: Session = Depends(get_db),
):
    tenant = db.query(Tenant).filter_by(slug=tenant_slug, is_active=True).first()
    if not tenant:
        raise HTTPException(404, "Tenant not found")
    return (
        db.query(Testimonial)
        .filter_by(tenant_id=tenant.id, is_active=True)
        .order_by(Testimonial.sort_order)
        .all()
    )


# ── Hero Slides ───────────────────────────────────────────────────────────────

@router.get("/hero-slides", response_model=list[PublicHeroSlideResponse])
def list_public_hero_slides(
    tenant_slug: str = Query(...),
    db: Session = Depends(get_db),
):
    tenant = db.query(Tenant).filter_by(slug=tenant_slug, is_active=True).first()
    if not tenant:
        raise HTTPException(404, "Tenant not found")
    return (
        db.query(HeroSlide)
        .filter_by(tenant_id=tenant.id, is_active=True)
        .order_by(HeroSlide.sort_order)
        .all()
    )
