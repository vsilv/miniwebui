import React, { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Copy, Check, RotateCcw, AlertTriangle, ThumbsUp, ThumbsDown } from "lucide-react";
import MarkdownContent from "./MarkdownContent";
import { currentChat } from "../../store/chatStore";
import api from "../../api/config";

const Message = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(null); // null, 'positive', 'negative'

  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const isStreaming = message.is_streaming === true;
  const hasError = message.error === true;

  // Formatage de l'heure
  const formattedTime = message.created_at
    ? format(new Date(message.created_at * 1000), "HH:mm", { locale: fr })
    : "";

  // Copier le contenu du message dans le presse-papier avec gestion d'erreur
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Erreur lors de la copie dans le presse-papier :", error);
    }
  };

  // Gestion du feedback
  const handleFeedback = (type) => {
    // En production, envoyer le feedback au backend
    setFeedbackGiven(type);
    // TODO: Implémenter l'appel API pour stocker le feedback
  };

  // Fonction pour régénérer la réponse
  const regenerateResponse = async () => {
    console.log("Régénération de la réponse pour le message:", message.id);

    if (isRegenerating) return;

    try {
      setIsRegenerating(true);
      const messages = currentChat.get().messages;
      const assistantIndex = messages.findIndex((msg) => msg.id === message.id);

      if (assistantIndex <= 0) {
        throw new Error("Message utilisateur précédent introuvable");
      }

      // Recherche du dernier message utilisateur avant ce message assistant
      let userMessageIndex = assistantIndex - 1;
      while (userMessageIndex >= 0 && messages[userMessageIndex].role !== "user") {
        userMessageIndex--;
      }

      if (userMessageIndex < 0) {
        throw new Error("Aucun message utilisateur trouvé pour régénérer");
      }

      const userMessage = messages[userMessageIndex];
      const chatId = currentChat.get().id;

      // Génération d'un nouvel ID pour le message assistant régénéré
      const newAssistantMessageId = `assistant-regen-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;

      // Conserver uniquement les messages jusqu'au message assistant actuel
      const updatedMessages = messages.filter((msg, index) => index < assistantIndex);
      currentChat.setKey("messages", updatedMessages);

      // Passage en mode chargement
      currentChat.setKey("isLoading", true);

      try {
        // Appel de l'API pour récupérer un nouvel ID de session pour le streaming
        const sessionResponse = await api
          .post(`chat/${chatId}/messages/stream`, {
            json: {
              message: {
                role: "user",
                content: userMessage.content,
                id: userMessage.id, // On utilise l'ID original du message utilisateur
              },
              assistant_message_id: newAssistantMessageId, // Nouvel ID pour le message assistant
              regenerate: true, // Indique une demande de régénération
            },
          })
          .json();

        const { session_id } = sessionResponse;

        // Placeholder pour la nouvelle réponse de l'assistant
        const assistantPlaceholder = {
          id: newAssistantMessageId,
          role: "assistant",
          content: "",
          created_at: Math.floor(Date.now() / 1000),
          is_streaming: true,
        };

        currentChat.setKey("messages", [...updatedMessages, assistantPlaceholder]);

        // Mise en place de l'EventSource pour le streaming
        const eventSource = new EventSource(`/api/chat/stream/${session_id}/events`);

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const content = data.content || "";
            const isDone = data.done || false;
            const error = data.error;

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
            console.error("Erreur lors du traitement du streaming :", e);
            eventSource.close();
            currentChat.setKey("isLoading", false);
          }
        };

        eventSource.onerror = (error) => {
          console.error("Erreur SSE :", error);
          eventSource.close();
          currentChat.setKey("isLoading", false);

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
        console.error("Erreur lors de l'initiation de la régénération :", error);
        currentChat.setKey("isLoading", false);

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
      console.error("Erreur de régénération du message :", error);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className={`px-4 py-4 ${isUser ? "mb-2" : "mb-4"}`}>
      {/* Message de l'utilisateur */}
      {isUser && (
        <div className="flex justify-end">
          <div className="max-w-[85%] md:max-w-[75%] space-y-1">
            <div className="bg-light-100 dark:bg-dark-700/50 px-4 py-3 rounded-lg text-dark-800 dark:text-light-200 shadow-sm">
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
            <div className="text-xs text-dark-500 dark:text-dark-400 text-right px-1">
              {formattedTime}
            </div>
          </div>
        </div>
      )}

      {/* Message de l'assistant */}
      {isAssistant && (
        <div className="space-y-2 max-w-full">
          <div className="bg-white/10 dark:bg-dark-800/10 text-dark-800 dark:text-light-200 w-full">
            {isStreaming && message.content.length === 0 ? (
              // Indicateur de saisie pour un message en streaming vide
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
                        Veuillez cliquer sur le bouton de régénération pour réessayer.
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

          {/* Actions du message */}
          {!isStreaming && !hasError && (
            <div className="flex justify-between items-center px-2 text-xs text-dark-500 dark:text-dark-400">
              <span>{formattedTime}</span>
              <div className="flex items-center space-x-1">
                {/* Boutons de feedback */}
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
                
                {/* Bouton de copie */}
                <button
                  onClick={copyToClipboard}
                  className="p-1.5 hover:bg-dark-100 dark:hover:bg-dark-700 rounded transition-colors text-dark-400 hover:text-dark-600 dark:text-dark-500 dark:hover:text-dark-300"
                  aria-label="Copier le message"
                  title="Copier dans le presse-papier"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>

                {/* Bouton de régénération */}
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
      )}
    </div>
  );
};

export default Message;
