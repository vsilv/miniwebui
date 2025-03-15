from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import List, Dict, Any
import uuid
from datetime import datetime
import json
import asyncio
import time

from app.models.user import User
from app.models.chat import (
    Chat,
    ChatCreate,
    Message,
    MessageCreate,
    ChatWithMessages,
    ChatResponse,
)
from app.models.models import CompletionRequest
from app.services.auth import get_current_active_user
from app.services.llm import get_completion, get_streaming_completion
from app.db.meilisearch import get_meilisearch_client
from app.core.config import settings


router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=Chat)
async def create_chat(
    chat_data: ChatCreate, current_user: User = Depends(get_current_active_user)
):
    client = await get_meilisearch_client()

    chat_id = str(uuid.uuid4())
    now = int(time.time())

    chat_dict = {
        **chat_data.model_dump(),
        "id": chat_id,
        "user_id": current_user.id,
        "created_at": now,
        "updated_at": now,
    }

    # Créer le chat
    print("create chat", chat_id)
    res = await client.index(settings.CHAT_INDEX).add_documents([chat_dict])
    print(res)
    res = await client.wait_for_task(res.task_uid)
    print(res)

    # Si un message système est fourni, l'ajouter
    if chat_data.system_prompt:
        system_message = {
            "id": str(uuid.uuid4()),
            "chat_id": chat_id,
            "role": "system",
            "content": chat_data.system_prompt,
            "created_at": now,
        }
        await client.index(settings.MESSAGE_INDEX).add_documents([system_message])

    return Chat(**chat_dict)


@router.get("", response_model=List[Chat])
async def list_chats(current_user: User = Depends(get_current_active_user)):
    client = await get_meilisearch_client()

    result = await client.index(settings.CHAT_INDEX).search(
        filter=f"user_id = {current_user.id}", sort=["created_at:desc"]
    )

    return [Chat(**chat) for chat in result.hits]


@router.get("/{chat_id}", response_model=ChatWithMessages)
async def get_chat(chat_id: str, current_user: User = Depends(get_current_active_user)):
    client = await get_meilisearch_client()

    # Récupérer le chat
    print("search for chat", chat_id)
    chat_result = await client.index(settings.CHAT_INDEX).search(
        filter=f"id = {chat_id} AND user_id = {current_user.id}", limit=1
    )

    if not chat_result.hits:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found"
        )

    chat = Chat(**chat_result.hits[0])

    # Récupérer les messages
    messages_result = await client.index(settings.MESSAGE_INDEX).search(
        filter=f"chat_id = {chat_id}", sort=["created_at:asc"], limit=100
    )

    messages = [Message(**msg) for msg in messages_result.hits]

    return ChatWithMessages(**chat.dict(), messages=messages)


@router.post("/{chat_id}/messages", response_model=ChatResponse)
async def add_message(
    chat_id: str,
    message: MessageCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
):
    client = await get_meilisearch_client()

    # Vérifier que le chat existe et appartient à l'utilisateur
    chat_result = await client.index(settings.CHAT_INDEX).search(
        filter=f"id = {chat_id} AND user_id = {current_user.id}", limit=1
    )

    if not chat_result.hits:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found"
        )

    chat = Chat(**chat_result.hits[0])

    # Ajouter le message utilisateur
    message_id = str(uuid.uuid4())
    now = int(time.time())

    user_message = {
        "id": message_id,
        "chat_id": chat_id,
        "role": message.role,
        "content": message.content,
        "created_at": now,
    }

    await client.index(settings.MESSAGE_INDEX).add_documents([user_message])

    # Mettre à jour la date de mise à jour du chat
    await client.index(settings.CHAT_INDEX).update_documents(
        [{"id": chat_id, "updated_at": now}]
    )

    # Récupérer tous les messages précédents pour le contexte
    messages_result = await client.index(settings.MESSAGE_INDEX).search(
        filter=f"chat_id = {chat_id}", sort=["created_at:asc"], limit=100
    )

    # Convertir en format attendu par l'API de complétion
    messages_for_completion = [
        {"role": msg["role"], "content": msg["content"]} for msg in messages_result.hits
    ]

    # Créer une requête de complétion
    completion_request = CompletionRequest(
        model=chat.model, messages=messages_for_completion
    )

    # Obtenir la réponse du modèle (non-streaming)
    completion = await get_completion(completion_request)

    # Extraire la réponse
    assistant_response = completion["choices"][0]["message"]["content"]

    # Sauvegarder la réponse de l'assistant
    assistant_message = {
        "id": str(uuid.uuid4()),
        "chat_id": chat_id,
        "role": "assistant",
        "content": assistant_response,
        "created_at": int(time.time()),
    }

    await client.index(settings.MESSAGE_INDEX).add_documents([assistant_message])

    return ChatResponse(
        id=assistant_message["id"],
        content=assistant_response,
        created_at=assistant_message["created_at"],
    )


