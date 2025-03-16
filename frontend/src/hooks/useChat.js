import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { createChat, chats } from "../store/chatStore";

export function useChat() {
  const navigate = useNavigate();
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const handleNewChat = async () => {
    if (isCreatingChat) return; // Éviter les clics multiples

    try {
      setIsCreatingChat(true);

      const newChat = await createChat();

      // Mettre à jour manuellement l'état local des chats sans attendre
      const currentChats = [...chats.get()];
      currentChats.unshift(newChat); // Ajouter le nouveau chat au début
      chats.set(currentChats);

      navigate(`/chat/${newChat.id}`);
    } catch (error) {
      console.error("Erreur lors de la création du chat:", error);
      toast.error("Erreur lors de la création de la conversation");
    } finally {
      setIsCreatingChat(false);
    }
  };

  return {
    isCreatingChat,
    handleNewChat,
  };
}
