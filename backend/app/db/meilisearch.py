from meilisearch_python_sdk import AsyncClient
from app.core.config import settings

meilisearch_client = None


async def get_meilisearch_client() -> AsyncClient:
    global meilisearch_client
    if meilisearch_client is None:
        await init_meilisearch()
    return meilisearch_client


async def init_meilisearch():
    print("init meili...")
    global meilisearch_client

    meilisearch_client = AsyncClient(
        url=settings.MEILISEARCH_URL, api_key=settings.MEILISEARCH_API_KEY
    )

    # Initialiser les index si nécessaire
    indexes = [
        settings.USER_INDEX,
        settings.CHAT_INDEX,
        settings.MESSAGE_INDEX,
        settings.DOCUMENT_INDEX,
        settings.VECTOR_INDEX,
        settings.MODEL_INDEX,
        settings.STREAM_SESSIONS_INDEX,
    ]

    for index_name in indexes:
        print(index_name)
        try:
            # Vérifier si l'index existe déjà
            await meilisearch_client.get_index(index_name)

            # Configurer les paramètres de recherche pour chaque index
            if index_name == settings.USER_INDEX:
                print("update user...")
                await meilisearch_client.index(index_name).update_filterable_attributes(
                    ["id", "username", "email"]
                )
                await meilisearch_client.index(index_name).update_sortable_attributes(
                    ["created_at", "updated_at"]
                )
            elif index_name == settings.CHAT_INDEX:
                await meilisearch_client.index(index_name).update_filterable_attributes(
                    ["id", "title", "description", "user_id"]
                )
                await meilisearch_client.index(index_name).update_sortable_attributes(
                    ["created_at", "updated_at"]
                )
            elif index_name == settings.MESSAGE_INDEX:
                await meilisearch_client.index(index_name).update_filterable_attributes(
                    ["id", "content", "chat_id"]
                )
                await meilisearch_client.index(index_name).update_sortable_attributes(
                    ["created_at", "updated_at"]
                )
            elif index_name == settings.DOCUMENT_INDEX:
                await meilisearch_client.index(index_name).update_filterable_attributes(
                    ["id", "title", "content"]
                )
                await meilisearch_client.index(index_name).update_sortable_attributes(
                    ["created_at", "updated_at"]
                )
            elif index_name == settings.MODEL_INDEX:
                await meilisearch_client.index(index_name).update_filterable_attributes(
                    ["id"]
                )
                await meilisearch_client.index(index_name).update_sortable_attributes(
                    ["created_at", "updated_at"]
                )
            elif index_name == settings.STREAM_SESSIONS_INDEX:
                await meilisearch_client.index(index_name).update_filterable_attributes(
                    ["id", "user_id"]
                )
                await meilisearch_client.index(index_name).update_sortable_attributes(
                    ["created_at", "updated_at"]
                )

        except Exception:
            # Créer l'index s'il n'existe pas
            print("create index...")
            await meilisearch_client.create_index(index_name, primary_key="id")


async def close_meilisearch():
    global meilisearch_client
    if meilisearch_client:
        await meilisearch_client.aclose()
        meilisearch_client = None
