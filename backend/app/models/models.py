from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import time
import uuid


class ModelBase(BaseModel):
    name: str
    provider: str  # "openai", "ollama", etc.


class ModelCreate(ModelBase):
    model_id: str  # ID externe (ex: "gpt-4" pour OpenAI, "llama2" pour Ollama)
    description: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None


class ModelUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None


class Model(ModelBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    model_id: str
    description: Optional[str] = None
    settings: Dict[str, Any] = Field(default_factory=dict)
    created_at: int = Field(default_factory=lambda:int(time.time()))
    updated_at: int = Field(default_factory=lambda:int(time.time()))

    class Config:
        from_attributes = True


class ModelList(BaseModel):
    models: List[Model]


class CompletionRequest(BaseModel):
    model: str
    session_id: str
    messages: List[Dict[str, str]]
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = None
    top_p: Optional[float] = 1.0
    stream: Optional[bool] = False


class CompletionResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created_at: int = Field(default_factory=lambda: int(time.time()))
    model: str
    choices: List[Dict[str, Any]]
    usage: Dict[str, int] = Field(
        default_factory=lambda: {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0,
        }
    )
