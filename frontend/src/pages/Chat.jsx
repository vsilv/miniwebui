import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "@nanostores/react";
import { toast } from "react-hot-toast";

import Messages from "../components/chat/Messages";
import MessageInput from "../components/chat/MessageInput";
import ChatHeader from "../components/chat/ChatHeader";
import WelcomeScreen from "../components/chat/WelcomeScreen";
import {
  currentChat,
  fetchChat,
  models,
  fetchModels,
} from "../store/chatStore";
import { useChat } from '../hooks/useChat';

const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const $currentChat = useStore(currentChat);
  const $models = useStore(models);
  const [isLoading, setIsLoading] = useState(false);
  const { isCreatingChat, handleNewChat } = useChat();

  // Explicitly track if a chat is being created to prevent welcome screen flash
  const [isNavigatingToNewChat, setIsNavigatingToNewChat] = useState(false);

  // Handle creating a new chat with proper state management
  const handleCreateChat = async () => {
    // Set navigating state to prevent welcome screen from showing
    setIsNavigatingToNewChat(true);
    await handleNewChat();
  };

  // Récupérer les modèles disponibles
  useEffect(() => {
    const loadModels = async () => {
      if ($models.length === 0) {
        try {
          await fetchModels();
        } catch (error) {
          console.error("Erreur lors du chargement des modèles:", error);
          toast.error("Erreur lors du chargement des modèles");
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
          // We have a chat ID, so we're not creating a new chat anymore
          setIsNavigatingToNewChat(false);
        } catch (error) {
          console.error(`Erreur lors du chargement du chat ${chatId}:`, error);
          toast.error("Erreur lors du chargement de la conversation");
          setIsLoading(false);
          setIsNavigatingToNewChat(false);
          navigate("/");
        }
      } else {
        // No chat ID and not creating a new chat, so we can show welcome screen
        if (!isNavigatingToNewChat) {
          setIsLoading(false);
        }
      }
    };

    loadChat();
  }, [chatId, navigate]);

  // Decide what to render based on current state
  const renderContent = () => {
    // Case 1: No chat ID and not creating/navigating to new chat - show welcome screen
    if (!chatId && !isNavigatingToNewChat) {
      return <WelcomeScreen onNewChat={handleCreateChat} isLoading={isCreatingChat} />;
    }
    
    // Case 2: Loading state - show loading spinner
    if ((isLoading || isCreatingChat || isNavigatingToNewChat) && (!$currentChat.id || $currentChat.id !== chatId)) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              Chargement...
            </p>
          </div>
        </div>
      );
    }
    
    // Case 3: Chat loaded - show chat interface
    return (
      <>
        <ChatHeader />
        <div className="flex-1 overflow-hidden flex flex-col px-4 py-2">
          <Messages
            messages={$currentChat.messages}
            isLoading={$currentChat.isLoading}
          />
          <MessageInput chatId={chatId} isLoading={$currentChat.isLoading} />
        </div>
      </>
    );
  };

  return <div className="h-full flex flex-col">{renderContent()}</div>;
};

export default Chat;