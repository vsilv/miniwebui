import os
from dotenv import load_dotenv

load_dotenv()  # Charge les variables d'environnement depuis un fichier .env

class Settings:
    API_PREFIX = "/api"
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 jours

    # CORS
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

    # Meilisearch
    MEILISEARCH_URL = os.getenv("MEILISEARCH_URL", "http://localhost:7700")
    MEILISEARCH_API_KEY = os.getenv("MEILISEARCH_API_KEY", "")

    # Redis for streaming
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Google API
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
    
    # Legacy LLM API (kept for backward compatibility)
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    OPENAI_API_BASE = os.getenv("OPENAI_API_BASE", "")
    OLLAMA_API_BASE = os.getenv("OLLAMA_API_BASE", "http://localhost:11434")

    # Meilisearch Indexes
    USER_INDEX = "users"
    CHAT_INDEX = "chats"
    MESSAGE_INDEX = "messages"
    DOCUMENT_INDEX = "documents"
    VECTOR_INDEX = "vectors"
    MODEL_INDEX = "models"
    STREAM_SESSIONS_INDEX = "stream_sessions"

settings = Settings()