import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { createChat } from "../store/chatStore";

export function useChat() {
  const navigate = useNavigate();
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const handleNewChat = async () => {
    if (isCreatingChat) return; // Prevent multiple clicks

    try {
      setIsCreatingChat(true);
      
      // Create chat but delay navigation until we have a chat ID
      const newChat = await createChat();
      
      // Only navigate once we have a valid chat ID
      if (newChat && newChat.id) {
        navigate(`/chat/${newChat.id}`);
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