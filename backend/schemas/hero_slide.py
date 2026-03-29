from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class HeroSlideCreate(BaseModel):
    image_url: str
    label: Optional[str] = None
    headline: str
    subline: Optional[str] = None
    link_url: Optional[str] = None
    link_label: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True


class HeroSlideUpdate(BaseModel):
    image_url: Optional[str] = None
    label: Optional[str] = None
    headline: Optional[str] = None
    subline: Optional[str] = None
    link_url: Optional[str] = None
    link_label: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class HeroSlideResponse(BaseModel):
    id: int
    tenant_id: int
    image_url: str
    label: Optional[str] = None
    headline: str
    subline: Optional[str] = None
    link_url: Optional[str] = None
    link_label: Optional[str] = None
    sort_order: int
    is_active: bool
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}
