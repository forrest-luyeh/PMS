from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from core.deps import get_db, get_current_user, require_role, get_hotel_context
from models.room import Room, RoomType, RoomStatus, RoomTypeImage, RoomTypeAmenity
from models.reservation import Reservation, ReservationStatus
from models.tenant import Hotel
from schemas.room import (RoomCreate, RoomUpdate, RoomStatusUpdate, RoomResponse,
                          RoomTypeCreate, RoomTypeUpdate, RoomTypeResponse, AvailabilityResponse,
                          RoomTypeImageCreate, RoomTypeImageResponse,
                          RoomTypeAmenityCreate, RoomTypeAmenityResponse)

router = APIRouter(tags=["rooms"])

# Valid transitions from each status
VALID_TRANSITIONS = {
    RoomStatus.AVAILABLE:    {RoomStatus.RESERVED, RoomStatus.OCCUPIED, RoomStatus.OUT_OF_ORDER},
    RoomStatus.RESERVED:     {RoomStatus.OCCUPIED, RoomStatus.AVAILABLE, RoomStatus.OUT_OF_ORDER},
    RoomStatus.OCCUPIED:     {RoomStatus.DIRTY, RoomStatus.OUT_OF_ORDER},
    RoomStatus.DIRTY:        {RoomStatus.AVAILABLE, RoomStatus.OUT_OF_ORDER},
    RoomStatus.OUT_OF_ORDER: {RoomStatus.AVAILABLE},
}

# --- Room Types ---

@router.get("/room-types", response_model=list[RoomTypeResponse])
def list_room_types(db: Session = Depends(get_db), hotel: Hotel = Depends(get_hotel_context)):
    return db.query(RoomType).filter_by(hotel_id=hotel.id).all()

@router.post("/room-types", response_model=RoomTypeResponse, status_code=201)
def create_room_type(body: RoomTypeCreate, db: Session = Depends(get_db),
                     hotel: Hotel = Depends(get_hotel_context),
                     _=Depends(require_role("ADMIN"))):
    rt = RoomType(**body.model_dump(), hotel_id=hotel.id)
    db.add(rt); db.commit(); db.refresh(rt)
    return rt

@router.get("/room-types/{rt_id}", response_model=RoomTypeResponse)
def get_room_type(rt_id: int, db: Session = Depends(get_db), hotel: Hotel = Depends(get_hotel_context)):
    rt = db.query(RoomType).filter_by(id=rt_id, hotel_id=hotel.id).first()
    if not rt: raise HTTPException(404, "Room type not found")
    return rt

