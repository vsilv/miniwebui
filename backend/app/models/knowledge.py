from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
import time

class DocumentBase(BaseModel):
    title: str
    content: str
    
class DocumentCreate(DocumentBase):
    metadata: Optional[Dict[str, Any]] = None
    
class Document(DocumentBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    created_at: int = Field(default_factory=lambda:int(time.time()))
    updated_at: int = Field(default_factory=lambda:int(time.time()))
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    class Config:
        from_attributes = True
        
class VectorBase(BaseModel):
    text_chunk: str
    vector: List[float]
    
class VectorCreate(VectorBase):
    document_id: str
    metadata: Optional[Dict[str, Any]] = None
    
class Vector(VectorBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    document_id: str
    created_at: int = Field(default_factory=lambda:int(time.time()))
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    class Config:
        from_attributes = True
        
class DocumentUpload(BaseModel):
    title: str
    file_path: str
    metadata: Optional[Dict[str, Any]] = None
    
class SearchQuery(BaseModel):
    query: str
    limit: int = 5