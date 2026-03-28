from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.deps import get_db, get_current_user, get_hotel_context
from models.guest import Guest
from models.tenant import Hotel
from schemas.guest import GuestCreate, GuestUpdate, GuestResponse
from schemas.reservation import ReservationResponse

router = APIRouter(prefix="/guests", tags=["guests"])


@router.get("", response_model=dict)
def list_guests(page: int = 1, limit: int = 20, search: str = None,
                db: Session = Depends(get_db), hotel: Hotel = Depends(get_hotel_context)):
    q = db.query(Guest).filter_by(hotel_id=hotel.id)
    if search:
        q = q.filter(
            Guest.name.contains(search) |
            Guest.phone.contains(search) |
            Guest.id_number.contains(search)
        )
    total = q.count()
    items = q.offset((page - 1) * limit).limit(limit).all()
    return {"items": [GuestResponse.model_validate(g) for g in items], "total": total, "page": page}


@router.post("", response_model=GuestResponse, status_code=201)
def create_guest(body: GuestCreate, db: Session = Depends(get_db), hotel: Hotel = Depends(get_hotel_context)):
    if body.id_number and db.query(Guest).filter_by(id_number=body.id_number, hotel_id=hotel.id).first():
        raise HTTPException(409, "ID number already registered")
    guest = Guest(**body.model_dump(), hotel_id=hotel.id)
    db.add(guest); db.commit(); db.refresh(guest)
    return guest


@router.get("/{guest_id}", response_model=dict)
def get_guest(guest_id: int, db: Session = Depends(get_db), hotel: Hotel = Depends(get_hotel_context)):
    guest = db.query(Guest).filter_by(id=guest_id, hotel_id=hotel.id).first()
    if not guest: raise HTTPException(404, "Guest not found")
    return {
        **GuestResponse.model_validate(guest).model_dump(),
        "reservations": [ReservationResponse.model_validate(r) for r in guest.reservations],
    }


@router.put("/{guest_id}", response_model=GuestResponse)
def update_guest(guest_id: int, body: GuestUpdate,
                 db: Session = Depends(get_db), hotel: Hotel = Depends(get_hotel_context)):
    guest = db.query(Guest).filter_by(id=guest_id, hotel_id=hotel.id).first()
    if not guest: raise HTTPException(404, "Guest not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(guest, k, v)
    db.commit(); db.refresh(guest)
    return guest
