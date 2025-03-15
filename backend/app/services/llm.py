import aiohttp
import json
from typing import Dict, Any, AsyncGenerator

from app.models.models import CompletionRequest
from app.core.config import settings

async def get_completion(request: CompletionRequest) -> Dict[str, Any]:
    """
    Obtient une réponse de complétion du modèle LLM configuré.
    Gère les API OpenAI et Ollama.
    """
    if request.model.startswith("gpt-") or request.provider == "openai":
        return await get_openai_completion(request)
    else:
        return await get_ollama_completion(request)

async def get_streaming_completion(request: CompletionRequest) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Obtient une réponse de complétion en streaming du modèle LLM configuré.
    Gère les API OpenAI et Ollama.
    """
    if request.model.startswith("gpt-") or request.provider == "openai":
        async for chunk in get_openai_streaming_completion(request):
            yield chunk
    else:
        async for chunk in get_ollama_streaming_completion(request):
            yield chunk

async def get_openai_completion(request: CompletionRequest) -> Dict[str, Any]:
    """
    Obtient une complétion de l'API OpenAI.
    """
    api_base = settings.OPENAI_API_BASE or "https://api.openai.com/v1"
    api_endpoint = f"{api_base}/chat/completions"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}"
    }
    
    payload = {
        "model": request.model,
        "messages": request.messages,
        "temperature": request.temperature,
        "stream": False
    }
    
    if request.max_tokens:
        payload["max_tokens"] = request.max_tokens
    
    if request.top_p:
        payload["top_p"] = request.top_p
    
    async with aiohttp.ClientSession() as session:
        async with session.post(api_endpoint, headers=headers, json=payload) as response:
            if response.status != 200:
                error_detail = await response.text()
                raise Exception(f"OpenAI API error: {response.status} - {error_detail}")
            
            return await response.json()

async def get_openai_streaming_completion(request: CompletionRequest) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Obtient une complétion en streaming de l'API OpenAI.
    """
    api_base = settings.OPENAI_API_BASE or "https://api.openai.com/v1"
    api_endpoint = f"{api_base}/chat/completions"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}"
    }
    
    payload = {
        "model": request.model,
        "messages": request.messages,
        "temperature": request.temperature,
        "stream": True
    }
    
    if request.max_tokens:
        payload["max_tokens"] = request.max_tokens
    
    if request.top_p:
        payload["top_p"] = request.top_p
    
    async with aiohttp.ClientSession() as session:
        async with session.post(api_endpoint, headers=headers, json=payload) as response:
            if response.status != 200:
                error_detail = await response.text()
                raise Exception(f"OpenAI API error: {response.status} - {error_detail}")
            
            async for line in response.content:
                line = line.decode('utf-8').strip()
                if line.startswith("data: "):
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data)
                        yield chunk
                    except json.JSONDecodeError:
                        pass

async def get_ollama_completion(request: CompletionRequest) -> Dict[str, Any]:
    """
    Obtient une complétion de l'API Ollama.
    """
    api_endpoint = f"{settings.OLLAMA_API_BASE}/api/chat"
    
    # Convertir le format OpenAI en format Ollama
    payload = {
        "model": request.model,
        "messages": request.messages,
        "stream": False,
        "options": {
            "temperature": request.temperature,
        }
    }
    
    if request.max_tokens:
        payload["options"]["num_predict"] = request.max_tokens
    
    if request.top_p:
        payload["options"]["top_p"] = request.top_p
    
    async with aiohttp.ClientSession() as session:
        async with session.post(api_endpoint, json=payload) as response:
            if response.status != 200:
                error_detail = await response.text()
                raise Exception(f"Ollama API error: {response.status} - {error_detail}")
            
            ollama_response = await response.json()
            
            # Convertir la réponse Ollama au format OpenAI
            return {
                "id": "ollama-" + ollama_response.get("id", ""),
                "object": "chat.completion",
                "created": ollama_response.get("created_at", 0),
                "model": request.model,
                "choices": [
                    {
                        "index": 0,
                        "message": {
                            "role": "assistant",
                            "content": ollama_response.get("message", {}).get("content", "")
                        },
                        "finish_reason": "stop"
                    }
                ],
                "usage": {
                    "prompt_tokens": ollama_response.get("prompt_eval_count", 0),
                    "completion_tokens": ollama_response.get("eval_count", 0),
                    "total_tokens": (
                        ollama_response.get("prompt_eval_count", 0) + 
                        ollama_response.get("eval_count", 0)
                    )
                }
            }

async def get_ollama_streaming_completion(request: CompletionRequest) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Obtient une complétion en streaming de l'API Ollama.
    """
    api_endpoint = f"{settings.OLLAMA_API_BASE}/api/chat"
    
    # Convertir le format OpenAI en format Ollama
    payload = {
        "model": request.model,
        "messages": request.messages,
        "stream": True,
        "options": {
            "temperature": request.temperature,
        }
    }
    
    if request.max_tokens:
        payload["options"]["num_predict"] = request.max_tokens
    
    if request.top_p:
        payload["options"]["top_p"] = request.top_p
    
    async with aiohttp.ClientSession() as session:
        async with session.post(api_endpoint, json=payload) as response:
            if response.status != 200:
                error_detail = await response.text()
                raise Exception(f"Ollama API error: {response.status} - {error_detail}")
            
            content_so_far = ""
            
            async for line in response.content:
                line = line.decode('utf-8').strip()
                try:
                    chunk = json.loads(line)
                    
                    # Extraire le contenu du chunk
                    chunk_content = chunk.get("message", {}).get("content", "")
                    content_so_far += chunk_content
                    
                    # Convertir au format OpenAI
                    openai_format = {
                        "id": "ollama-" + chunk.get("id", ""),
                        "object": "chat.completion.chunk",
                        "created": chunk.get("created_at", 0),
                        "model": request.model,
                        "choices": [
                            {
                                "index": 0,
                                "delta": {
                                    "content": chunk_content
                                },
                                "finish_reason": None
                            }
                        ]
                    }
                    
                    if chunk.get("done", False):
                        openai_format["choices"][0]["finish_reason"] = "stop"
                    
                    yield openai_format
                    
                except json.JSONDecodeError:
                    pass