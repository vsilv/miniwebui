from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
import time

from app.core.config import settings
from app.models.user import TokenData, User, UserInDB
from app.db.meilisearch import get_meilisearch_client

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_user(email: str):
    client = await get_meilisearch_client()
    result = await client.index(settings.USER_INDEX).search(email, attributes_to_search_on=["email"], limit=1)
    
    hits = result.hits
    if not hits:
        return None
    
    user_data = hits[0]
    return UserInDB(**user_data)

async def authenticate_user(email: str, password: str):
    user = await get_user(email)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    current_timestamp = int(time.time())  # Temps actuel en secondes

    if expires_delta:
        expire = current_timestamp + int(expires_delta.total_seconds())
    else:
        expire = current_timestamp + settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id)
    except JWTError:
        raise credentials_exception
    
    client = await get_meilisearch_client()
    result = await client.index(settings.USER_INDEX).search(filter=f"id = '{token_data.user_id}'", limit=1)
    
    hits = result.hits
    if not hits:
        raise credentials_exception
    
    user_data = hits[0]
    user = User(**user_data)
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