@router.put("/room-types/{rt_id}", response_model=RoomTypeResponse)
def update_room_type(rt_id: int, body: RoomTypeUpdate, db: Session = Depends(get_db),
                     hotel: Hotel = Depends(get_hotel_context),
                     _=Depends(require_role("ADMIN"))):
    rt = db.query(RoomType).filter_by(id=rt_id, hotel_id=hotel.id).first()
    if not rt: raise HTTPException(404, "Room type not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(rt, k, v)
    db.commit(); db.refresh(rt)
    return rt

@router.delete("/room-types/{rt_id}", status_code=204)
def delete_room_type(rt_id: int, db: Session = Depends(get_db),
                     hotel: Hotel = Depends(get_hotel_context),
                     _=Depends(require_role("ADMIN"))):
    rt = db.query(RoomType).filter_by(id=rt_id, hotel_id=hotel.id).first()
    if not rt: raise HTTPException(404, "Room type not found")
    db.delete(rt); db.commit()

# --- Rooms ---

@router.get("/rooms", response_model=list[RoomResponse])
def list_rooms(status: str = None, db: Session = Depends(get_db), hotel: Hotel = Depends(get_hotel_context)):
    q = db.query(Room).filter_by(hotel_id=hotel.id)
    if status:
        q = q.filter(Room.status == status)
    return q.order_by(Room.floor, Room.number).all()

@router.post("/rooms", response_model=RoomResponse, status_code=201)
def create_room(body: RoomCreate, db: Session = Depends(get_db),
                hotel: Hotel = Depends(get_hotel_context),
                _=Depends(require_role("ADMIN"))):
    if db.query(Room).filter_by(number=body.number, hotel_id=hotel.id).first():
        raise HTTPException(409, "Room number already exists")
    room = Room(**body.model_dump(), hotel_id=hotel.id)
    db.add(room); db.commit(); db.refresh(room)
    return room

@router.get("/rooms/availability", response_model=list[AvailabilityResponse])
def check_availability(check_in: date, check_out: date,
                       db: Session = Depends(get_db), hotel: Hotel = Depends(get_hotel_context)):
    if check_out <= check_in:
        raise HTTPException(400, "check_out must be after check_in")
    # Rooms blocked by overlapping active reservations
    blocked = (
        db.query(Reservation.room_id)
        .filter(
            Reservation.hotel_id == hotel.id,
            Reservation.room_id.isnot(None),
            Reservation.status.in_([ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN]),
            Reservation.check_in_date < check_out,
            Reservation.check_out_date > check_in,
        )
        .subquery()
    )
    result = []
    for rt in db.query(RoomType).filter_by(hotel_id=hotel.id).all():
        available = (
            db.query(Room)
            .filter(Room.room_type_id == rt.id, Room.hotel_id == hotel.id,
                    Room.status == RoomStatus.AVAILABLE, Room.id.notin_(blocked))
            .count()
        )
        result.append(AvailabilityResponse(
            room_type_id=rt.id, room_type_name=rt.name,
            available_count=available, base_rate=rt.base_rate,
        ))
    return result

@router.get("/rooms/{room_id}", response_model=RoomResponse)
def get_room(room_id: int, db: Session = Depends(get_db), hotel: Hotel = Depends(get_hotel_context)):
    room = db.query(Room).filter_by(id=room_id, hotel_id=hotel.id).first()
    if not room: raise HTTPException(404, "Room not found")
    return room

@router.put("/rooms/{room_id}", response_model=RoomResponse)
def update_room(room_id: int, body: RoomUpdate, db: Session = Depends(get_db),
                hotel: Hotel = Depends(get_hotel_context),
                _=Depends(require_role("ADMIN"))):
    room = db.query(Room).filter_by(id=room_id, hotel_id=hotel.id).first()
    if not room: raise HTTPException(404, "Room not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(room, k, v)
    db.commit(); db.refresh(room)
    return room

@router.patch("/rooms/{room_id}/status", response_model=RoomResponse)
def update_room_status(room_id: int, body: RoomStatusUpdate,
                       db: Session = Depends(get_db),
                       hotel: Hotel = Depends(get_hotel_context),
                       current_user=Depends(get_current_user)):
    room = db.query(Room).filter_by(id=room_id, hotel_id=hotel.id).first()
    if not room: raise HTTPException(404, "Room not found")
    # Role check: Housekeeping can only DIRTY→AVAILABLE; Admin/FrontDesk can do more
    if current_user.role.value == "HOUSEKEEPING" and body.status not in (RoomStatus.AVAILABLE,):
        raise HTTPException(403, "Housekeeping can only mark rooms as AVAILABLE")
    if body.status not in VALID_TRANSITIONS.get(room.status, set()):
        raise HTTPException(409, f"Cannot transition from {room.status} to {body.status}")
    room.status = body.status
    if body.notes:
        room.notes = body.notes
    db.commit(); db.refresh(room)
    return room


@router.delete("/rooms/{room_id}", status_code=204)
def delete_room(room_id: int, db: Session = Depends(get_db),
                hotel: Hotel = Depends(get_hotel_context)):
    room = db.query(Room).filter_by(id=room_id, hotel_id=hotel.id).first()
    if not room: raise HTTPException(404, "Room not found")
    if room.status not in (RoomStatus.AVAILABLE, RoomStatus.OUT_OF_ORDER):
        raise HTTPException(409, "Cannot delete room that is occupied or reserved")
    db.delete(room); db.commit()


# ---- RoomType Images ----

def _get_rt(db, rt_id, hotel):
    rt = db.query(RoomType).filter_by(id=rt_id, hotel_id=hotel.id).first()
    if not rt: raise HTTPException(404, "Room type not found")
    return rt


@router.get("/room-types/{rt_id}/images", response_model=list[RoomTypeImageResponse])
def list_rt_images(rt_id: int, db: Session = Depends(get_db),
                   hotel: Hotel = Depends(get_hotel_context)):
    _get_rt(db, rt_id, hotel)
    return db.query(RoomTypeImage).filter_by(room_type_id=rt_id).order_by(RoomTypeImage.sort_order).all()


@router.post("/room-types/{rt_id}/images", response_model=RoomTypeImageResponse, status_code=201)
def add_rt_image(rt_id: int, body: RoomTypeImageCreate, db: Session = Depends(get_db),
                 hotel: Hotel = Depends(get_hotel_context)):
    _get_rt(db, rt_id, hotel)
    img = RoomTypeImage(room_type_id=rt_id, **body.model_dump())
    db.add(img); db.commit(); db.refresh(img)
    return img


@router.delete("/room-types/{rt_id}/images/{img_id}", status_code=204)
def delete_rt_image(rt_id: int, img_id: int, db: Session = Depends(get_db),
                    hotel: Hotel = Depends(get_hotel_context)):
    _get_rt(db, rt_id, hotel)
    img = db.query(RoomTypeImage).filter_by(id=img_id, room_type_id=rt_id).first()
    if not img: raise HTTPException(404, "Image not found")
    db.delete(img); db.commit()


# ---- RoomType Amenities ----

@router.get("/room-types/{rt_id}/amenities", response_model=list[RoomTypeAmenityResponse])
def list_rt_amenities(rt_id: int, db: Session = Depends(get_db),
                      hotel: Hotel = Depends(get_hotel_context)):
    _get_rt(db, rt_id, hotel)
    return db.query(RoomTypeAmenity).filter_by(room_type_id=rt_id).all()


@router.post("/room-types/{rt_id}/amenities", response_model=RoomTypeAmenityResponse, status_code=201)
def add_rt_amenity(rt_id: int, body: RoomTypeAmenityCreate, db: Session = Depends(get_db),
                   hotel: Hotel = Depends(get_hotel_context)):
    _get_rt(db, rt_id, hotel)
    a = RoomTypeAmenity(room_type_id=rt_id, **body.model_dump())
    db.add(a); db.commit(); db.refresh(a)
    return a


@router.delete("/room-types/{rt_id}/amenities/{amenity_id}", status_code=204)
def delete_rt_amenity(rt_id: int, amenity_id: int, db: Session = Depends(get_db),
                      hotel: Hotel = Depends(get_hotel_context)):
    _get_rt(db, rt_id, hotel)
    a = db.query(RoomTypeAmenity).filter_by(id=amenity_id, room_type_id=rt_id).first()
    if not a: raise HTTPException(404, "Amenity not found")
    db.delete(a); db.commit()
