from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.responses import StreamingResponse, JSONResponse
from typing import List, Dict, Any, AsyncGenerator
import uuid
import json
import asyncio
import time

from app.models.user import User
from app.models.chat import (
    Chat,
    ChatCreate,
    Message,
    MessageCreate,
    MessageStreamRequest,
    ChatWithMessages,
    ChatResponse,
    StreamSession,
)
from app.models.models import CompletionRequest
from app.services.auth import get_current_active_user
from app.services.llm import (
    get_completion,
    start_streaming_completion,
    read_stream_messages,
)
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

    # Create the chat
    res = await client.index(settings.CHAT_INDEX).add_documents([chat_dict])
    res = await client.wait_for_task(res.task_uid)

    # If a system message is provided, add it
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

    # Get the chat
    chat_result = await client.index(settings.CHAT_INDEX).search(
        filter=f"id = {chat_id} AND user_id = {current_user.id}", limit=1
    )

    if not chat_result.hits:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found"
        )

    chat = Chat(**chat_result.hits[0])

    # Get the messages
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
    """
    Non-streaming message endpoint (for backward compatibility)
    """
    client = await get_meilisearch_client()

    # Verify that the chat exists and belongs to the user
    chat_result = await client.index(settings.CHAT_INDEX).search(
        filter=f"id = {chat_id} AND user_id = {current_user.id}", limit=1
    )

    if not chat_result.hits:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found"
        )

    chat = Chat(**chat_result.hits[0])

    # Add the user message
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

    # Update the chat's updated_at timestamp
    await client.index(settings.CHAT_INDEX).update_documents(
        [{"id": chat_id, "updated_at": now}]
    )

    # Get all previous messages for context
    messages_result = await client.index(settings.MESSAGE_INDEX).search(
        filter=f"chat_id = {chat_id}", sort=["created_at:asc"], limit=100
    )

    # Convert to expected format for the completion API
    messages_for_completion = [
        {"role": msg["role"], "content": msg["content"]} for msg in messages_result.hits
    ]

    # Create a completion request
    completion_request = CompletionRequest(
        model=chat.model, messages=messages_for_completion
    )

    # Get the model response (non-streaming)
    completion = await get_completion(completion_request)

    # Extract the response
    assistant_response = completion["choices"][0]["message"]["content"]

    # Save the assistant's response
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


@router.post("/{chat_id}/messages/stream", response_model=StreamSession)
async def start_message_stream(
    background_tasks: BackgroundTasks,
    chat_id: str,
    request: MessageStreamRequest,
    current_user: User = Depends(get_current_active_user),
):
    """
    Start a streaming message generation and return a session ID to track it
    """
    message = request.message
    regenerate = request.regenerate
    assistant_message_id = request.assistant_message_id  # Get the client-generated assistant message ID
    
    print("regenerate", regenerate)
    print("message ID:", message.id if hasattr(message, 'id') else "No ID provided")
    print("assistant message ID:", assistant_message_id)
    
    session_id = str(uuid.uuid4())
    
    # If no assistant_message_id was provided, generate one
    if not assistant_message_id:
        assistant_message_id = str(uuid.uuid4())

    now = int(time.time())

    redis_key = f"session_info:{session_id}"
    session_info = {
        "id": session_id,
        "message_id": assistant_message_id,
        "chat_id": chat_id,
        "user_id": current_user.id,
        "created_at": now,
    }

    # Import redis_client directly here
    from app.services.llm import redis_client

    await redis_client.set(
        redis_key,
        json.dumps(session_info),
        ex=3600,  # 1 hour expiration
    )

    async def process(session_id, assistant_message_id):
        client = await get_meilisearch_client()

        # Verify that the chat exists and belongs to the user
        chat_result = await client.index(settings.CHAT_INDEX).search(
            filter=f"id = {chat_id} AND user_id = {current_user.id}", limit=1
        )

        if not chat_result.hits:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found"
            )

        chat = Chat(**chat_result.hits[0])

        # Get all previous messages for context
        messages_result = await client.index(settings.MESSAGE_INDEX).search(
            filter=f"chat_id = {chat_id}", sort=["created_at:asc"], limit=100
        )
        
        # Extract all messages
        all_messages = messages_result.hits
        
        # Handle message ID if provided
        message_id = getattr(message, 'id', None)
        user_message_data = {
            "id": message_id if message_id else str(uuid.uuid4()),
            "chat_id": chat_id,
            "role": message.role,
            "content": message.content,
            "created_at": now,
        }
        
        # Messages for completion API
        messages_for_completion = []
        
        if regenerate:
            # If regenerating, we need to find all messages before the specified message ID
            if message_id:
                # Keep messages that occurred before the specified message
                filtered_messages = []
                for msg in all_messages:
                    if msg["id"] == message_id:
                        # Include the user message we're regenerating from
                        filtered_messages.append(msg)
                        break  # Stop after this message
                    filtered_messages.append(msg)
                
                # Convert to expected format for the completion API
                messages_for_completion = [
                    {"role": msg["role"], "content": msg["content"]}
                    for msg in filtered_messages
                ]
            else:
                # If no message ID, just use the current message
                messages_for_completion = [{"role": message.role, "content": message.content}]
        else:
            # For a regular message, use all existing messages plus the new one
            messages_for_completion = [
                {"role": msg["role"], "content": msg["content"]}
                for msg in all_messages
            ]
            
            # Add the new message to messages_for_completion
            messages_for_completion.append(
                {"role": message.role, "content": message.content}
            )
            
            # Save the user message to the database
            await client.index(settings.MESSAGE_INDEX).add_documents([user_message_data])

        print("Messages for completion:", messages_for_completion)

        # Update the chat's updated_at timestamp
        await client.index(settings.CHAT_INDEX).update_documents(
            [{"id": chat_id, "updated_at": now}]
        )

        # Create a completion request
        completion_request = CompletionRequest(
            model=chat.model,
            session_id=session_id,
            messages=messages_for_completion,
            stream=True,
        )

        # Start the streaming generation and get the session ID
        await start_streaming_completion(completion_request)

    background_tasks.add_task(process, session_id, assistant_message_id)

    return StreamSession(
        session_id=session_id, message_id=assistant_message_id, created_at=now
    )

