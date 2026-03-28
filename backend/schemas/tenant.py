from pydantic import BaseModel, EmailStr
from typing import Optional, List


class HotelImageCreate(BaseModel):
    url: str
    alt_text: Optional[str] = None
    sort_order: int = 0


class HotelImageResponse(BaseModel):
    id: int
    url: str
    alt_text: Optional[str]
    sort_order: int
    model_config = {"from_attributes": True}


class HotelAmenityCreate(BaseModel):
    name: str
    category: Optional[str] = None


class HotelAmenityResponse(BaseModel):
    id: int
    name: str
    category: Optional[str]
    model_config = {"from_attributes": True}


class TenantCreate(BaseModel):
    name: str
    slug: str
    contact_email: str


class TenantResponse(BaseModel):
    id: int
    name: str
    slug: str
    contact_email: str
    is_active: bool
    model_config = {"from_attributes": True}


class BrandCreate(BaseModel):
    name: str
    slug: str
    tenant_id: int


class BrandUpdate(BaseModel):
    name: str


class BrandResponse(BaseModel):
    id: int
    tenant_id: int
    name: str
    slug: str
    is_active: bool
    model_config = {"from_attributes": True}


class HotelCreate(BaseModel):
    name: str
    slug: str
    address: str = ""
    brand_id: int
    tenant_id: int
    phone: str = ""
    region: str = ""
    check_in_time: str = "15:00"
    check_out_time: str = "11:00"


class HotelUpdate(BaseModel):
    name: str
    address: str = ""
    phone: str = ""
    region: str = ""
    license_number: str = ""
    check_in_time: str = "15:00"
    check_out_time: str = "11:00"


class HotelResponse(BaseModel):
    id: int
    brand_id: int
    tenant_id: int
    name: str
    slug: str
    address: str
    phone: str | None = None
    region: str | None = None
    license_number: str | None = None
    check_in_time: str | None = None
    check_out_time: str | None = None
    is_active: bool
    images: List[HotelImageResponse] = []
    amenities: List[HotelAmenityResponse] = []
    model_config = {"from_attributes": True}


class HotelBrief(BaseModel):
    id: int
    name: str
    slug: str
    address: str
    region: str | None = None
    is_active: bool
    model_config = {"from_attributes": True}


class BrandWithHotels(BaseModel):
    id: int
    name: str
    slug: str
    is_active: bool
    hotels: list[HotelBrief] = []
    model_config = {"from_attributes": True}


class TenantTree(BaseModel):
    id: int
    name: str
    slug: str
    contact_email: str
    is_active: bool
    brands: list[BrandWithHotels] = []
    model_config = {"from_attributes": True}


class RegisterRequest(BaseModel):
    """One-shot registration: creates Tenant + Brand + Hotel + TENANT_ADMIN user."""
    # Tenant
    tenant_name: str
    tenant_slug: str
    contact_email: str
    # Hotel
    hotel_name: str
    hotel_slug: str
    hotel_address: str = ""
    # Admin user
    admin_email: str
    admin_password: str
    admin_name: str
