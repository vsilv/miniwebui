import React, { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Copy, Check, RotateCcw, AlertTriangle } from "lucide-react";
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
          : "border-b border-gray-100 dark:border-dark-800 pb-6"
      }`}
    >
      {/* User message - compact style with gray bubble */}
      {isUser && (
        <div className="flex justify-end">
          <div className="max-w-[85%] md:max-w-[75%] bg-gray-100 dark:bg-dark-700 px-4 py-3 rounded-lg text-gray-800 dark:text-gray-200">
            <div className="whitespace-pre-wrap">{message.content}</div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
              {formattedTime}
            </div>
          </div>
        </div>
      )}

      {/* Assistant message - full width with no bubble */}
      {!isUser && (
        <div className="px-4 sm:px-8 md:px-12 max-w-full">
          {/* Message content */}
          {isStreaming && message.content.length === 0 ? (
            // Show typing indicator for empty streaming messages
            <div className="flex items-center space-x-2 my-2">
              <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse"></div>
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

          {/* Message footer - time and actions */}
          <div className="flex justify-between items-center mt-4 text-xs text-gray-500 dark:text-gray-400">
            <span>{formattedTime}</span>

            {!isStreaming && !hasError && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 p-1 hover:text-gray-700 dark:hover:text-gray-300 rounded"
                  aria-label="Copy message"
                  title="Copy to clipboard"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>

                <button
                  onClick={regenerateResponse}
                  disabled={isRegenerating}
                  className={`flex items-center gap-1 p-1 hover:text-gray-700 dark:hover:text-gray-300 rounded ${
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
      )}
    </div>
  );
};

export default Message;
