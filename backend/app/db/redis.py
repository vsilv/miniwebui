import redis.asyncio as redis
from app.core.config import settings

redis_client = None

def get_redis_client():
    global redis_client
    if redis_client is None:
        redis_client = redis.Redis.from_url(settings.REDIS_URL)
    return redis_client