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
from app.models.knowledge import (
    Document,
    DocumentCreate,
    Vector,
    VectorCreate,
    SearchQuery,
)
import requests

from app.services.auth import get_current_active_user
from app.db.meilisearch import get_meilisearch_client
from app.core.config import settings
from typing import List
from langchain_experimental.text_splitter import SemanticChunker

router = APIRouter(prefix="/knowledge", tags=["knowledge"])

# Configurer le logger
logger = logging.getLogger(__name__)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# Fonction pour encoder un texte en vecteur (utilisation d'une API externe)
async def encode_text(texts: str) -> List[float]:
    """
    Encode un texte en vecteur en utilisant un modèle d'embeddings.
    Utilise l'API d'OpenAI pour les embeddings.
    """
    api_endpoint = os.getenv("EMBEDDING_API_URL")
    payload = {
        "input": texts,
        "query": False,
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(api_endpoint, json=payload) as response:
            if response.status != 200:
                error_detail = await response.text()
                logger.error(f"Embedding API error: {response.status} - {error_detail}")
                # Retourner un vecteur aléatoire en cas d'erreur (pour développement uniquement)
                return list(np.random.rand(1536).astype(float))

            data = await response.json()
            return data["embeddings"]


# Fonction pour découper un texte en chunks
def chunk_text(text: str) -> List[str]:
    """
    Découpe un texte en chunks de taille chunk_size avec un chevauchement de overlap.
    """

    # Wrapper minimal pour adapter SentenceTransformer à l'interface attendue par SemanticChunker.
    class SentenceTransformerEmbeddingsWrapper:
        def __init__(self):
            # Le paramètre model_name est ignoré car on utilise un service externe
            self.endpoint = os.getenv("EMBEDDING_API_URL")

        def embed_documents(self, texts: List[str]) -> List[List[float]]:
            # Construction du payload attendu par le serveur
            payload = {
                "input": texts,
                "query": False,  # à mettre à True si le prompt "query" doit être utilisé
            }
            # Envoi de la requête POST à l'API
            response = requests.post(self.endpoint, json=payload)
            response.raise_for_status()  # lève une exception en cas d'erreur HTTP
            result = response.json()
            # On retourne la liste des embeddings récupérée dans le champ "embeddings"
            return result.get("embeddings", [])

    def split_text_semantically(text: str) -> List[str]:
        """
        Découpe le texte en segments sémantiquement cohérents avec une longueur équilibrée.

        La fonction utilise le modèle 'Alibaba-NLP/gte-Qwen2-1.5B-instruct' via un wrapper et
        configure le SemanticChunker avec un buffer_size de 1 et un seuil percentile de 70.
        Cela permet de combiner un peu de contexte tout en réalisant des coupures suffisamment fréquentes.

        Args:
            text (str): Le texte à découper.

        Returns:
            List[str]: Une liste de segments découpés.
        """
        embeddings = SentenceTransformerEmbeddingsWrapper()
        chunker = SemanticChunker(
            embeddings=embeddings,
            buffer_size=1,  # Conserve le contexte en incluant la phrase précédente et suivante
            add_start_index=False,
            breakpoint_threshold_type="percentile",
            breakpoint_threshold_amount=50,  # Seuil à 85 pour un compromis entre coupures trop fréquentes ou rares
            number_of_chunks=None,
            sentence_split_regex=r"(?<=[.?!])\s+",
            min_chunk_size=300,
        )
        chunks = chunker.split_text(text)
        if chunks:
            chunks = [chunk for chunk in chunks if chunk and len(chunk) >= 2]

    return split_text_semantically(text)


# Fonction pour extraire le texte de différents types de fichiers
async def extract_text_from_file(file_path: str) -> str:
    """
    Extrait le texte d'un fichier en fonction de son type.
    """
    file_ext = os.path.splitext(file_path)[1].lower()

    if file_ext == ".pdf":
        text = ""
        try:
            with open(file_path, "rb") as f:
                pdf = PdfReader(f)
                for page in pdf.pages:
                    text += page.extract_text() + "\n"
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction du texte du PDF: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Erreur lors de l'extraction du texte du PDF: {str(e)}",
            )
        return text

    elif file_ext == ".docx":
        try:
            text = docx2txt.process(file_path)
            return text
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction du texte du DOCX: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Erreur lors de l'extraction du texte du DOCX: {str(e)}",
            )

    elif file_ext == ".txt":
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
        except UnicodeDecodeError:
            # Essayer avec une autre encodage si utf-8 échoue
            try:
                with open(file_path, "r", encoding="latin-1") as f:
                    return f.read()
            except Exception as e:
                logger.error(f"Erreur lors de la lecture du fichier TXT: {e}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Erreur lors de la lecture du fichier TXT: {str(e)}",
                )

    elif file_ext == ".csv":
        text = ""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                csv_reader = csv.reader(f)
                for row in csv_reader:
                    text += ",".join(row) + "\n"
        except UnicodeDecodeError:
            # Essayer avec une autre encodage si utf-8 échoue
            try:
                with open(file_path, "r", encoding="latin-1") as f:
                    csv_reader = csv.reader(f)
                    for row in csv_reader:
                        text += ",".join(row) + "\n"
            except Exception as e:
                logger.error(f"Erreur lors de la lecture du fichier CSV: {e}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Erreur lors de la lecture du fichier CSV: {str(e)}",
                )
        return text

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Type de fichier non supporté: {file_ext}",
        )


