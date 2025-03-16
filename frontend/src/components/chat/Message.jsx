import React, { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Copy, Check, RotateCcw, User, Bot, AlertTriangle } from "lucide-react";
import MarkdownContent from "./MarkdownContent";
import { currentChat } from "../../store/chatStore";

// Import necessary functions separately to avoid circular dependencies
import api from "../../api/config";

const Message = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const isUser = message.role === "user";
  const isStreaming = message.is_streaming === true;
  const hasError = message.error === true;

  // Format timestamp
  const formattedTime = message.created_at
    ? format(new Date(message.created_at * 1000), "HH:mm", { locale: fr })
    : "";

  // Copy message content to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Regenerate response - completely rewritten to fix duplication issues
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

      // Remove this message but keep all preceding messages including the user message
      const updatedMessages = messages.filter(
        (_, index) => index < assistantIndex
      );
      currentChat.setKey("messages", updatedMessages);

      // Set loading state
      currentChat.setKey("isLoading", true);

      try {
        // Get fresh session ID for streaming
        const sessionResponse = await api
          .post(`chat/${chatId}/messages/stream`, {
            json: {
              message: { role: "user", content: userMessage.content }, // ✅ Contenu du message
              regenerate: true,  // ✅ Maintenant inclus dans le body
            },
          })
          .json();

        const { session_id, message_id } = sessionResponse;

        // Add placeholder for the new assistant response
        const assistantPlaceholder = {
          id: message_id,
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
              (msg) => msg.id === message_id
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
            (msg) => msg.id === message_id
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
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} px-4`}>
      <div
        className={`
          flex items-start space-x-2 max-w-[85%] group
          ${isUser ? "flex-row-reverse space-x-reverse" : "flex-row"}
        `}
      >
        {/* Avatar */}
        <div
          className={`w-8 h-8 flex-shrink-0 rounded-full overflow-hidden ${
            isUser
              ? "bg-primary-100 dark:bg-primary-900"
              : "bg-gray-100 dark:bg-dark-700"
          } flex items-center justify-center text-gray-800 dark:text-gray-200`}
        >
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        {/* Message content */}
        <div
          className={`
            flex-1 px-4 py-3 rounded-lg shadow-sm
            ${
              isUser
                ? "message-user bg-primary-600 text-white dark:bg-primary-700"
                : hasError
                ? "message-assistant bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200 border border-red-200 dark:border-red-800"
                : "message-assistant bg-gray-100 text-gray-800 dark:bg-dark-800 dark:text-gray-200"
            }
          `}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : isStreaming && message.content.length === 0 ? (
            // Show typing indicator for empty streaming messages
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse"></div>
              <div
                className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse"
                style={{ animationDelay: "0.4s" }}
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
                className="flex items-center gap-1 py-1.5 px-3 bg-red-100 dark:bg-red-800/40 text-red-700 dark:text-red-200 rounded text-sm hover:bg-red-200 dark:hover:bg-red-800/60 transition-colors mt-1"
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

          {/* Message actions and timestamp */}
          <div
            className={`
              mt-2 flex items-center text-xs
              ${
                isUser
                  ? "justify-start text-primary-100"
                  : "justify-start text-gray-500 dark:text-gray-400"
              }
            `}
          >
            <span>{formattedTime}</span>

            {!isUser && !isStreaming && !hasError && (
              <div className="ml-4 flex items-center space-x-2 opacity-100 transition-opacity">
                <button
                  onClick={copyToClipboard}
                  className="p-1 hover:text-gray-700 dark:hover:text-gray-300 rounded-full"
                  aria-label="Copy message"
                  title="Copy to clipboard"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>

                <button
                  onClick={regenerateResponse}
                  disabled={isRegenerating}
                  className={`p-1 hover:text-gray-700 dark:hover:text-gray-300 rounded-full ${
                    isRegenerating ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  aria-label="Regenerate response"
                  title="Regenerate response"
                >
                  <RotateCcw
                    size={14}
                    className={isRegenerating ? "animate-spin" : ""}
                  />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;
