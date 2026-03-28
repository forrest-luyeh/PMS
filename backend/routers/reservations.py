from datetime import date, datetime, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.deps import get_db, get_current_user, get_hotel_context
from models.reservation import Reservation, ReservationStatus
from models.room import Room, RoomStatus
from models.folio import Folio, FolioItem, FolioStatus, FolioItemType
from models.tenant import Hotel
from schemas.reservation import (ReservationCreate, ReservationUpdate, ReservationResponse,
                                  ReservationDetailResponse, CheckInRequest, CheckOutRequest)

router = APIRouter(prefix="/reservations", tags=["reservations"])


def _calc_balance(folio) -> Decimal:
    balance = Decimal("0")
    for item in folio.items:
        if item.item_type == FolioItemType.PAYMENT:
            balance -= item.amount
        elif item.item_type == FolioItemType.DISCOUNT:
            balance -= item.amount
        else:
            balance += item.amount
    return balance


@router.get("", response_model=dict)
def list_reservations(
    page: int = 1, limit: int = 20,
    status: str = None, check_in_date: str = None, search: str = None,
    db: Session = Depends(get_db), hotel: Hotel = Depends(get_hotel_context)
):
    from models.guest import Guest
    q = db.query(Reservation).filter_by(hotel_id=hotel.id)
    if status:
        q = q.filter(Reservation.status == status)
    if check_in_date:
        d = date.today() if check_in_date == "today" else date.fromisoformat(check_in_date)
        q = q.filter(Reservation.check_in_date == d)
    if search:
        q = q.join(Guest).filter(Guest.name.contains(search))
    total = q.count()
    items = q.order_by(Reservation.check_in_date.desc()).offset((page - 1) * limit).limit(limit).all()
    return {"items": [ReservationDetailResponse.from_orm_with_folio(r) for r in items], "total": total}


@router.post("", response_model=ReservationResponse, status_code=201)
def create_reservation(body: ReservationCreate, db: Session = Depends(get_db),
                       hotel: Hotel = Depends(get_hotel_context)):
    if body.check_out_date <= body.check_in_date:
        raise HTTPException(400, "check_out_date must be after check_in_date")
    res = Reservation(**body.model_dump(), hotel_id=hotel.id)
    db.add(res); db.commit(); db.refresh(res)
    return res


@router.get("/{res_id}", response_model=ReservationDetailResponse)
def get_reservation(res_id: int, db: Session = Depends(get_db), hotel: Hotel = Depends(get_hotel_context)):
    res = db.query(Reservation).filter_by(id=res_id, hotel_id=hotel.id).first()
    if not res: raise HTTPException(404, "Reservation not found")
    return ReservationDetailResponse.from_orm_with_folio(res)


@router.put("/{res_id}", response_model=ReservationResponse)
def update_reservation(res_id: int, body: ReservationUpdate,
                       db: Session = Depends(get_db), hotel: Hotel = Depends(get_hotel_context)):
    res = db.query(Reservation).filter_by(id=res_id, hotel_id=hotel.id).first()
    if not res: raise HTTPException(404, "Reservation not found")
    if res.status != ReservationStatus.CONFIRMED:
        raise HTTPException(400, "Only CONFIRMED reservations can be modified")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(res, k, v)
    db.commit(); db.refresh(res)
    return res


@router.post("/{res_id}/cancel")
def cancel_reservation(res_id: int, db: Session = Depends(get_db), hotel: Hotel = Depends(get_hotel_context)):
    res = db.query(Reservation).filter_by(id=res_id, hotel_id=hotel.id).first()
    if not res: raise HTTPException(404, "Reservation not found")
    if res.status != ReservationStatus.CONFIRMED:
        raise HTTPException(400, "Only CONFIRMED reservations can be cancelled")
    res.status = ReservationStatus.CANCELLED
    if res.room_id:
        room = db.get(Room, res.room_id)
        if room and room.status == RoomStatus.RESERVED:
            room.status = RoomStatus.AVAILABLE
        res.room_id = None
    db.commit()
    return {"message": "Reservation cancelled"}


