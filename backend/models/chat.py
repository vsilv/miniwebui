from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import time
import uuid

class MessageBase(BaseModel):
    role: str  # "user", "assistant", "system"
    content: str
    
class MessageCreate(MessageBase):
    pass
    
class Message(MessageBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    chat_id: str
    created_at: int = Field(default_factory=lambda:int(time.time()))
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    
class ChatBase(BaseModel):
    title: Optional[str] = None
    model: str
    
class ChatCreate(ChatBase):
    system_prompt: Optional[str] = None
    
class ChatUpdate(BaseModel):
    title: Optional[str] = None
    model: Optional[str] = None
    system_prompt: Optional[str] = None
    
class Chat(ChatBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    created_at: int = Field(default_factory=lambda:int(time.time()))
    updated_at: int = Field(default_factory=lambda:int(time.time()))
    system_prompt: Optional[str] = None
    
    class Config:
        from_attributes = True
        
class ChatWithMessages(Chat):
    messages: List[Message] = []

class ChatResponse(BaseModel):
    id: str
    content: str
    created_at: int
    metadata: Optional[Dict[str, Any]] = None