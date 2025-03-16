from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import uuid
import time


class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None


class Project(ProjectBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    created_at: int = Field(default_factory=lambda: int(time.time()))
    updated_at: int = Field(default_factory=lambda: int(time.time()))
    instructions: Optional[str] = None
    
    class Config:
        from_attributes = True


class ProjectWithFiles(Project):
    files: List[Dict[str, Any]] = []


class ProjectFile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    user_id: str
    filename: str
    file_type: str
    file_size: int
    created_at: int = Field(default_factory=lambda: int(time.time()))
    updated_at: int = Field(default_factory=lambda: int(time.time()))
    
    class Config:
        from_attributes = True
