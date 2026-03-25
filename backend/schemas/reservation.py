from pydantic import BaseModel
from typing import Optional
from datetime import date
from decimal import Decimal
from models.reservation import ReservationStatus, ReservationSource
from schemas.guest import GuestResponse
from schemas.room import RoomResponse, RoomTypeResponse


class ReservationCreate(BaseModel):
    guest_id: int
    room_type_id: int
    check_in_date: date
    check_out_date: date
    adults: int = 1
    children: int = 0
    rate_per_night: Decimal
    source: ReservationSource = ReservationSource.DIRECT
    notes: Optional[str] = None


class ReservationUpdate(BaseModel):
    check_in_date: Optional[date] = None
    check_out_date: Optional[date] = None
    adults: Optional[int] = None
    children: Optional[int] = None
    rate_per_night: Optional[Decimal] = None
    notes: Optional[str] = None


class CheckInRequest(BaseModel):
    room_id: int
    force_room_type: bool = False  # override room type mismatch


class CheckOutRequest(BaseModel):
    force: bool = False  # allow checkout with outstanding balance


class ReservationResponse(BaseModel):
    id: int
    guest_id: int
    room_type_id: int
    room_id: Optional[int]
    check_in_date: date
    check_out_date: date
    adults: int
    children: int
    rate_per_night: Decimal
    status: ReservationStatus
    source: ReservationSource
    notes: Optional[str]
    model_config = {"from_attributes": True}


class ReservationDetailResponse(ReservationResponse):
    guest: Optional[GuestResponse] = None
    room_type: Optional[RoomTypeResponse] = None
    room: Optional[RoomResponse] = None
    folio_id: Optional[int] = None

    @classmethod
    def from_orm_with_folio(cls, r):
        data = cls.model_validate(r)
        data.folio_id = r.folio.id if r.folio else None
        return data
