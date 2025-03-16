import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "@nanostores/react";
import { toast } from "react-hot-toast";

import Messages from "../components/chat/Messages";
import MessageInput from "../components/chat/MessageInput";
import ChatHeader from "../components/chat/ChatHeader";
import WelcomeScreen from "../components/chat/WelcomeScreen";
import DocumentSelectionModal from "../components/chat/DocumentSelectionModal";
import {
  currentChat,
  fetchChat,
  models,
  fetchModels,
  sendMessage,
} from "../store/chatStore";
import { useChat } from '../hooks/useChat';
import { documents, fetchDocuments } from "../store/knowledgeStore";

const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const $currentChat = useStore(currentChat);
  const $models = useStore(models);
  const $documents = useStore(documents);
  const [isLoading, setIsLoading] = useState(false);
  const { isCreatingChat, handleNewChat } = useChat();
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState([]);

  // Explicitly track if a chat is being created to prevent welcome screen flash
  const [isNavigatingToNewChat, setIsNavigatingToNewChat] = useState(false);

  // Handle creating a new chat with proper state management
  const handleCreateChat = async () => {
    // Set navigating state to prevent welcome screen from showing
    setIsNavigatingToNewChat(true);
    await handleNewChat();
  };

  // Handle creation of a new chat with a prompt suggestion
  const handlePromptSelect = async (promptText) => {
    setIsNavigatingToNewChat(true);
    try {
      // Create a new chat
      const newChat = await handleNewChat();
      
      // Small delay to ensure chat is fully created before sending message
      setTimeout(async () => {
        await sendMessage(promptText, true);
      }, 500);
    } catch (error) {
      console.error("Error handling prompt selection:", error);
      toast.error("Erreur lors de la création de la conversation");
      setIsNavigatingToNewChat(false);
    }
  };

  // Récupérer les modèles disponibles et les documents
  useEffect(() => {
    const loadInitialData = async () => {
      if ($models.length === 0) {
        try {
          await fetchModels();
        } catch (error) {
          console.error("Erreur lors du chargement des modèles:", error);
          toast.error("Erreur lors du chargement des modèles");
        }
      }
      
      // Load documents for potential attachment
      try {
        await fetchDocuments();
      } catch (error) {
        console.error("Erreur lors du chargement des documents:", error);
      }
    };

    loadInitialData();
  }, []);

  // Toggle document selection modal
  const toggleDocModal = () => {
    setShowDocModal(!showDocModal);
  };

  // Handle document selection
  const handleDocSelection = (docs) => {
    setSelectedDocs(docs);
    setShowDocModal(false);
  };

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
      return (
        <WelcomeScreen 
          onNewChat={handleCreateChat} 
          isLoading={isCreatingChat} 
          onPromptSelect={handlePromptSelect}
        />
      );
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
        <div className="flex-1 overflow-hidden flex flex-col">
          <Messages
            messages={$currentChat.messages}
            isLoading={$currentChat.isLoading}
          />
          <MessageInput 
            chatId={chatId} 
            isLoading={$currentChat.isLoading}
            onDocumentSelect={toggleDocModal}
            selectedDocs={selectedDocs}
            onRemoveDoc={(docId) => setSelectedDocs(prev => prev.filter(doc => doc.id !== docId))}
          />
        </div>
        
        {/* Document selection modal */}
        {showDocModal && (
          <DocumentSelectionModal
            isOpen={showDocModal}
            onClose={() => setShowDocModal(false)}
            onSelect={handleDocSelection}
            documents={$documents}
            selectedDocs={selectedDocs}
          />
        )}
      </>
    );
  };

  return <div className="h-full flex flex-col">{renderContent()}</div>;
};

export default Chat;