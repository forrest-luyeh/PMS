from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.orm import Session
from database import SessionLocal
from core.security import decode_token
from models.user import User

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
    return user


def require_role(*roles: str):
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.value not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return checker
