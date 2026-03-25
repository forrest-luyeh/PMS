from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.deps import get_db, get_current_user, require_role
from models.guest import Guest
from schemas.guest import GuestCreate, GuestUpdate, GuestResponse
from schemas.reservation import ReservationResponse

router = APIRouter(prefix="/guests", tags=["guests"])


@router.get("", response_model=dict)
def list_guests(page: int = 1, limit: int = 20, search: str = None,
                db: Session = Depends(get_db), _=Depends(get_current_user)):
    q = db.query(Guest)
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
def create_guest(body: GuestCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    if body.id_number and db.query(Guest).filter_by(id_number=body.id_number).first():
        raise HTTPException(409, "ID number already registered")
    guest = Guest(**body.model_dump())
    db.add(guest); db.commit(); db.refresh(guest)
    return guest


@router.get("/{guest_id}", response_model=dict)
def get_guest(guest_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    guest = db.get(Guest, guest_id)
    if not guest: raise HTTPException(404, "Guest not found")
    return {
        **GuestResponse.model_validate(guest).model_dump(),
        "reservations": [ReservationResponse.model_validate(r) for r in guest.reservations],
    }


@router.put("/{guest_id}", response_model=GuestResponse)
def update_guest(guest_id: int, body: GuestUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    guest = db.get(Guest, guest_id)
    if not guest: raise HTTPException(404, "Guest not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(guest, k, v)
    db.commit(); db.refresh(guest)
    return guest