@router.post("/{res_id}/no-show")
def no_show(res_id: int, db: Session = Depends(get_db), hotel: Hotel = Depends(get_hotel_context)):
    res = db.query(Reservation).filter_by(id=res_id, hotel_id=hotel.id).first()
    if not res: raise HTTPException(404, "Reservation not found")
    if res.status != ReservationStatus.CONFIRMED:
        raise HTTPException(400, "Only CONFIRMED reservations can be marked no-show")
    res.status = ReservationStatus.NO_SHOW
    if res.room_id:
        room = db.get(Room, res.room_id)
        if room and room.status == RoomStatus.RESERVED:
            room.status = RoomStatus.AVAILABLE
        res.room_id = None
    db.commit()
    return {"message": "Marked as no-show"}


@router.post("/{res_id}/checkin")
def checkin(res_id: int, body: CheckInRequest,
            db: Session = Depends(get_db), hotel: Hotel = Depends(get_hotel_context)):
    res = db.query(Reservation).filter_by(id=res_id, hotel_id=hotel.id).first()
    if not res: raise HTTPException(404, "Reservation not found")
    if res.status != ReservationStatus.CONFIRMED:
        raise HTTPException(400, "Only CONFIRMED reservations can be checked in")

    room = db.query(Room).filter_by(id=body.room_id, hotel_id=hotel.id).first()
    if not room: raise HTTPException(404, "Room not found")
    if room.status != RoomStatus.AVAILABLE:
        raise HTTPException(409, f"Room is {room.status}, not AVAILABLE")
    if not body.force_room_type and room.room_type_id != res.room_type_id:
        raise HTTPException(400, "Room type mismatch. Use force_room_type=true to override")

    # Update reservation & room
    res.room_id = body.room_id
    res.status = ReservationStatus.CHECKED_IN
    room.status = RoomStatus.OCCUPIED

    # Create folio
    folio = Folio(reservation_id=res.id, hotel_id=hotel.id)
    db.add(folio); db.flush()

    # Auto-create ROOM_CHARGE items (one per night)
    nights = (res.check_out_date - res.check_in_date).days
    from datetime import timedelta
    for i in range(nights):
        night_date = res.check_in_date + timedelta(days=i)
        db.add(FolioItem(
            folio_id=folio.id,
            description=f"住房費 {night_date.isoformat()}",
            amount=res.rate_per_night,
            item_type=FolioItemType.ROOM_CHARGE,
        ))

    db.commit()
    return {"message": "Checked in", "folio_id": folio.id}


@router.post("/{res_id}/checkout")
def checkout(res_id: int, body: CheckOutRequest,
             db: Session = Depends(get_db), hotel: Hotel = Depends(get_hotel_context)):
    res = db.query(Reservation).filter_by(id=res_id, hotel_id=hotel.id).first()
    if not res: raise HTTPException(404, "Reservation not found")
    if res.status != ReservationStatus.CHECKED_IN:
        raise HTTPException(400, "Only CHECKED_IN reservations can be checked out")

    folio = res.folio
    if folio:
        balance = _calc_balance(folio)
        if balance > 0 and not body.force:
            raise HTTPException(402, f"Outstanding balance: {balance}. Use force=true to override")
        if balance > 0 and body.force:
            db.add(FolioItem(folio_id=folio.id, description="欠帳（強制退房）",
                             amount=Decimal("0"), item_type=FolioItemType.EXTRA_CHARGE))
        folio.status = FolioStatus.CLOSED

    res.status = ReservationStatus.CHECKED_OUT
    if res.room_id:
        room = db.get(Room, res.room_id)
        if room:
            room.status = RoomStatus.DIRTY

    db.commit()
    return {"message": "Checked out"}
