from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from typing import List, Optional
import uuid
from datetime import datetime
import os
import shutil
import logging
import aiohttp
from pypdf import PdfReader
import docx2txt
import csv
import io
import numpy as np
import time
from app.models.user import User
from app.models.knowledge import Document, DocumentCreate, Vector, VectorCreate, SearchQuery
from app.services.auth import get_current_active_user
from app.db.meilisearch import get_meilisearch_client
from app.core.config import settings

router = APIRouter(prefix="/knowledge", tags=["knowledge"])

# Configurer le logger
logger = logging.getLogger(__name__)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Fonction pour encoder un texte en vecteur (utilisation d'une API externe)
async def encode_text(text: str) -> List[float]:
    """
    Encode un texte en vecteur en utilisant un modèle d'embeddings.
    Utilise l'API d'OpenAI pour les embeddings.
    """
    api_base = settings.OPENAI_API_BASE or "https://api.openai.com/v1"
    api_endpoint = f"{api_base}/embeddings"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}"
    }
    
    payload = {
        "model": "text-embedding-ada-002",
        "input": text
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(api_endpoint, headers=headers, json=payload) as response:
            if response.status != 200:
                error_detail = await response.text()
                logger.error(f"Embedding API error: {response.status} - {error_detail}")
                # Retourner un vecteur aléatoire en cas d'erreur (pour développement uniquement)
                return list(np.random.rand(1536).astype(float))
            
            data = await response.json()
            return data["data"][0]["embedding"]

# Fonction pour découper un texte en chunks
def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """
    Découpe un texte en chunks de taille chunk_size avec un chevauchement de overlap.
    """
    chunks = []
    start = 0
    text_length = len(text)
    
    while start < text_length:
        end = min(start + chunk_size, text_length)
        
        # Ajuster la fin pour ne pas couper un mot
        if end < text_length:
            # Reculer jusqu'à trouver un espace ou une ponctuation
            while end > start and not text[end].isspace() and not text[end] in ".,;!?":
                end -= 1
                
            # Si on n'a pas trouvé d'espace, on coupe au milieu d'un mot
            if end == start:
                end = start + chunk_size
        
        chunks.append(text[start:end])
        
        # Avancer en tenant compte du chevauchement
        start = end - overlap if end - overlap > start else end
    
    return chunks

# Fonction pour extraire le texte de différents types de fichiers
async def extract_text_from_file(file_path: str) -> str:
    """
    Extrait le texte d'un fichier en fonction de son type.
    """
    file_ext = os.path.splitext(file_path)[1].lower()
    
    if file_ext == '.pdf':
        text = ""
        try:
            with open(file_path, 'rb') as f:
                pdf = PdfReader(f)
                for page in pdf.pages:
                    text += page.extract_text() + "\n"
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction du texte du PDF: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Erreur lors de l'extraction du texte du PDF: {str(e)}"
            )
        return text
    
    elif file_ext == '.docx':
        try:
            text = docx2txt.process(file_path)
            return text
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction du texte du DOCX: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Erreur lors de l'extraction du texte du DOCX: {str(e)}"
            )
    
    elif file_ext == '.txt':
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except UnicodeDecodeError:
            # Essayer avec une autre encodage si utf-8 échoue
            try:
                with open(file_path, 'r', encoding='latin-1') as f:
                    return f.read()
            except Exception as e:
                logger.error(f"Erreur lors de la lecture du fichier TXT: {e}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Erreur lors de la lecture du fichier TXT: {str(e)}"
                )
    
    elif file_ext == '.csv':
        text = ""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                csv_reader = csv.reader(f)
                for row in csv_reader:
                    text += ",".join(row) + "\n"
        except UnicodeDecodeError:
            # Essayer avec une autre encodage si utf-8 échoue
            try:
                with open(file_path, 'r', encoding='latin-1') as f:
                    csv_reader = csv.reader(f)
                    for row in csv_reader:
                        text += ",".join(row) + "\n"
            except Exception as e:
                logger.error(f"Erreur lors de la lecture du fichier CSV: {e}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Erreur lors de la lecture du fichier CSV: {str(e)}"
                )
        return text
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Type de fichier non supporté: {file_ext}"
        )

