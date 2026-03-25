from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
from models.room import RoomStatus


class RoomTypeCreate(BaseModel):
    name: str
    description: Optional[str] = None
    base_rate: Decimal
    max_occupancy: int = 2


class RoomTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    base_rate: Optional[Decimal] = None
    max_occupancy: Optional[int] = None


class RoomTypeResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    base_rate: Decimal
    max_occupancy: int
    model_config = {"from_attributes": True}


class RoomCreate(BaseModel):
    number: str
    floor: int
    room_type_id: int
    notes: Optional[str] = None


class RoomUpdate(BaseModel):
    number: Optional[str] = None
    floor: Optional[int] = None
    room_type_id: Optional[int] = None
    notes: Optional[str] = None


class RoomStatusUpdate(BaseModel):
    status: RoomStatus
    notes: Optional[str] = None


class RoomResponse(BaseModel):
    id: int
    number: str
    floor: int
    room_type_id: int
    room_type: Optional[RoomTypeResponse] = None
    status: RoomStatus
    notes: Optional[str]
    model_config = {"from_attributes": True}


class AvailabilityResponse(BaseModel):
    room_type_id: int
    room_type_name: str
    available_count: int
    base_rate: Decimal
