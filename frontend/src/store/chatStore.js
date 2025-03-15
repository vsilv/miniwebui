// src/store/chatStore.js
import { atom, map } from 'nanostores';
import api from '../api/config';

// Stores for chats
export const chats = atom([]);
export const currentChat = map({
  id: null,
  messages: [],
  title: '',
  model: '',
  isLoading: false
});

// Available models
export const models = atom([]);
export const selectedModel = atom('gpt-3.5-turbo');

// Fetch all chats
export const fetchChats = async () => {
  try {
    const response = await api.get('chat').json();
    chats.set(response);
    return response;
  } catch (error) {
    console.error('Error fetching chats:', error);
    return [];
  }
};

// Create a new chat
export const createChat = async (model = 'gpt-3.5-turbo', systemPrompt = null) => {
  try {
    currentChat.setKey('isLoading', true);
    
    const data = {
      title: 'New conversation',
      model,
      system_prompt: systemPrompt
    };
    
    const response = await api.post('chat', { json: data }).json();
    const newChat = response;
    
    // Update chats list
    const currentChats = chats.get();
    chats.set([newChat, ...currentChats]);
    
    // Update current chat
    currentChat.set({
      id: newChat.id,
      title: newChat.title,
      model: newChat.model,
      messages: [],
      isLoading: false
    });
    
    return newChat;
  } catch (error) {
    console.error('Error creating chat:', error);
    currentChat.setKey('isLoading', false);
    throw error;
  }
};

// Fetch a specific chat and its messages
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
    console.error(`Error fetching chat ${chatId}:`, error);
    currentChat.setKey('isLoading', false);
    throw error;
  }
};

// Send a message
export const sendMessage = async (content, streaming = false) => {
  const chatId = currentChat.get().id;
  if (!chatId) return null;
  
  try {
    currentChat.setKey('isLoading', true);
    
    // Add user message locally
    const userMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      created_at: Date.now()
    };
    
    const currentMessages = currentChat.get().messages;
    currentChat.setKey('messages', [...currentMessages, userMessage]);
    
    // Prepare message data
    const messageData = {
      role: 'user',
      content
    };
    
    let endpoint = streaming ? `chat/${chatId}/messages/stream` : `chat/${chatId}/messages`;
    
    // Send message to API (non-streaming mode)
    if (!streaming) {
      const response = await api.post(endpoint, { json: messageData }).json();
      const assistantResponse = response;
      
      // Add assistant response
      const assistantMessage = {
        id: assistantResponse.id,
        role: 'assistant',
        content: assistantResponse.content,
        created_at: assistantResponse.created_at
      };
      
      currentChat.setKey('messages', [...currentChat.get().messages, assistantMessage]);
      currentChat.setKey('isLoading', false);
      
      return assistantMessage;
    } else {
      // TODO: Implement streaming logic if needed
      // For now, just use non-streaming approach
      return await sendMessage(content, false);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    currentChat.setKey('isLoading', false);
    throw error;
  }
};

// Delete a chat
export const deleteChat = async (chatId) => {
  try {
    await api.delete(`chat/${chatId}`);
    
    // Update chats list
    const updatedChats = chats.get().filter(chat => chat.id !== chatId);
    chats.set(updatedChats);
    
    // Reset current chat if it was the deleted one
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
    console.error(`Error deleting chat ${chatId}:`, error);
    throw error;
  }
};

// Fetch available models
export const fetchModels = async () => {
  try {
    const response = await api.get('models').json();
    models.set(response);
    return response;
  } catch (error) {
    console.error('Error fetching models:', error);
    return [];
  }
};