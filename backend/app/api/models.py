from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import aiohttp
import uuid
from datetime import datetime
import time
from app.models.user import User
from app.models.models import Model, ModelCreate, ModelUpdate, ModelList
from app.services.auth import get_current_active_user
from app.db.meilisearch import get_meilisearch_client
from app.core.config import settings

router = APIRouter(prefix="/models", tags=["models"])

@router.get("/", response_model=List[Model])
async def list_models(current_user: User = Depends(get_current_active_user)):
    """
    Récupère la liste des modèles disponibles.
    """
    client = await get_meilisearch_client()
    
    result = await client.index("models").search(limit=100)
    
    # Si aucun modèle n'est trouvé, initialiser avec des modèles par défaut
    if not result.hits:
        await initialize_default_models()
        result = await client.index("models").search(limit=100)
    
    return [Model(**model) for model in result.hits]

@router.post("/", response_model=Model)
async def create_model(
    model_data: ModelCreate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Crée un nouveau modèle.
    """
    # Vérifier les permissions d'administrateur
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    client = await get_meilisearch_client()
    
    model_id = str(uuid.uuid4())
    now = int(time.time())
    
    model_dict = {
        **model_data.dict(),
        "id": model_id,
        "created_at": now,
        "updated_at": now
    }
    
    # Ajouter le modèle
    await client.index("models").add_documents([model_dict])
    
    return Model(**model_dict)

@router.put("/{model_id}", response_model=Model)
async def update_model(
    model_id: str,
    model_data: ModelUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Met à jour un modèle existant.
    """
    # Vérifier les permissions d'administrateur
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    client = await get_meilisearch_client()
    
    # Vérifier que le modèle existe
    model_result = await client.index("models").search(filter=f"id = {model_id}", limit=1)
    
    if not model_result.hits:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found"
        )
    
    # Mettre à jour le modèle
    model_update = {
        "id": model_id,
        "updated_at": int(time.time())
    }
    
    for field, value in model_data.dict(exclude_unset=True).items():
        if value is not None:
            model_update[field] = value
    
    await client.index("models").update_documents([model_update])
    
    # Récupérer le modèle mis à jour
    updated_model_result = await client.index("models").search(filter=f"id = {model_id}", limit=1)
    
    return Model(**updated_model_result.hits[0])

@router.delete("/{model_id}")
async def delete_model(
    model_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Supprime un modèle.
    """
    # Vérifier les permissions d'administrateur
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    client = await get_meilisearch_client()
    
    # Vérifier que le modèle existe
    model_result = await client.index("models").search(filter=f"id = {model_id}", limit=1)
    
    if not model_result.hits:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found"
        )
    
    # Supprimer le modèle
    await client.index("models").delete_document(model_id)
    
    return {"message": "Model deleted successfully"}

@router.get("/available")
async def list_available_models():
    """
    Récupère la liste des modèles disponibles depuis les API externes.
    """
    available_models = []
    
    # OpenAI Models
    if settings.OPENAI_API_KEY:
        try:
            openai_models = await get_openai_models()
            available_models.extend(openai_models)
        except Exception as e:
            # Ignorer les erreurs et continuer
            pass
    
    # Ollama Models
    try:
        ollama_models = await get_ollama_models()
        available_models.extend(ollama_models)
    except Exception as e:
        # Ignorer les erreurs et continuer
        pass
    
    return {"models": available_models}

async def get_openai_models():
    """
    Récupère la liste des modèles disponibles depuis l'API OpenAI.
    """
    api_base = settings.OPENAI_API_BASE or "https://api.openai.com/v1"
    api_endpoint = f"{api_base}/models"
    
    headers = {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}"
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.get(api_endpoint, headers=headers) as response:
            if response.status != 200:
                return []
            
            data = await response.json()
            models = []
            
            for model in data.get("data", []):
                model_id = model.get("id", "")
                if "gpt" in model_id.lower():
                    models.append({
                        "id": model_id,
                        "provider": "openai",
                        "name": model_id
                    })
            
            return models

async def get_ollama_models():
    """
    Récupère la liste des modèles disponibles depuis l'API Ollama.
    """
    api_endpoint = f"{settings.OLLAMA_API_BASE}/api/tags"
    
    async with aiohttp.ClientSession() as session:
        async with session.get(api_endpoint) as response:
            if response.status != 200:
                return []
            
            data = await response.json()
            models = []
            
            for model in data.get("models", []):
                model_name = model.get("name", "")
                models.append({
                    "id": model_name,
                    "provider": "ollama",
                    "name": model_name
                })
            
            return models

async def initialize_default_models():
    """
    Initialise les modèles par défaut si aucun n'existe.
    """
    client = await get_meilisearch_client()
    now = int(time.time())
    
    # Modèles par défaut
    default_models = [
        {
            "id": str(uuid.uuid4()),
            "name": "GPT-4",
            "model_id": "gpt-4",
            "provider": "openai",
            "description": "GPT-4 est un grand modèle multimodal d'OpenAI capable de résoudre des problèmes difficiles avec une plus grande précision.",
            "settings": {"temperature": 0.7, "max_tokens": 4096},
            "created_at": now,
            "updated_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "name": "GPT-3.5 Turbo",
            "model_id": "gpt-3.5-turbo",
            "provider": "openai",
            "description": "GPT-3.5 Turbo est un modèle puissant d'OpenAI optimisé pour le chat à un prix réduit.",
            "settings": {"temperature": 0.7, "max_tokens": 4096},
            "created_at": now,
            "updated_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Llama 2",
            "model_id": "llama2",
            "provider": "ollama",
            "description": "Llama 2 est un grand modèle de langage open source développé par Meta.",
            "settings": {"temperature": 0.7},
            "created_at": now,
            "updated_at": now
        }
    ]
    
    # Ajouter les modèles par défaut
    await client.index("models").add_documents(default_models)
