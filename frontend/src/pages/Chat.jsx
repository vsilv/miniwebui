import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { toast } from 'react-hot-toast';

import Messages from '../components/chat/Messages';
import MessageInput from '../components/chat/MessageInput';
import ChatHeader from '../components/chat/ChatHeader';
import WelcomeScreen from '../components/chat/WelcomeScreen';
import { currentChat, fetchChat, createChat, models, fetchModels } from '../store/chatStore';

const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const $currentChat = useStore(currentChat);
  const $models = useStore(models);
  const [isLoading, setIsLoading] = useState(false);
  
  // Récupérer les modèles disponibles
  useEffect(() => {
    const loadModels = async () => {
      if ($models.length === 0) {
        try {
          await fetchModels();
        } catch (error) {
          console.error('Erreur lors du chargement des modèles:', error);
          toast.error('Erreur lors du chargement des modèles');
        }
      }
    };
    
    loadModels();
  }, []);
  
  // Charger le chat sélectionné
  useEffect(() => {
    const loadChat = async () => {
      if (chatId) {
        try {
          setIsLoading(true);
          await fetchChat(chatId);
          setIsLoading(false);
        } catch (error) {
          console.error(`Erreur lors du chargement du chat ${chatId}:`, error);
          toast.error('Erreur lors du chargement de la conversation');
          setIsLoading(false);
          navigate('/');
        }
      }
    };
    
    loadChat();
  }, [chatId, navigate]);
  
  // Fonction pour créer un nouveau chat
  const handleNewChat = async () => {
    try {
      setIsLoading(true);
      const newChat = await createChat();
      navigate(`/chat/${newChat.id}`);
      setIsLoading(false);
    } catch (error) {
      console.error('Erreur lors de la création du chat:', error);
      toast.error('Erreur lors de la création de la conversation');
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {!chatId || isLoading ? (
        <WelcomeScreen onNewChat={handleNewChat} isLoading={isLoading} />
      ) : (
        <>
          <ChatHeader title={$currentChat.title} />
          
          <div className="flex-1 overflow-hidden flex flex-col px-4 py-2">
            <Messages messages={$currentChat.messages} isLoading={$currentChat.isLoading} />
            
            <MessageInput 
              chatId={chatId} 
              isLoading={$currentChat.isLoading} 
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Chat;