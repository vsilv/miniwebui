from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.api import auth, chat, models, knowledge
from app.core.config import settings
from app.db.meilisearch import init_meilisearch, close_meilisearch

app = FastAPI(title="MiniWebUI")

# CORS middleware pour permettre les requêtes depuis le frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Événements de démarrage/arrêt
@app.on_event("startup")
async def startup_event():
    await init_meilisearch()

@app.on_event("shutdown")
async def shutdown_event():
    await close_meilisearch()

# Inclure les routes API
app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(models.router, prefix="/api", tags=["models"])
app.include_router(knowledge.router, prefix="/api", tags=["knowledge"])

# Créer un dossier uploads s'il n'existe pas
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
async def root():
    return {"message": "MiniWebUI API"}