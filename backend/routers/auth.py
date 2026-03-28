from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from jose import JWTError
from sqlalchemy.orm import Session
from core.deps import get_db, get_current_user, require_role
from core.security import verify_password, hash_password, create_access_token, create_refresh_token, decode_token
from models.user import User, RefreshTokenBlacklist
from schemas.auth import LoginRequest, TokenResponse, UserCreate, UserUpdate, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])
REFRESH_COOKIE = "refresh_token"


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(email=body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    at = create_access_token(str(user.id), user.role.value,
                             hotel_id=user.hotel_id, brand_id=user.brand_id, tenant_id=user.tenant_id)
    rt, exp = create_refresh_token(str(user.id))
    response.set_cookie(key=REFRESH_COOKIE, value=rt, httponly=True, samesite="lax", expires=exp)
    return TokenResponse(access_token=at)


@router.post("/refresh", response_model=TokenResponse)
def refresh(response: Response, refresh_token: str = Cookie(None, alias=REFRESH_COOKIE), db: Session = Depends(get_db)):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")
    if db.query(RefreshTokenBlacklist).filter_by(token=refresh_token).first():
        raise HTTPException(status_code=401, detail="Token revoked")
    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id = payload["sub"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.get(User, int(user_id))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    db.add(RefreshTokenBlacklist(token=refresh_token, expires_at=datetime.fromtimestamp(payload["exp"], tz=timezone.utc)))
    new_at = create_access_token(str(user.id), user.role.value,
                                 hotel_id=user.hotel_id, brand_id=user.brand_id, tenant_id=user.tenant_id)
    new_rt, exp = create_refresh_token(str(user.id))
    response.set_cookie(key=REFRESH_COOKIE, value=new_rt, httponly=True, samesite="lax", expires=exp)
    db.commit()
    return TokenResponse(access_token=new_at)


@router.post("/logout")
def logout(response: Response, refresh_token: str = Cookie(None, alias=REFRESH_COOKIE),
           db: Session = Depends(get_db), _=Depends(get_current_user)):
    if refresh_token:
        try:
            payload = decode_token(refresh_token)
            db.add(RefreshTokenBlacklist(token=refresh_token, expires_at=datetime.fromtimestamp(payload["exp"], tz=timezone.utc)))
            db.commit()
        except JWTError:
            pass
    response.delete_cookie(REFRESH_COOKIE)
    return {"message": "Logged out"}


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/users", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(require_role("ADMIN", "TENANT_ADMIN", "BRAND_ADMIN"))):
    q = db.query(User)
    if current_user.role.value == "TENANT_ADMIN":
        hotel_id = getattr(current_user, "_token_hotel_id", None) or current_user.hotel_id
        q = q.filter_by(hotel_id=hotel_id)
    elif current_user.role.value == "BRAND_ADMIN":
        q = q.filter_by(brand_id=current_user.brand_id)
    return q.all()


@router.post("/users", response_model=UserResponse, status_code=201)
def create_user(body: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role("ADMIN", "TENANT_ADMIN", "BRAND_ADMIN"))):
    if db.query(User).filter_by(email=body.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    hotel_id = getattr(current_user, "_token_hotel_id", None) or current_user.hotel_id
    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        name=body.name,
        role=body.role,
        hotel_id=hotel_id,
        brand_id=current_user.brand_id,
        tenant_id=current_user.tenant_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, body: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role("ADMIN", "TENANT_ADMIN", "BRAND_ADMIN"))):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if current_user.role.value == "TENANT_ADMIN":
        hotel_id = getattr(current_user, "_token_hotel_id", None) or current_user.hotel_id
        if user.hotel_id != hotel_id:
            raise HTTPException(status_code=403, detail="Cannot modify user from another hotel")
    for k, v in body.model_dump(exclude_none=True).items():
        if k == "password":
            user.hashed_password = hash_password(v)
        else:
            setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return user
