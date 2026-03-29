from pydantic import BaseModel, EmailStr
from typing import Optional, List
from decimal import Decimal
from datetime import date


# ── Hotel / Room ──────────────────────────────────────────────────────────────

class PublicImageResponse(BaseModel):
    url: str
    alt_text: Optional[str] = None
    sort_order: int = 0
    model_config = {"from_attributes": True}


class PublicAmenityResponse(BaseModel):
    name: str
    category: Optional[str] = None
    model_config = {"from_attributes": True}


class PublicHotelResponse(BaseModel):
    id: int
    slug: str
    name: str
    brand_name: str
    brand_slug: str
    region: Optional[str]
    address: Optional[str]
    phone: Optional[str]
    check_in_time: Optional[str]
    check_out_time: Optional[str]
    description: Optional[str] = None
    is_featured: bool = False
    images: List[PublicImageResponse] = []
    amenities: List[PublicAmenityResponse] = []
    model_config = {"from_attributes": True}


class PublicTestimonialResponse(BaseModel):
    id: int
    author_name: str
    author_tag: Optional[str] = None
    quote: str
    sort_order: int
    model_config = {"from_attributes": True}


class PublicHeroSlideResponse(BaseModel):
    id: int
    image_url: str
    label: Optional[str] = None
    headline: str
    subline: Optional[str] = None
    link_url: Optional[str] = None
    link_label: Optional[str] = None
    sort_order: int
    model_config = {"from_attributes": True}


class PublicTenantConfigResponse(BaseModel):
    name: str
    slug: str
    contact_phone: Optional[str] = None
    social_instagram: Optional[str] = None
    social_facebook: Optional[str] = None
    social_line: Optional[str] = None
    model_config = {"from_attributes": True}


class PublicRoomTypeResponse(BaseModel):
    id: int
    name: str
    room_code: Optional[str]
    bed_type: Optional[str]
    max_occupancy: int
    base_rate: Decimal
    description: Optional[str]
    has_window: Optional[bool]
    images: List[PublicImageResponse] = []
    amenities: List[PublicAmenityResponse] = []
    model_config = {"from_attributes": True}


class PublicAvailabilityResponse(BaseModel):
    room_type_id: int
    room_type_name: str
    available_count: int
    base_rate: Decimal
    nights: int
    total_price: Decimal


# ── Booking ───────────────────────────────────────────────────────────────────

class PublicBookingCreate(BaseModel):
    hotel_slug: str
    room_type_id: int
    check_in_date: date
    check_out_date: date
    adults: int = 1
    children: int = 0
    guest_name: str
    guest_phone: str
    guest_email: str
    guest_id_type: str = "ID_CARD"
    notes: Optional[str] = None


class PublicBookingResponse(BaseModel):
    confirmation_code: str
    hotel_name: str
    room_type_name: str
    check_in_date: date
    check_out_date: date
    adults: int
    children: int
    total_amount: Decimal


class PublicBookingDetail(BaseModel):
    confirmation_code: str
    hotel_name: str
    hotel_slug: str
    room_type_name: str
    check_in_date: date
    check_out_date: date
    adults: int
    children: int
    status: str
    total_amount: Decimal
    guest_name: str
    guest_email: str
    notes: Optional[str]


class PublicCancelRequest(BaseModel):
    email: str