@router.get("/stream/{session_id}/events")
async def stream_chat_events(session_id: str, request: Request):
    """
    SSE endpoint that streams events for a specific session.
    Authentication is disabled for this route for simplicity.
    """
    # Import redis_client directly
    from app.services.llm import redis_client, read_stream_messages

    # Get session info from Redis
    redis_key = f"session_info:{session_id}"
    session_data = await redis_client.get(redis_key)

    if not session_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Stream session not found"
        )

    # Parse session info
    session_info = json.loads(session_data)
    chat_id = session_info["chat_id"]
    message_id = session_info["message_id"]

    # For debug
    print(
        f"Starting SSE stream for session {session_id}, message {message_id}, chat {chat_id}"
    )

    # Define the SSE streaming response generator
    async def sse_generator():
        full_content = ""
        client = await get_meilisearch_client()

        try:
            # Start reading from the beginning of the stream
            last_id = "0"

            # Stream messages from Redis Stream
            async for event in read_stream_messages(session_id, last_id):
                # Extract data from the event
                event_type = event.get("type")
                content = event.get("content", "")
                is_done = event.get("done") == "true" or event_type == "end"
                error = event.get("error")

                # For token events, accumulate the content
                if event_type == "token" and content:
                    full_content += content

                # For end events, use the full_content if available
                if is_done and "full_content" in event:
                    full_content = event.get("full_content", full_content)

                # Prepare the event data for the client
                client_event = {
                    "content": content,
                    "done": is_done,  # Convertit en booléen pour JSON
                }

                if is_done:
                    client_event["id"] = message_id

                if error:
                    client_event["error"] = error

                # Send the event
                yield f"data: {json.dumps(client_event)}\n\n"

                # If this is the last event, save the complete message
                if is_done:
                    try:
                        # Save the assistant's message to Meilisearch
                        assistant_message = {
                            "id": message_id,
                            "chat_id": chat_id,
                            "role": "assistant",
                            "content": full_content,
                            "created_at": int(time.time()),
                        }

                        await client.index(settings.MESSAGE_INDEX).add_documents(
                            [assistant_message]
                        )
                        print(f"Saved complete message {message_id} to Meilisearch")
                    except Exception as e:
                        print(f"Error saving message to Meilisearch: {e}")

                    break

        except Exception as e:
            print(f"Error in SSE generator: {e}")
            yield f"data: {json.dumps({'error': str(e), 'done': True})}\n\n"

    # Return a streaming response
    return StreamingResponse(
        sse_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Important for NGINX proxying
        },
    )


@router.delete("/{chat_id}")
async def delete_chat(
    chat_id: str, current_user: User = Depends(get_current_active_user)
):
    client = await get_meilisearch_client()

    # Verify that the chat exists and belongs to the user
    chat_result = await client.index(settings.CHAT_INDEX).search(
        filter=f"id = {chat_id} AND user_id = {current_user.id}", limit=1
    )

    if not chat_result.hits:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found"
        )

    # Delete associated messages
    await client.index(settings.MESSAGE_INDEX).delete_documents(
        {"filter": f"chat_id = {chat_id}"}
    )

    # Delete the chat
    await client.index(settings.CHAT_INDEX).delete_document(chat_id)

    return {"message": "Chat deleted successfully"}
