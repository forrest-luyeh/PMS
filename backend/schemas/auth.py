from pydantic import BaseModel
from typing import Optional
from models.user import UserRole


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: UserRole = UserRole.FRONT_DESK
    hotel_id: Optional[int] = None
    brand_id: Optional[int] = None
    tenant_id: Optional[int] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: UserRole
    is_active: bool
    hotel_id: Optional[int] = None
    brand_id: Optional[int] = None
    tenant_id: Optional[int] = None
    model_config = {"from_attributes": True}
