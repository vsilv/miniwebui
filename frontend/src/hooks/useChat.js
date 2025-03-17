// src/hooks/useChat.js - Mise à jour
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { createChat, chats } from "../store/chatStore";

export function useChat() {
  const navigate = useNavigate();
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const handleNewChat = async () => {
    if (isCreatingChat) return; // Prevent multiple clicks

    try {
      setIsCreatingChat(true);
      
      // Create chat but delay navigation until we have a chat ID
      const newChat = await createChat();
      
      // Assurons-nous que le chat est déjà dans la liste avant de naviguer
      if (newChat && newChat.id) {
        // Attendre un court instant pour s'assurer que le store est à jour
        setTimeout(() => {
          navigate(`/chat/${newChat.id}`);
        }, 50);
      } else {
        toast.error("Error creating conversation: No chat ID returned");
      }
    } catch (error) {
      console.error("Error creating chat:", error);
      toast.error("Error creating conversation");
    } finally {
      setIsCreatingChat(false);
    }
  };

  return {
    isCreatingChat,
    handleNewChat,
  };
}