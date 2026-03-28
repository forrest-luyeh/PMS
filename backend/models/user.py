import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum as SAEnum
from database import Base


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    TENANT_ADMIN = "TENANT_ADMIN"
    BRAND_ADMIN = "BRAND_ADMIN"
    ADMIN = "ADMIN"
    FRONT_DESK = "FRONT_DESK"
    HOUSEKEEPING = "HOUSEKEEPING"
    MANAGER = "MANAGER"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.FRONT_DESK)
    is_active = Column(Boolean, default=True)
    hotel_id = Column(Integer, nullable=True)   # NULL = SUPER_ADMIN / TENANT_ADMIN / BRAND_ADMIN
    brand_id = Column(Integer, nullable=True)
    tenant_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class RefreshTokenBlacklist(Base):
    __tablename__ = "refresh_token_blacklist"
    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
