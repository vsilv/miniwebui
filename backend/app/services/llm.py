from typing import Dict, Any, AsyncGenerator, List, Optional
import os
import asyncio
import json
import time
import uuid
import redis.asyncio as redis
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.callbacks.base import BaseCallbackHandler
from langchain.schema import HumanMessage, AIMessage, SystemMessage

from app.models.models import CompletionRequest
from app.core.config import settings

# Initialize Redis client
redis_client = redis.Redis.from_url(settings.REDIS_URL)

class RedisStreamHandler(BaseCallbackHandler):
    """Custom callback handler that stores tokens in Redis Stream"""
    
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.full_response = ""
        self.start_time = time.time()
    
    async def on_llm_new_token(self, token: str, **kwargs: Any) -> None:
        """Process new token by adding it to the Redis Stream"""
        self.full_response += token
        
        # Add token to Redis Stream
        # Key format: stream:{session_id}
        try:
            await redis_client.xadd(
                f"stream:{self.session_id}", 
                {
                    "type": "token",
                    "content": token,
                    "full_content": self.full_response,
                    "timestamp": time.time()
                },
                maxlen=1000  # Keep at most 1000 entries
            )
        except Exception as e:
            print(f"Error adding token to Redis Stream: {e}")
    
    async def on_llm_end(self, response: Any, **kwargs: Any) -> None:
        """Handle the end of LLM generation"""
        # Add completion event to Redis
        try:
            await redis_client.xadd(
                f"stream:{self.session_id}", 
                {
                    "type": "end",
                    "content": "",
                    "full_content": self.full_response,
                    "done": "true",
                    "timestamp": time.time(),
                    "total_time": time.time() - self.start_time
                }
            )
            
            # Set an expiration on the stream
            await redis_client.expire(f"stream:{self.session_id}", 3600)  # 1 hour expiration
        except Exception as e:
            print(f"Error adding completion event to Redis Stream: {e}")
    
    async def on_llm_error(self, error: Exception, **kwargs: Any) -> None:
        """Handle errors during LLM generation"""
        # Add error event to Redis
        try:
            await redis_client.xadd(
                f"stream:{self.session_id}", 
                {
                    "type": "error",
                    "content": "",
                    "error": str(error),
                    "timestamp": time.time()
                }
            )
        except Exception as e:
            print(f"Error adding error event to Redis Stream: {e}")


def convert_messages_to_langchain_format(messages: List[Dict[str, str]]):
    """Convert messages from API format to Langchain format"""
    langchain_messages = []
    
    for message in messages:
        role = message.get("role", "")
        content = message.get("content", "")
        
        # Skip empty messages
        if not content:
            continue
            
        if role == "user":
            langchain_messages.append(HumanMessage(content=content))
        elif role == "assistant":
            langchain_messages.append(AIMessage(content=content))
        elif role == "system":
            langchain_messages.append(SystemMessage(content=content))
    
    # Make sure we have at least one message
    if not langchain_messages:
        # Add a default message if nothing is valid
        langchain_messages.append(HumanMessage(content="Hello"))
    
    return langchain_messages


async def get_completion(request: CompletionRequest) -> Dict[str, Any]:
    """
    Get a completion from the Gemini model using Langchain.
    Returns the full response at once.
    """
    # Set up the model
    model = ChatGoogleGenerativeAI(
        model=request.model,
        temperature=request.temperature,
        max_tokens=request.max_tokens,
        google_api_key=settings.GOOGLE_API_KEY,
    )
    
    # Convert messages to langchain format
    langchain_messages = convert_messages_to_langchain_format(request.messages)
    
    try:
        # Get completion
        result = await model.ainvoke(langchain_messages)
        content = result.content
        
        # Format response to match expected API format
        response = {
            "id": "gemini-" + model.model,
            "object": "chat.completion",
            "created": int(time.time()),
            "model": request.model,
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": content
                    },
                    "finish_reason": "stop"
                }
            ],
            "usage": {
                "prompt_tokens": 0,  # We don't have accurate token counts
                "completion_tokens": 0,
                "total_tokens": 0
            }
        }
        
        return response
    except Exception as e:
        print(f"Error in get_completion: {e}")
        # Return an error response
        return {
            "id": "gemini-error",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": request.model,
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": f"I'm sorry, but an error occurred: {str(e)}"
                    },
                    "finish_reason": "error"
                }
            ],
            "error": str(e)
        }


