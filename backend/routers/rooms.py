from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from core.deps import get_db, get_current_user, require_role
from models.room import Room, RoomType, RoomStatus
from models.reservation import Reservation, ReservationStatus
from schemas.room import (RoomCreate, RoomUpdate, RoomStatusUpdate, RoomResponse,
                          RoomTypeCreate, RoomTypeUpdate, RoomTypeResponse, AvailabilityResponse)

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
def list_room_types(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(RoomType).all()

@router.post("/room-types", response_model=RoomTypeResponse, status_code=201)
def create_room_type(body: RoomTypeCreate, db: Session = Depends(get_db), _=Depends(require_role("ADMIN"))):
    rt = RoomType(**body.model_dump())
    db.add(rt); db.commit(); db.refresh(rt)
    return rt

@router.get("/room-types/{rt_id}", response_model=RoomTypeResponse)
def get_room_type(rt_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    rt = db.get(RoomType, rt_id)
    if not rt: raise HTTPException(404, "Room type not found")
    return rt

@router.put("/room-types/{rt_id}", response_model=RoomTypeResponse)
def update_room_type(rt_id: int, body: RoomTypeUpdate, db: Session = Depends(get_db), _=Depends(require_role("ADMIN"))):
    rt = db.get(RoomType, rt_id)
    if not rt: raise HTTPException(404, "Room type not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(rt, k, v)
    db.commit(); db.refresh(rt)
    return rt

@router.delete("/room-types/{rt_id}", status_code=204)
def delete_room_type(rt_id: int, db: Session = Depends(get_db), _=Depends(require_role("ADMIN"))):
    rt = db.get(RoomType, rt_id)
    if not rt: raise HTTPException(404, "Room type not found")
    db.delete(rt); db.commit()

# --- Rooms ---

@router.get("/rooms", response_model=list[RoomResponse])
def list_rooms(status: str = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    q = db.query(Room)
    if status:
        q = q.filter(Room.status == status)
    return q.order_by(Room.floor, Room.number).all()

@router.post("/rooms", response_model=RoomResponse, status_code=201)
def create_room(body: RoomCreate, db: Session = Depends(get_db), _=Depends(require_role("ADMIN"))):
    if db.query(Room).filter_by(number=body.number).first():
        raise HTTPException(409, "Room number already exists")
    room = Room(**body.model_dump())
    db.add(room); db.commit(); db.refresh(room)
    return room

@router.get("/rooms/availability", response_model=list[AvailabilityResponse])
def check_availability(check_in: date, check_out: date, db: Session = Depends(get_db), _=Depends(get_current_user)):
    if check_out <= check_in:
        raise HTTPException(400, "check_out must be after check_in")
    # Rooms blocked by overlapping active reservations
    blocked = (
        db.query(Reservation.room_id)
        .filter(
            Reservation.room_id.isnot(None),
            Reservation.status.in_([ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN]),
            Reservation.check_in_date < check_out,
            Reservation.check_out_date > check_in,
        )
        .subquery()
    )
    result = []
    for rt in db.query(RoomType).all():
        available = (
            db.query(Room)
            .filter(Room.room_type_id == rt.id, Room.status == RoomStatus.AVAILABLE, Room.id.notin_(blocked))
            .count()
        )
        result.append(AvailabilityResponse(
            room_type_id=rt.id, room_type_name=rt.name,
            available_count=available, base_rate=rt.base_rate,
        ))
    return result

@router.get("/rooms/{room_id}", response_model=RoomResponse)
def get_room(room_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    room = db.get(Room, room_id)
    if not room: raise HTTPException(404, "Room not found")
    return room

@router.put("/rooms/{room_id}", response_model=RoomResponse)
def update_room(room_id: int, body: RoomUpdate, db: Session = Depends(get_db), _=Depends(require_role("ADMIN"))):
    room = db.get(Room, room_id)
    if not room: raise HTTPException(404, "Room not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(room, k, v)
    db.commit(); db.refresh(room)
    return room

@router.patch("/rooms/{room_id}/status", response_model=RoomResponse)
def update_room_status(room_id: int, body: RoomStatusUpdate, db: Session = Depends(get_db),
                       current_user=Depends(get_current_user)):
    room = db.get(Room, room_id)
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
