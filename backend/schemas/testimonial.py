from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TestimonialCreate(BaseModel):
    author_name: str
    author_tag: Optional[str] = None
    quote: str
    sort_order: int = 0
    is_active: bool = True


class TestimonialUpdate(BaseModel):
    author_name: Optional[str] = None
    author_tag: Optional[str] = None
    quote: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class TestimonialResponse(BaseModel):
    id: int
    tenant_id: int
    author_name: str
    author_tag: Optional[str] = None
    quote: str
    sort_order: int
    is_active: bool
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}
