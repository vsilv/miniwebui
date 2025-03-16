from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import List, Optional
import uuid
import time
import os
import shutil
from pathlib import Path

from app.models.user import User
from app.models.project import (
    Project,
    ProjectCreate,
    ProjectUpdate,
    ProjectWithFiles,
    ProjectFile
)
from app.services.auth import get_current_active_user
from app.db.meilisearch import get_meilisearch_client
from app.core.config import settings


router = APIRouter(prefix="/project", tags=["project"])


@router.post("", response_model=Project)
async def create_project(
    project_data: ProjectCreate, current_user: User = Depends(get_current_active_user)
):
    """
    Crée un nouveau projet.
    """
    client = await get_meilisearch_client()

    project_id = str(uuid.uuid4())
    now = int(time.time())

    project_dict = {
        **project_data.model_dump(),
        "id": project_id,
        "user_id": current_user.id,
        "created_at": now,
        "updated_at": now,
        "instructions": ""
    }

    # Ajouter le projet à l'index
    await client.index("projects").add_documents([project_dict])

    # Créer le dossier pour les fichiers du projet
    project_dir = Path(settings.UPLOAD_DIR) / "projects" / project_id
    project_dir.mkdir(parents=True, exist_ok=True)

    return Project(**project_dict)


@router.get("", response_model=List[Project])
async def list_projects(current_user: User = Depends(get_current_active_user)):
    """
    Récupère la liste des projets de l'utilisateur.
    """
    client = await get_meilisearch_client()
    
    result = await client.index("projects").search(
        "", 
        filter=f"user_id = {current_user.id}",
        sort=["created_at:desc"],
        limit=100
    )
    
    return [Project(**project) for project in result.hits]


@router.get("/{project_id}", response_model=ProjectWithFiles)
async def get_project(
    project_id: str, current_user: User = Depends(get_current_active_user)
):
    """
    Récupère les détails d'un projet.
    """
    client = await get_meilisearch_client()
    
    # Récupérer le projet
    project_result = await client.index("projects").search(
        "",
        filter=f"id = {project_id} AND user_id = {current_user.id}",
        limit=1
    )
    
    if not project_result.hits:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    project = project_result.hits[0]
    
    # Récupérer les fichiers du projet
    files_result = await client.index("project_files").search(
        "",
        filter=f"project_id = {project_id} AND user_id = {current_user.id}",
        limit=100
    )
    
    files = files_result.hits if files_result.hits else []
    
    return ProjectWithFiles(**project, files=files)


@router.put("/{project_id}", response_model=Project)
async def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Met à jour un projet existant.
    """
    client = await get_meilisearch_client()
    
    # Vérifier que le projet existe et appartient à l'utilisateur
    project_result = await client.index("projects").search(
        "",
        filter=f"id = {project_id} AND user_id = {current_user.id}",
        limit=1
    )
    
    if not project_result.hits:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Mettre à jour le projet
    project_update = {
        "id": project_id,
        "updated_at": int(time.time())
    }
    
    for field, value in project_data.model_dump(exclude_unset=True).items():
        if value is not None:
            project_update[field] = value
    
    await client.index("projects").update_documents([project_update])
    
    # Récupérer le projet mis à jour
    updated_project_result = await client.index("projects").search(
        "",
        filter=f"id = {project_id}",
        limit=1
    )
    
    return Project(**updated_project_result.hits[0])


@router.delete("/{project_id}")
async def delete_project(
    project_id: str, current_user: User = Depends(get_current_active_user)
):
    """
    Supprime un projet et tous ses fichiers.
    """
    client = await get_meilisearch_client()
    
    # Vérifier que le projet existe et appartient à l'utilisateur
    project_result = await client.index("projects").search(
        "",
        filter=f"id = {project_id} AND user_id = {current_user.id}",
        limit=1
    )
    
    if not project_result.hits:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Supprimer tous les fichiers du projet
    await client.index("project_files").delete_documents_by_filter(f"project_id = {project_id}")
    
    # Supprimer le projet
    await client.index("projects").delete_document(project_id)
    
    # Supprimer le dossier du projet
    project_dir = Path(settings.UPLOAD_DIR) / "projects" / project_id
    if project_dir.exists():
        shutil.rmtree(project_dir)
    
    return {"message": "Project deleted successfully"}


@router.post("/{project_id}/file", response_model=ProjectFile)
async def upload_project_file(
    project_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """
    Télécharge un fichier pour un projet.
    """
    client = await get_meilisearch_client()
    
    # Vérifier que le projet existe et appartient à l'utilisateur
    project_result = await client.index("projects").search(
        "",
        filter=f"id = {project_id} AND user_id = {current_user.id}",
        limit=1
    )
    
    if not project_result.hits:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Créer le dossier pour les fichiers du projet s'il n'existe pas
    project_dir = Path(settings.UPLOAD_DIR) / "projects" / project_id
    project_dir.mkdir(parents=True, exist_ok=True)
    
    # Générer un ID unique pour le fichier
    file_id = str(uuid.uuid4())
    filename = file.filename
    file_path = project_dir / filename
    
    # Sauvegarder le fichier
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Déterminer le type de fichier
    file_extension = os.path.splitext(filename)[1].lower()
    file_type = "document"
    if file_extension in [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"]:
        file_type = "image"
    elif file_extension in [".pdf"]:
        file_type = "pdf"
    elif file_extension in [".txt", ".md", ".csv", ".json", ".xml", ".html", ".css", ".js", ".py"]:
        file_type = "text"
    
    # Créer l'entrée du fichier
    now = int(time.time())
    file_dict = {
        "id": file_id,
        "project_id": project_id,
        "user_id": current_user.id,
        "filename": filename,
        "file_type": file_type,
        "file_size": os.path.getsize(file_path),
        "created_at": now,
        "updated_at": now
    }
    
    # Ajouter le fichier à l'index
    await client.index("project_files").add_documents([file_dict])
    
    return ProjectFile(**file_dict)


@router.delete("/{project_id}/file/{file_id}")
async def delete_project_file(
    project_id: str,
    file_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Supprime un fichier de projet.
    """
    client = await get_meilisearch_client()
    
    # Vérifier que le fichier existe et appartient à l'utilisateur
    file_result = await client.index("project_files").search(
        "",
        filter=f"id = {file_id} AND project_id = {project_id} AND user_id = {current_user.id}",
        limit=1
    )
    
    if not file_result.hits:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    file_info = file_result.hits[0]
    
    # Supprimer le fichier physique
    file_path = Path(settings.UPLOAD_DIR) / "projects" / project_id / file_info["filename"]
    if file_path.exists():
        os.remove(file_path)
    
    # Supprimer l'entrée du fichier
    await client.index("project_files").delete_document(file_id)
    
    return {"message": "File deleted successfully"}
