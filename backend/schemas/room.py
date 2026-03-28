from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
from models.room import RoomStatus


class RoomTypeImageCreate(BaseModel):
    url: str
    alt_text: Optional[str] = None
    sort_order: int = 0


class RoomTypeImageResponse(BaseModel):
    id: int
    url: str
    alt_text: Optional[str]
    sort_order: int
    model_config = {"from_attributes": True}


class RoomTypeAmenityCreate(BaseModel):
    name: str
    category: Optional[str] = None


class RoomTypeAmenityResponse(BaseModel):
    id: int
    name: str
    category: Optional[str]
    model_config = {"from_attributes": True}


class RoomTypeCreate(BaseModel):
    name: str
    description: Optional[str] = None
    base_rate: Decimal
    max_occupancy: int = 2
    room_code: Optional[str] = None
    bed_type: Optional[str] = None
    has_window: bool = True
    size_sqm: Optional[Decimal] = None


class RoomTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    base_rate: Optional[Decimal] = None
    max_occupancy: Optional[int] = None
    room_code: Optional[str] = None
    bed_type: Optional[str] = None
    has_window: Optional[bool] = None
    size_sqm: Optional[Decimal] = None


class RoomTypeResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    base_rate: Decimal
    max_occupancy: int
    room_code: Optional[str] = None
    bed_type: Optional[str] = None
    has_window: Optional[bool] = None
    size_sqm: Optional[Decimal] = None
    images: List[RoomTypeImageResponse] = []
    amenities: List[RoomTypeAmenityResponse] = []
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
