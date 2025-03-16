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
  createChat,
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
  const isCreatingNewChat = isLoading && !chatId;
  const { isCreatingChat, handleNewChat } = useChat();


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
        } catch (error) {
          console.error(`Erreur lors du chargement du chat ${chatId}:`, error);
          toast.error("Erreur lors du chargement de la conversation");
          setIsLoading(false);
          navigate("/");
        }
      }
    };

    loadChat();
  }, [chatId, navigate]);



  return (
    <div className="h-full flex flex-col">
      {!chatId || (isLoading && !isCreatingChat) ? (
        <WelcomeScreen onNewChat={handleNewChat} isLoading={isCreatingChat} />
      ) : isCreatingNewChat ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              Chargement...
            </p>
          </div>
        </div>
      ) : (
        <>
          <ChatHeader title={$currentChat.title} />

          <div className="flex-1 overflow-hidden flex flex-col px-4 py-2">
            <Messages
              messages={$currentChat.messages}
              isLoading={$currentChat.isLoading}
            />

            <MessageInput chatId={chatId} isLoading={$currentChat.isLoading} />
          </div>
        </>
      )}
    </div>
  );
};

export default Chat;