@router.post("/documents", response_model=Document)
async def create_document(
    title: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """
    Crée un nouveau document et l'indexe pour la recherche.
    """
    # Vérifier le type de fichier
    file_ext = os.path.splitext(file.filename)[1].lower()
    supported_extensions = ['.pdf', '.docx', '.txt', '.csv']
    
    if file_ext not in supported_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Type de fichier non supporté. Extensions supportées: {', '.join(supported_extensions)}"
        )
    
    # Générer un nom de fichier unique
    document_id = str(uuid.uuid4())
    file_name = f"{document_id}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    
    # Sauvegarder le fichier
    with open(file_path, 'wb') as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Extraire le texte du fichier
    try:
        text_content = await extract_text_from_file(file_path)
    except Exception as e:
        # Supprimer le fichier en cas d'erreur
        if os.path.exists(file_path):
            os.remove(file_path)
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur lors de l'extraction du texte: {str(e)}"
        )
    
    # Créer le document dans Meilisearch
    client = await get_meilisearch_client()
    now = int(time.time())
    
    document = {
        "id": document_id,
        "title": title,
        "content": text_content,
        "user_id": current_user.id,
        "created_at": now,
        "updated_at": now,
        "metadata": {
            "file_name": file.filename,
            "file_path": file_path,
            "file_type": file_ext,
            "file_size": os.path.getsize(file_path)
        }
    }
    
    await client.index(settings.DOCUMENT_INDEX).add_documents([document])
    
    # Découper le texte en chunks et les vectoriser
    chunks = chunk_text(text_content)
    
    for i, chunk in enumerate(chunks):
        # Encoder le chunk en vecteur
        vector = await encode_text(chunk)
        
        # Ajouter le vecteur à Meilisearch
        vector_data = {
            "id": str(uuid.uuid4()),
            "document_id": document_id,
            "text_chunk": chunk,
            "vector": vector,
            "created_at": now,
            "metadata": {
                "chunk_index": i,
                "document_title": title
            }
        }
        
        await client.index(settings.VECTOR_INDEX).add_documents([vector_data])
    
    return Document(**document)

@router.get("/documents", response_model=List[Document])
async def list_documents(current_user: User = Depends(get_current_active_user)):
    """
    Récupère la liste des documents de l'utilisateur.
    """
    client = await get_meilisearch_client()
    
    result = await client.index(settings.DOCUMENT_INDEX).search(filter=f"user_id = {current_user.id}", sort=["created_at:desc"])
    
    return [Document(**doc) for doc in result.hits]

@router.get("/documents/{document_id}", response_model=Document)
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère les détails d'un document.
    """
    client = await get_meilisearch_client()
    
    result = await client.index(settings.DOCUMENT_INDEX).search(filter=f"id = {document_id} AND user_id = {current_user.id}", limit=1)
    
    if not result.hits:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    return Document(**result.hits[0])

@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Supprime un document et ses vecteurs.
    """
    client = await get_meilisearch_client()
    
    # Vérifier que le document existe et appartient à l'utilisateur
    result = await client.index(settings.DOCUMENT_INDEX).search(filter=f"id = {document_id} AND user_id = {current_user.id}", limit=1)
    
    if not result.hits:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    document = result.hits[0]
    
    # Supprimer le fichier associé
    file_path = document.get("metadata", {}).get("file_path")
    if file_path and os.path.exists(file_path):
        os.remove(file_path)
    
    # Supprimer les vecteurs associés
    await client.index(settings.VECTOR_INDEX).delete_documents({
        "filter": f"document_id = {document_id}"
    })
    
    # Supprimer le document
    await client.index(settings.DOCUMENT_INDEX).delete_document(document_id)
    
    return {"message": "Document deleted successfully"}

@router.post("/search", response_model=List[dict])
async def search_knowledge(
    query: SearchQuery,
    current_user: User = Depends(get_current_active_user)
):
    """
    Recherche dans les documents vectorisés.
    """
    # Encoder la requête en vecteur
    query_vector = await encode_text(query.query)
    
    client = await get_meilisearch_client()
    
    # Recherche vectorielle dans Meilisearch
    result = await client.index(settings.VECTOR_INDEX).search(vector=query_vector, limit=query.limit)
    
    search_results = []
    
    for hit in result.hits:
        # Récupérer les informations du document associé
        doc_result = await client.index(settings.DOCUMENT_INDEX).search(filter=f"id = {hit['document_id']}", limit=1)
        
        if doc_result.hits:
            doc = doc_result.hits[0]
            search_results.append({
                "chunk": hit["text_chunk"],
                "document_id": hit["document_id"],
                "document_title": doc["title"],
                "relevance_score": hit.get("_rankingScore", 0)
            })
    
    return search_results

@router.get("/documents/{document_id}/download")
async def download_document(
    document_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Télécharge le fichier original d'un document.
    """
    client = await get_meilisearch_client()
    
    result = await client.index(settings.DOCUMENT_INDEX).search(filter=f"id = {document_id} AND user_id = {current_user.id}", limit=1)
    
    if not result.hits:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    document = result.hits[0]
    file_path = document.get("metadata", {}).get("file_path")
    
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    return FileResponse(
        file_path,
        filename=document.get("metadata", {}).get("file_name", os.path.basename(file_path)),
        media_type="application/octet-stream"
    )
