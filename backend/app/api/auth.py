from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
import time
from datetime import timedelta

from app.models.user import UserCreate, User, Token
from app.services.auth import (
    authenticate_user,
    create_access_token,
    get_password_hash,
    get_current_active_user,
)
from app.core.config import settings
from app.db.meilisearch import get_meilisearch_client
from datetime import datetime
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=User)
async def register_user(user_data: UserCreate):
    client = await get_meilisearch_client()

    # Vérifier si l'utilisateur existe déjà
    result = await client.index(settings.USER_INDEX).search(
        filter=f"email = '{user_data.email}'", limit=1
    )

    if result.hits:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    # Créer un nouvel utilisateur
    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.dict()
    del user_dict["password"]

    # Définir le premier utilisateur comme admin
    count_result = await client.index(settings.USER_INDEX).get_stats()
    is_first_user = count_result.number_of_documents == 0

    user_in_db = {
        **user_dict,
        "hashed_password": hashed_password,
        "is_admin": is_first_user,
        "id": str(uuid.uuid4()),  # Générer un ID unique
        "is_active": True,  # Par défaut, actif
        "created_at": int(time.time()),  # Timestamp en secondes
        "updated_at": int(time.time()),  # Timestamp en secondes
    }

    # Ajouter l'utilisateur à Meilisearch
    await client.index(settings.USER_INDEX).add_documents([user_in_db])

    # Retourner l'utilisateur sans le mot de passe hashé
    created_user = User(**user_in_db)
    return created_user


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user
