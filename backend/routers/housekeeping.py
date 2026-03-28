from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.deps import get_db, get_current_user, require_role, get_hotel_context
from models.room import Room, RoomStatus
from models.tenant import Hotel
from schemas.room import RoomResponse

router = APIRouter(prefix="/housekeeping", tags=["housekeeping"])


@router.get("/board", response_model=list[RoomResponse])
def housekeeping_board(db: Session = Depends(get_db), hotel: Hotel = Depends(get_hotel_context)):
    return (
        db.query(Room)
        .filter_by(hotel_id=hotel.id, status=RoomStatus.DIRTY)
        .order_by(Room.floor, Room.number)
        .all()
    )


@router.patch("/rooms/{room_id}")
def update_cleaning_status(
    room_id: int,
    notes: str = None,
    db: Session = Depends(get_db),
    hotel: Hotel = Depends(get_hotel_context),
    current_user=Depends(require_role("HOUSEKEEPING", "ADMIN")),
):
    room = db.query(Room).filter_by(id=room_id, hotel_id=hotel.id).first()
    if not room: raise HTTPException(404, "Room not found")
    if room.status != RoomStatus.DIRTY:
        raise HTTPException(400, f"Room is {room.status}, not DIRTY")
    room.status = RoomStatus.AVAILABLE
    if notes:
        room.notes = notes
    db.commit()
    return RoomResponse.model_validate(room)
