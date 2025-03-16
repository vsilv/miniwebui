// frontend/src/components/chat/Message.jsx
import React, { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Copy, Check, RotateCcw, AlertTriangle, User, ThumbsUp, ThumbsDown } from "lucide-react";
import MarkdownContent from "./MarkdownContent";
import { currentChat } from "../../store/chatStore";

// Import necessary functions separately to avoid circular dependencies
import api from "../../api/config";

const Message = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(null); // null, 'positive', 'negative'

  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const isStreaming = message.is_streaming === true;
  const hasError = message.error === true;

  // Format timestamp
  const formattedTime = message.created_at
    ? format(new Date(message.created_at * 1000), "HH:mm", { locale: fr })
    : "";

  // Format date if needed
  const formattedDate = message.created_at
    ? format(new Date(message.created_at * 1000), "d MMMM yyyy", { locale: fr })
    : "";

  // Copy message content to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Give feedback on message
  const handleFeedback = (type) => {
    // In a real app, this would send feedback to the backend
    setFeedbackGiven(type);
    // TODO: Implement API call to store feedback
  };

  // Regenerate response - fixed to properly handle regeneration
  const regenerateResponse = async () => {
    console.log("Regenerate response for message:", message.id);

    if (isRegenerating) return;

    try {
      setIsRegenerating(true);

      // Get all messages
      const messages = currentChat.get().messages;
      const assistantIndex = messages.findIndex((msg) => msg.id === message.id);

      if (assistantIndex <= 0) {
        throw new Error("Cannot find preceding user message");
      }

      // Look for the most recent user message before this assistant message
      let userMessageIndex = assistantIndex - 1;
      while (
        userMessageIndex >= 0 &&
        messages[userMessageIndex].role !== "user"
      ) {
        userMessageIndex--;
      }

      if (userMessageIndex < 0) {
        throw new Error("No user message found to regenerate from");
      }

      const userMessage = messages[userMessageIndex];
      const chatId = currentChat.get().id;

      // Generate a new ID for the regenerated assistant message
      const newAssistantMessageId = `assistant-regen-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;

      // Important: Only keep messages up to the assistant message we're regenerating
      const updatedMessages = messages.filter(
        (msg, index) => index < assistantIndex
      );
      currentChat.setKey("messages", updatedMessages);

      // Set loading state
      currentChat.setKey("isLoading", true);

      try {
        // Get fresh session ID for streaming with the new message ID
        const sessionResponse = await api
          .post(`chat/${chatId}/messages/stream`, {
            json: {
              message: {
                role: "user",
                content: userMessage.content,
                id: userMessage.id, // Use the original user message ID
              },
              assistant_message_id: newAssistantMessageId, // Send the new assistant message ID
              regenerate: true, // Flag this as a regeneration request
            },
          })
          .json();

        const { session_id } = sessionResponse;

        // Add placeholder for the new assistant response
        const assistantPlaceholder = {
          id: newAssistantMessageId,
          role: "assistant",
          content: "",
          created_at: Math.floor(Date.now() / 1000),
          is_streaming: true,
        };

        // Update the messages with the placeholder
        currentChat.setKey("messages", [
          ...updatedMessages,
          assistantPlaceholder,
        ]);

        // Set up event source for streaming
        const eventSource = new EventSource(
          `/api/chat/stream/${session_id}/events`
        );

        // Handle streamed content
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const content = data.content || "";
            const isDone = data.done || false;
            const error = data.error;

            // Update message content
            const currentMessages = currentChat.get().messages;
            const messageIndex = currentMessages.findIndex(
              (msg) => msg.id === newAssistantMessageId
            );

            if (messageIndex !== -1) {
              const updatedMessage = {
                ...currentMessages[messageIndex],
                content: currentMessages[messageIndex].content + content,
              };

              if (isDone) {
                updatedMessage.is_streaming = false;
              }

              if (error) {
                updatedMessage.error = true;
                updatedMessage.is_streaming = false;
              }

              const newMessages = [...currentMessages];
              newMessages[messageIndex] = updatedMessage;

              currentChat.setKey("messages", newMessages);
            }

            if (isDone || error) {
              eventSource.close();
              currentChat.setKey("isLoading", false);
            }
          } catch (e) {
            console.error("Error in SSE:", e);
            eventSource.close();
            currentChat.setKey("isLoading", false);
          }
        };

        // Handle SSE errors
        eventSource.onerror = (error) => {
          console.error("SSE error:", error);
          eventSource.close();
          currentChat.setKey("isLoading", false);

          // Update the message to show error
          const currentMessages = currentChat.get().messages;
          const messageIndex = currentMessages.findIndex(
            (msg) => msg.id === newAssistantMessageId
          );

          if (messageIndex !== -1) {
            const updatedMessage = {
              ...currentMessages[messageIndex],
              error: true,
              is_streaming: false,
              content:
                currentMessages[messageIndex].content ||
                "Une erreur de connexion s'est produite",
            };

            const newMessages = [...currentMessages];
            newMessages[messageIndex] = updatedMessage;

            currentChat.setKey("messages", newMessages);
          }
        };
      } catch (error) {
        console.error("Error initiating regeneration:", error);
        currentChat.setKey("isLoading", false);

        // Add an error message
        const errorMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Impossible de régénérer la réponse. Veuillez réessayer.",
          created_at: Math.floor(Date.now() / 1000),
          error: true,
        };

        currentChat.setKey("messages", [...updatedMessages, errorMessage]);
      }
    } catch (error) {
      console.error("Error regenerating message:", error);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div
      className={`mb-6 ${
        isUser
          ? "px-4 sm:px-8 md:px-12"
          : "border-b border-light-300/30 dark:border-dark-800/50 pb-6"
      }`}
    >
      {/* User message - with avatar and bubble */}
      {isUser && (
        <div className="flex flex-row-reverse md:items-start gap-4 md:gap-6">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-700 dark:text-primary-300 shadow-sm">
            <User size={16} />
          </div>
          
          <div className="flex-1 max-w-[85%] md:max-w-[75%] space-y-1">
            <div className="bg-light-50 dark:bg-dark-800 px-5 py-3.5 rounded-2xl text-dark-800 dark:text-light-200 shadow-sm border border-light-300/30 dark:border-dark-700/30">
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
            <div className="text-xs text-dark-500 dark:text-dark-400 text-right px-2">
              {formattedTime}
            </div>
          </div>
        </div>
      )}

      {/* Assistant message - with avatar and styled container */}
      {isAssistant && (
        <div className="flex items-start gap-4 md:gap-6 px-4 sm:px-8 md:px-12">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white shadow-sm">
            <span className="text-sm font-medium">A</span>
          </div>
          
          <div className="flex-1 max-w-full space-y-2">
            <div className="bg-white dark:bg-dark-800/80 px-5 py-3.5 rounded-2xl text-dark-800 dark:text-light-200 shadow-sm border border-light-300/30 dark:border-dark-700/30">
              {/* Message content */}
              {isStreaming && message.content.length === 0 ? (
                // Show typing indicator for empty streaming messages
                <div className="flex items-center space-x-2 my-2">
                  <div className="w-2 h-2 rounded-full bg-primary-400 dark:bg-primary-500 animate-pulse"></div>
                  <div
                    className="w-2 h-2 rounded-full bg-primary-400 dark:bg-primary-500 animate-pulse"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                  <div
                    className="w-2 h-2 rounded-full bg-primary-400 dark:bg-primary-500 animate-pulse"
                    style={{ animationDelay: "0.8s" }}
                  ></div>
                </div>
              ) : hasError ? (
                <div className="flex flex-col">
                  <div className="flex items-start mb-2">
                    <AlertTriangle
                      size={18}
                      className="text-red-500 mr-2 flex-shrink-0 mt-0.5"
                    />
                    <div>
                      <p className="font-medium mb-1">Une erreur s'est produite</p>
                      {message.content ? (
                        <MarkdownContent content={message.content} />
                      ) : (
                        <p>
                          La génération de la réponse a rencontré un problème.
                          Veuillez cliquer sur le bouton de régénération pour
                          réessayer.
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={regenerateResponse}
                    disabled={isRegenerating}
                    className="flex items-center gap-1 py-1.5 px-3 bg-red-100 dark:bg-red-800/40 text-red-700 dark:text-red-200 rounded text-sm hover:bg-red-200 dark:hover:bg-red-800/60 transition-colors mt-1 self-start"
                  >
                    <RotateCcw
                      size={14}
                      className={isRegenerating ? "animate-spin" : ""}
                    />
                    <span>
                      {isRegenerating ? "Régénération..." : "Régénérer la réponse"}
                    </span>
                  </button>
                </div>
              ) : (
                <MarkdownContent content={message.content} />
              )}
            </div>

            {/* Message actions */}
            {!isStreaming && !hasError && (
              <div className="flex justify-between items-center px-2 text-xs text-dark-500 dark:text-dark-400">
                <span>{formattedTime}</span>

                <div className="flex items-center space-x-1">
                  {/* Feedback buttons */}
                  <div className="flex items-center mr-2 border-r border-dark-200 dark:border-dark-700 pr-2">
                    <button
                      onClick={() => handleFeedback('positive')}
                      className={`p-1.5 rounded transition-colors ${
                        feedbackGiven === 'positive' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                          : 'text-dark-400 hover:text-green-600 dark:text-dark-500 dark:hover:text-green-400 hover:bg-dark-100 dark:hover:bg-dark-700'
                      }`}
                      aria-label="Feedback positif"
                      title="J'aime cette réponse"
                    >
                      <ThumbsUp size={14} />
                    </button>
                    <button
                      onClick={() => handleFeedback('negative')}
                      className={`p-1.5 rounded transition-colors ${
                        feedbackGiven === 'negative' 
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                          : 'text-dark-400 hover:text-red-600 dark:text-dark-500 dark:hover:text-red-400 hover:bg-dark-100 dark:hover:bg-dark-700'
                      }`}
                      aria-label="Feedback négatif"
                      title="Je n'aime pas cette réponse"
                    >
                      <ThumbsDown size={14} />
                    </button>
                  </div>
                
                  {/* Copy button */}
                  <button
                    onClick={copyToClipboard}
                    className="p-1.5 hover:bg-dark-100 dark:hover:bg-dark-700 rounded transition-colors text-dark-400 hover:text-dark-600 dark:text-dark-500 dark:hover:text-dark-300"
                    aria-label="Copier le message"
                    title="Copier dans le presse-papier"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>

                  {/* Regenerate button */}
                  <button
                    onClick={regenerateResponse}
                    disabled={isRegenerating}
                    className={`p-1.5 hover:bg-dark-100 dark:hover:bg-dark-700 rounded transition-colors text-dark-400 hover:text-dark-600 dark:text-dark-500 dark:hover:text-dark-300 ${
                      isRegenerating ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    aria-label="Régénérer la réponse"
                    title="Régénérer la réponse"
                  >
                    <RotateCcw
                      size={14}
                      className={isRegenerating ? "animate-spin" : ""}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Message;