@router.post("/{chat_id}/messages/stream")
async def add_message_stream(
    chat_id: str,
    message: MessageCreate,
    current_user: User = Depends(get_current_active_user),
):
    client = await get_meilisearch_client()

    # Vérifier que le chat existe et appartient à l'utilisateur
    chat_result = await client.index(settings.CHAT_INDEX).search(
        filter=f"id = {chat_id} AND user_id = {current_user.id}", limit=1
    )

    if not chat_result.hits:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found"
        )

    chat = Chat(**chat_result.hits[0])

    # Ajouter le message utilisateur
    message_id = str(uuid.uuid4())
    now = int(time.time())

    user_message = {
        "id": message_id,
        "chat_id": chat_id,
        "role": message.role,
        "content": message.content,
        "created_at": now,
    }

    await client.index(settings.MESSAGE_INDEX).add_documents([user_message])

    # Mettre à jour la date de mise à jour du chat
    await client.index(settings.CHAT_INDEX).update_documents(
        [{"id": chat_id, "updated_at": now}]
    )

    # Récupérer tous les messages précédents pour le contexte
    messages_result = await client.index(settings.MESSAGE_INDEX).search(
        filter=f"chat_id = {chat_id}", sort=["created_at:asc"], limit=100
    )

    # Convertir en format attendu par l'API de complétion
    messages_for_completion = [
        {"role": msg["role"], "content": msg["content"]} for msg in messages_result.hits
    ]

    # Créer une requête de complétion avec streaming
    completion_request = CompletionRequest(
        model=chat.model, messages=messages_for_completion, stream=True
    )

    # ID du message de l'assistant
    assistant_message_id = str(uuid.uuid4())

    # Obtenir un générateur de streaming pour la réponse
    async def stream_response():
        full_response = ""

        async for chunk in get_streaming_completion(completion_request):
            if "choices" in chunk and len(chunk["choices"]) > 0:
                delta = chunk["choices"][0].get("delta", {})
                content = delta.get("content", "")
                if content:
                    full_response += content
                    yield f"data: {json.dumps({'content': content, 'done': False})}\n\n"

        # Sauvegarder le message complet à la fin du streaming
        assistant_message = {
            "id": assistant_message_id,
            "chat_id": chat_id,
            "role": "assistant",
            "content": full_response,
            "created_at": int(time.time()),
        }

        await client.index(settings.MESSAGE_INDEX).add_documents([assistant_message])

        # Envoyer un événement final pour indiquer que c'est terminé
        yield f"data: {json.dumps({'content': '', 'done': True, 'id': assistant_message_id})}\n\n"

    return StreamingResponse(stream_response(), media_type="text/event-stream")


@router.delete("/{chat_id}")
async def delete_chat(
    chat_id: str, current_user: User = Depends(get_current_active_user)
):
    client = await get_meilisearch_client()

    # Vérifier que le chat existe et appartient à l'utilisateur
    chat_result = await client.index(settings.CHAT_INDEX).search(
        filter=f"id = {chat_id} AND user_id = {current_user.id}", limit=1
    )

    if not chat_result.hits:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found"
        )

    # Supprimer les messages associés
    await client.index(settings.MESSAGE_INDEX).delete_documents(
        {"filter": f"chat_id = {chat_id}"}
    )

    # Supprimer le chat
    await client.index(settings.CHAT_INDEX).delete_document(chat_id)

    return {"message": "Chat deleted successfully"}