@router.post("/documents", response_model=Document)
async def create_document(
    title: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
):
    """
    Crée un nouveau document et l'indexe pour la recherche.
    """
    # Vérifier le type de fichier
    file_ext = os.path.splitext(file.filename)[1].lower()
    supported_extensions = [".pdf", ".docx", ".txt", ".csv"]

    if file_ext not in supported_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Type de fichier non supporté. Extensions supportées: {', '.join(supported_extensions)}",
        )

    # Générer un nom de fichier unique
    document_id = str(uuid.uuid4())
    file_name = f"{document_id}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, file_name)

    # Sauvegarder le fichier
    with open(file_path, "wb") as buffer:
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
            detail=f"Erreur lors de l'extraction du texte: {str(e)}",
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
            "file_size": os.path.getsize(file_path),
        },
    }

    await client.index(settings.DOCUMENT_INDEX).add_documents([document])

    # Découper le texte en chunks et les vectoriser
    chunks = chunk_text(text_content)
    print(len(chunks))
    vectors = await encode_text(chunks)

    chunk_documents = []
    for i, chunk in enumerate(chunks):
        # Ajouter le vecteur à Meilisearch
        chunk_documents.append(
            {
                "id": str(uuid.uuid4()),
                "document_id": document_id,
                "index_name": "documents",
                "text": chunk,
                "_vectors": {"qwen": vectors[i]},
                "created_at": now,
                "metadata": {"chunk_index": i, "document_title": title},
            }
        )

    res = await client.index(settings.CHUNK_INDEX).add_documents(chunk_documents)
    res = await client.wait_for_task(res.task_uid)
    print(res)

    return Document(**document)


@router.get("/documents", response_model=List[Document])
async def list_documents(current_user: User = Depends(get_current_active_user)):
    """
    Récupère la liste des documents de l'utilisateur.
    """
    client = await get_meilisearch_client()

    result = await client.index(settings.DOCUMENT_INDEX).search(
        filter=f"user_id = {current_user.id}", sort=["created_at:desc"]
    )

    return [Document(**doc) for doc in result.hits]


@router.get("/documents/{document_id}", response_model=Document)
async def get_document(
    document_id: str, current_user: User = Depends(get_current_active_user)
):
    """
    Récupère les détails d'un document.
    """
    client = await get_meilisearch_client()

    result = await client.index(settings.DOCUMENT_INDEX).search(
        filter=f"id = {document_id} AND user_id = {current_user.id}", limit=1
    )

    if not result.hits:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )

    return Document(**result.hits[0])


@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str, current_user: User = Depends(get_current_active_user)
):
    """
    Supprime un document et ses vecteurs.
    """
    client = await get_meilisearch_client()

    # Vérifier que le document existe et appartient à l'utilisateur
    result = await client.index(settings.DOCUMENT_INDEX).search(
        filter=f"id = {document_id} AND user_id = {current_user.id}", limit=1
    )

    if not result.hits:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )

    document = result.hits[0]

    # Supprimer le fichier associé
    file_path = document.get("metadata", {}).get("file_path")
    if file_path and os.path.exists(file_path):
        os.remove(file_path)

    # Supprimer le document
    await client.index(settings.DOCUMENT_INDEX).delete_document(document_id)

    return {"message": "Document deleted successfully"}


@router.post("/search", response_model=List[dict])
async def search_knowledge(
    query: SearchQuery, current_user: User = Depends(get_current_active_user)
):
    """
    Recherche dans les documents vectorisés.
    """
    # Encoder la requête en vecteur
    query_vector = await encode_text(query.query)

    client = await get_meilisearch_client()

    # Recherche vectorielle dans Meilisearch
    result = await client.index(settings.CHUNK_INDEX).search(
        vector=query_vector, limit=query.limit
    )

    search_results = []

    for hit in result.hits:
        # Récupérer les informations du document associé
        doc_result = await client.index(settings.DOCUMENT_INDEX).search(
            filter=f"id = {hit['document_id']}", limit=1
        )

        if doc_result.hits:
            doc = doc_result.hits[0]
            search_results.append(
                {
                    "chunk": hit["text_chunk"],
                    "document_id": hit["document_id"],
                    "document_title": doc["title"],
                    "relevance_score": hit.get("_rankingScore", 0),
                }
            )

    return search_results


@router.get("/documents/{document_id}/download")
async def download_document(
    document_id: str, current_user: User = Depends(get_current_active_user)
):
    """
    Télécharge le fichier original d'un document.
    """
    client = await get_meilisearch_client()

    result = await client.index(settings.DOCUMENT_INDEX).search(
        filter=f"id = {document_id} AND user_id = {current_user.id}", limit=1
    )

    if not result.hits:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )

    document = result.hits[0]
    file_path = document.get("metadata", {}).get("file_path")

    if not file_path or not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="File not found"
        )

    return FileResponse(
        file_path,
        filename=document.get("metadata", {}).get(
            "file_name", os.path.basename(file_path)
        ),
        media_type="application/octet-stream",
    )