async def start_streaming_completion(request: CompletionRequest) -> str:
    """
    Start a streaming completion and return a session ID to track it.
    The actual streaming is handled via Redis Streams.
    """
    # Generate a unique session ID for this completion
    session_id = str(uuid.uuid4())
    
    # Set up the Redis Stream handler
    handler = RedisStreamHandler(session_id)
    
    # Set up the model with the handler
    model = ChatGoogleGenerativeAI(
        model=request.model,
        temperature=request.temperature,
        max_tokens=request.max_tokens,
        google_api_key=settings.GOOGLE_API_KEY,
        streaming=True,
        callbacks=[handler],
    )
    
    # Convert messages to langchain format
    langchain_messages = convert_messages_to_langchain_format(request.messages)
    
    # Debug information
    print(f"Starting streaming completion with session_id: {session_id}")
    print(f"Request messages count: {len(request.messages)}")
    print(f"Langchain messages count: {len(langchain_messages)}")
    
    # Create an initial entry in the stream 
    try:
        await redis_client.xadd(
            f"stream:{session_id}", 
            {
                "type": "start",
                "timestamp": time.time(),
                "model": request.model
            }
        )
    except Exception as e:
        print(f"Error adding initial entry to Redis Stream: {e}")
    
    # Start generation in a background task
    task = asyncio.create_task(model.ainvoke(langchain_messages))
    
    # Add error handling for the task
    def handle_task_exception(task):
        try:
            exc = task.exception()
            if exc:
                print(f"Task error: {exc}")
                # Send error to Redis
                asyncio.create_task(handler.on_llm_error(exc))
        except asyncio.CancelledError:
            print("Generation task was cancelled")
        except Exception as e:
            print(f"Error handling task exception: {e}")
    
    task.add_done_callback(handle_task_exception)
    
    return session_id


async def read_stream_messages(session_id: str, last_id: str = "0") -> AsyncGenerator[Dict[str, Any], None]:
    """
    Read messages from a Redis Stream for a given session ID.
    Yields events as they become available.
    """
    try:
        stream_key = f"stream:{session_id}"
        done = False
        
        while not done:
            # Read from the stream with a timeout
            try:
                items = await redis_client.xread(
                    streams={stream_key: last_id}, 
                    count=10,
                    block=3000  # Block for 3 seconds
                )
            except Exception as e:
                print(f"Error reading from Redis Stream: {e}")
                yield {"error": str(e), "done": True}
                return
                
            # If we have items, process them
            if items:
                for stream_name, messages in items:
                    for message_id, fields in messages:
                        # Update last_id for the next iteration
                        last_id = message_id
                        
                        # Decode the field values from bytes to strings
                        decoded_fields = {k.decode(): v.decode() if isinstance(v, bytes) else v for k, v in fields.items()}
                        
                        # Prepare the event data
                        event_data = {
                            "id": message_id.decode(),
                            **decoded_fields
                        }
                        
                        # Check if this is the end message
                        if decoded_fields.get("type") == "end" or decoded_fields.get("done") == "true":
                            done = True
                        
                        # Yield the event data
                        yield event_data
            else:
                # Check if the stream exists
                exists = await redis_client.exists(stream_key)
                if not exists:
                    print(f"Stream {stream_key} no longer exists")
                    yield {"error": "Stream no longer exists", "done": True}
                    return
    except Exception as e:
        print(f"Error reading from Redis Stream: {e}")
        yield {"error": str(e), "done": True}