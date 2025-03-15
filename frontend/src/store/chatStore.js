import { atom, map } from 'nanostores';
import api from '../api/config';

// Stores pour les chats
export const chats = atom([]);
export const currentChat = map({
  id: null,
  messages: [],
  title: '',
  model: '',
  isLoading: false
});

// Modèles disponibles
export const models = atom([]);
export const selectedModel = atom('gpt-3.5-turbo');

// Fonctions pour obtenir les chats
export const fetchChats = async () => {
  try {
    const response = await api.get('chat').json();
    chats.set(response);
    return response;
  } catch (error) {
    console.error('Erreur lors de la récupération des chats:', error);
    return [];
  }
};

// Fonction pour créer un nouveau chat
export const createChat = async (model = 'gpt-3.5-turbo', systemPrompt = null) => {
  try {
    currentChat.setKey('isLoading', true);
    
    const data = {
      title: 'Nouvelle conversation',
      model,
      system_prompt: systemPrompt
    };
    
    const response = await api.post('chat', { json: data }).json();
    const newChat = response;
    
    // Mettre à jour la liste des chats
    const currentChats = chats.get();
    chats.set([newChat, ...currentChats]);
    
    // Mettre à jour le chat actuel
    currentChat.set({
      id: newChat.id,
      title: newChat.title,
      model: newChat.model,
      messages: [],
      isLoading: false
    });
    
    return newChat;
  } catch (error) {
    console.error('Erreur lors de la création du chat:', error);
    currentChat.setKey('isLoading', false);
    throw error;
  }
};

// Fonction pour obtenir un chat et ses messages
export const fetchChat = async (chatId) => {
  try {
    currentChat.setKey('isLoading', true);
    
    const response = await api.get(`chat/${chatId}`).json();
    const chatData = response;
    
    currentChat.set({
      id: chatData.id,
      title: chatData.title,
      model: chatData.model,
      messages: chatData.messages,
      isLoading: false
    });
    
    return chatData;
  } catch (error) {
    console.error(`Erreur lors de la récupération du chat ${chatId}:`, error);
    currentChat.setKey('isLoading', false);
    throw error;
  }
};

// Fonction pour envoyer un message
export const sendMessage = async (content) => {
  const chatId = currentChat.get().id;
  if (!chatId) return null;
  
  try {
    currentChat.setKey('isLoading', true);
    
    // Ajouter le message de l'utilisateur localement
    const userMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString()
    };
    
    const currentMessages = currentChat.get().messages;
    currentChat.setKey('messages', [...currentMessages, userMessage]);
    

    // Envoyer le message à l'API
    // Mode standard (non-streaming)
    const messageData = {
      role: 'user',
      content
    };
    
    const response = await api.post(`chat/${chatId}/messages`, { json: messageData }).json();
    const assistantResponse = response;
    
    // Ajouter la réponse de l'assistant
    const assistantMessage = {
      id: assistantResponse.id,
      role: 'assistant',
      content: assistantResponse.content,
      created_at: assistantResponse.created_at
    };
    
    currentChat.setKey('messages', [...currentChat.get().messages, assistantMessage]);
    currentChat.setKey('isLoading', false);
    
    return assistantMessage;

  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    currentChat.setKey('isLoading', false);
    throw error;
  }
};

// Fonction pour supprimer un chat
export const deleteChat = async (chatId) => {
  try {
    await api.delete(`chat/${chatId}`);
    
    // Mettre à jour la liste des chats
    const updatedChats = chats.get().filter(chat => chat.id !== chatId);
    chats.set(updatedChats);
    
    // Si le chat supprimé était le chat actuel, réinitialiser le chat actuel
    if (currentChat.get().id === chatId) {
      currentChat.set({
        id: null,
        messages: [],
        title: '',
        model: '',
        isLoading: false
      });
    }
    
    return true;
  } catch (error) {
    console.error(`Erreur lors de la suppression du chat ${chatId}:`, error);
    throw error;
  }
};

// Fonction pour obtenir les modèles disponibles
export const fetchModels = async () => {
  try {
    const response = await api.get('models').json();
    models.set(response);
    return response;
  } catch (error) {
    console.error('Erreur lors de la récupération des modèles:', error);
    return [];
  }
};
