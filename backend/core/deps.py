from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.orm import Session
from database import SessionLocal
from core.security import decode_token
from models.user import User, UserRole
from models.tenant import Hotel

bearer_scheme = HTTPBearer()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    exc = HTTPException(status_code=401, detail="Could not validate credentials",
                        headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("type") != "access":
            raise exc
        user_id = payload.get("sub")
        if user_id is None:
            raise exc
    except JWTError:
        raise exc
    user = db.get(User, int(user_id))
    if not user or not user.is_active:
        raise exc
    # Sync token claims back onto the user object so routers can read them
    user._token_hotel_id = payload.get("hotel_id")
    user._token_brand_id = payload.get("brand_id")
    user._token_tenant_id = payload.get("tenant_id")
    return user


def require_role(*roles: str):
    """Allow access if user has one of the given roles, or is SUPER_ADMIN."""
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role == UserRole.SUPER_ADMIN:
            return current_user
        if current_user.role.value not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return checker


def get_tenant_context(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Resolve Tenant for upper-tier management APIs (TENANT_ADMIN+)."""
    from models.tenant import Tenant
    if current_user.role == UserRole.SUPER_ADMIN:
        # SUPER_ADMIN is not scoped to a tenant — callers handle this
        return None
    tenant_id = getattr(current_user, "_token_tenant_id", None) or current_user.tenant_id
    if tenant_id is None:
        raise HTTPException(status_code=403, detail="No tenant context in token")
    tenant = db.get(Tenant, tenant_id)
    if not tenant or not tenant.is_active:
        raise HTTPException(status_code=404, detail="Tenant not found or inactive")
    return tenant


def get_brand_context(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Resolve Brand for brand-level management APIs (BRAND_ADMIN+)."""
    from models.tenant import Brand
    if current_user.role == UserRole.SUPER_ADMIN:
        return None
    brand_id = getattr(current_user, "_token_brand_id", None) or current_user.brand_id
    if brand_id is None:
        raise HTTPException(status_code=403, detail="No brand context in token")
    brand = db.get(Brand, brand_id)
    if not brand or not brand.is_active:
        raise HTTPException(status_code=404, detail="Brand not found or inactive")
    return brand


def get_hotel_context(
    current_user: User = Depends(get_current_user),
    x_hotel_id: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> Hotel:
    """Resolve the Hotel the request operates on.

    - SUPER_ADMIN may pass X-Hotel-Id header to target any hotel.
    - Others use the hotel_id embedded in their JWT token.
    """
    if current_user.role == UserRole.SUPER_ADMIN and x_hotel_id:
        hotel_id = int(x_hotel_id)
    else:
        hotel_id = getattr(current_user, "_token_hotel_id", None) or current_user.hotel_id
        if hotel_id is None:
            raise HTTPException(status_code=403, detail="No hotel context in token")

    hotel = db.get(Hotel, hotel_id)
    if not hotel or not hotel.is_active:
        raise HTTPException(status_code=404, detail="Hotel not found or inactive")
    return hotel
