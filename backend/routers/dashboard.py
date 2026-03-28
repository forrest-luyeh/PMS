from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from core.deps import get_db, get_current_user, get_hotel_context
from models.room import Room, RoomStatus
from models.reservation import Reservation, ReservationStatus
from models.folio import FolioItem, FolioItemType
from models.tenant import Hotel
from schemas.reservation import ReservationDetailResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/today")
def today_stats(db: Session = Depends(get_db), hotel: Hotel = Depends(get_hotel_context)):
    today = date.today()
    hid = hotel.id
    expected_arrivals = db.query(Reservation).filter_by(hotel_id=hid, check_in_date=today, status=ReservationStatus.CONFIRMED).count()
    expected_departures = db.query(Reservation).filter_by(hotel_id=hid, check_out_date=today, status=ReservationStatus.CHECKED_IN).count()
    actual_checkins = db.query(Reservation).filter(
        Reservation.hotel_id == hid,
        Reservation.check_in_date == today, Reservation.status == ReservationStatus.CHECKED_IN
    ).count()
    actual_checkouts = db.query(Reservation).filter(
        Reservation.hotel_id == hid,
        Reservation.check_out_date == today, Reservation.status == ReservationStatus.CHECKED_OUT
    ).count()
    total_units = db.query(Room).filter_by(hotel_id=hid).count()
    occupied = db.query(Room).filter_by(hotel_id=hid, status=RoomStatus.OCCUPIED).count()
    available = db.query(Room).filter_by(hotel_id=hid, status=RoomStatus.AVAILABLE).count()

    # Today's collected payments
    today_revenue = db.query(func.sum(FolioItem.amount)).join(
        FolioItem.folio
    ).filter(
        FolioItem.item_type == FolioItemType.PAYMENT,
        func.date(FolioItem.created_at) == today,
    ).scalar() or Decimal("0")

    return {
        "expected_arrivals": expected_arrivals,
        "expected_departures": expected_departures,
        "actual_checkins": actual_checkins,
        "actual_checkouts": actual_checkouts,
        "occupied_rooms": occupied,
        "available_rooms": available,
        "total_rooms": total_units,
        "occupancy_rate": round(occupied / total_units * 100, 1) if total_units else 0.0,
        "today_revenue": today_revenue,
    }


@router.get("/room-status")
def room_status_summary(db: Session = Depends(get_db), hotel: Hotel = Depends(get_hotel_context)):
    result = {}
    for status in RoomStatus:
        result[status.value] = db.query(Room).filter_by(hotel_id=hotel.id, status=status).count()
    return result


@router.get("/arrivals", response_model=list[ReservationDetailResponse])
def today_arrivals(db: Session = Depends(get_db), hotel: Hotel = Depends(get_hotel_context)):
    today = date.today()
    reservations = (
        db.query(Reservation)
        .filter(Reservation.hotel_id == hotel.id,
                Reservation.check_in_date == today, Reservation.status == ReservationStatus.CONFIRMED)
        .order_by(Reservation.created_at)
        .all()
    )
    return [ReservationDetailResponse.from_orm_with_folio(r) for r in reservations]


@router.get("/departures", response_model=list[ReservationDetailResponse])
def today_departures(db: Session = Depends(get_db), hotel: Hotel = Depends(get_hotel_context)):
    today = date.today()
    reservations = (
        db.query(Reservation)
        .filter(Reservation.hotel_id == hotel.id,
                Reservation.check_out_date == today, Reservation.status == ReservationStatus.CHECKED_IN)
        .order_by(Reservation.created_at)
        .all()
    )
    return [ReservationDetailResponse.from_orm_with_folio(r) for r in reservations]
