// frontend/src/pages/Chat.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
import { useChat } from "../hooks/useChat";
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
  const messagesEndRef = useRef(null);

  // Explicitly track if a chat is being created to prevent welcome screen flash
  const [isNavigatingToNewChat, setIsNavigatingToNewChat] = useState(false);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [$currentChat.messages]);

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
        await sendMessage(promptText, [], true);
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
    if (
      (isLoading || isCreatingChat || isNavigatingToNewChat) &&
      (!$currentChat.id || $currentChat.id !== chatId)
    ) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full border-4 border-primary-600 border-r-transparent animate-spin mb-4"></div>
            <p className="text-lg font-medium text-dark-800 dark:text-light-200 mb-1">
              Chargement...
            </p>
            <p className="text-dark-500 dark:text-dark-400 max-w-sm">
              Préparation de votre espace de conversation
            </p>
          </div>
        </div>
      );
    }

    // Case 3: Chat loaded - show chat interface
    return (
      <>
        <ChatHeader />
        <div className={`overflow-hidden flex flex-col h-full ${$currentChat.messages.length === 0 ? 'justify-center' : ''}`}>
  <div className={`${$currentChat.messages.length > 0 ? 'flex-1 overflow-y-auto' : ''} max-w-3xl w-full mx-auto`}>
    <Messages
      messages={$currentChat.messages}
      isLoading={$currentChat.isLoading}
      messagesEndRef={messagesEndRef}
    />
  </div>
  <div className="w-full max-w-3xl mx-auto">
    <MessageInput 
      chatId={chatId} 
      isLoading={$currentChat.isLoading}
      onDocumentSelect={toggleDocModal}
      selectedDocs={selectedDocs}
      onRemoveDoc={(docId) => setSelectedDocs(prev => prev.filter(doc => doc.id !== docId))}
    />
  </div>
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

  return (
    <div className="h-full flex flex-col relative">
      {/* Chat interface with subtle background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 -right-32 w-96 h-96 rounded-full bg-primary-100/20 dark:bg-primary-900/10 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-32 w-96 h-96 rounded-full bg-secondary-100/20 dark:bg-secondary-900/10 blur-3xl"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 h-full flex flex-col">
        {renderContent()}
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
};

export default Chat;
