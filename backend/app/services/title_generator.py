from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from app.core.config import settings
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

async def generate_chat_title(messages: List[Dict[str, Any]]):
    """
    Génère un titre pour la conversation en utilisant les messages existants.
    
    Args:
        messages: Liste des messages dans le format API (list de dict avec 'role' et 'content')
        
    Returns:
        str: Titre généré pour la conversation
    """
    try:
        # Configurer le modèle Gemini
        model = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-lite",  # Modèle le plus rapide pour cette tâche simple
            temperature=0.3,  # Température plus basse pour des titres plus déterministes
            google_api_key=settings.GOOGLE_API_KEY,
        )
        
        # Extraire les messages de la conversation
        conversation_content = "\n".join([
            f"{msg['role']}: {msg['content']}" for msg in messages if msg['role'] != "system"
        ])
        
        # Créer un prompt système qui demande un titre concis
        system_message = SystemMessage(
            content="""
            Tu es un assistant qui génère des titres pertinents pour des conversations.
            À partir des messages que je vais te fournir, crée un titre court (5 mots maximum), 
            précis et pertinent qui résume le sujet principal de la conversation.
            Réponds uniquement avec le titre, sans ponctuation ni guillemets.
            """
        )
        
        # Ajouter les messages de la conversation comme message utilisateur
        user_message = HumanMessage(
            content=f"Voici le début d'une conversation, génère un titre pertinent:\n\n{conversation_content}"
        )
        
        # Obtenir le titre généré
        result = await model.ainvoke([system_message, user_message])
        
        # Extraire et nettoyer le titre
        title = result.content.strip()
        
        # Limiter la longueur du titre
        if len(title) > 50:
            title = title[:47] + "..."
            
        logger.info(f"Titre généré: {title}")
        return title
        
    except Exception as e:
        logger.error(f"Erreur lors de la génération du titre: {e}")
        return "Nouvelle conversation"  # Titre par défaut en cas d'erreur