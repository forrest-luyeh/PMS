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
    model_config = {"from_attributes": True}
