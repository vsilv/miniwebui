// src/store/chatStore.js
import { atom, map } from "nanostores";
import api from "../api/config";
import { toast } from "react-hot-toast";

// Stores for chats
export const chats = atom([]);
export const currentChat = map({
  id: null,
  messages: [],
  title: "",
  model: "",
  isLoading: false,
});

// Available models
export const models = atom([]);
export const selectedModel = atom("gemini-2.0-flash-lite");

// Fetch all chats
export const fetchChats = async () => {
  try {
    const response = await api.get("chat").json();
    chats.set(response);
    return response;
  } catch (error) {
    console.error("Error fetching chats:", error);
    return [];
  }
};

export const createChat = async (
  model = "gemini-2.0-flash-lite",
  systemPrompt = null
) => {
  try {
    // Create a temporary chat object
    const tempChat = {
      id: null,
      title: "",
      model: "",
      messages: [],
      isLoading: true,
    };

    // Replace immediately with the new state to avoid affecting the old chat
    currentChat.set(tempChat);

    const data = {
      title: "New conversation",
      model,
      system_prompt: systemPrompt,
    };

    const response = await api.post("chat", { json: data }).json();
    const newChat = response;

    // Update chats list
    const currentChats = chats.get();
    chats.set([newChat, ...currentChats]);

    // Update current chat
    currentChat.set({
      id: newChat.id,
      title: newChat.title,
      model: newChat.model,
      messages: [],
      isLoading: false,
    });

    return newChat;
  } catch (error) {
    console.error("Error creating chat:", error);
    currentChat.setKey("isLoading", false);
    throw error;
  }
};

// Delete a chat
export const deleteChat = async (chatId) => {
  try {
    await api.delete(`chat/${chatId}`);

    // Update chats list
    const updatedChats = chats.get().filter((chat) => chat.id !== chatId);
    chats.set(updatedChats);

    // Reset current chat if it was the deleted one
    if (currentChat.get().id === chatId) {
      currentChat.set({
        id: null,
        messages: [],
        title: "",
        model: "",
        isLoading: false,
      });
    }

    return true;
  } catch (error) {
    console.error(`Error deleting chat ${chatId}:`, error);
    throw error;
  }
};

// Update chat title
export const updateChatTitle = async (chatId, newTitle) => {
  try {
    await api.put(`chat/${chatId}/title`, {
      json: { title: newTitle }
    });

    // Update title in current chat if it's the active chat
    if (currentChat.get().id === chatId) {
      currentChat.setKey("title", newTitle);
    }

    // Update title in chats list
    const updatedChats = chats.get().map(chat => 
      chat.id === chatId ? {...chat, title: newTitle} : chat
    );
    
    chats.set(updatedChats);

    return true;
  } catch (error) {
    console.error(`Error updating chat title ${chatId}:`, error);
    throw error;
  }
};

// Fetch available models
export const fetchModels = async () => {
  try {
    const response = await api.get("models").json();
    models.set(response);
    return response;
  } catch (error) {
    console.error("Error fetching models:", error);
    return [];
  }
};

// Fetch a specific chat and its messages
export const fetchChat = async (chatId) => {
  try {
    currentChat.setKey("isLoading", true);

    const response = await api.get(`chat/${chatId}`).json();
    const chatData = response;

    currentChat.set({
      id: chatData.id,
      title: chatData.title,
      model: chatData.model,
      messages: chatData.messages,
      isLoading: false,
    });

    return chatData;
  } catch (error) {
    console.error(`Error fetching chat ${chatId}:`, error);
    currentChat.setKey("isLoading", false);
    throw error;
  }
};

// Send a message and process the response
export const sendMessage = async (content, selectedDocs = [], streaming = true) => {
  const chatId = currentChat.get().id;
  if (!chatId) return null;

  try {
    currentChat.setKey("isLoading", true);

    // Generate unique IDs for both user and assistant messages
    const userMessageId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const assistantMessageId = `assistant-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Add user message locally
    const userMessage = {
      id: userMessageId,
      role: "user",
      content,
      created_at: Math.floor(Date.now() / 1000), // Convert to UNIX timestamp (seconds)
    };

    const currentMessages = currentChat.get().messages;
    currentChat.setKey("messages", [...currentMessages, userMessage]);

    // Prepare message data
    let messageData = {
      role: "user",
      content,
      id: userMessageId,           // Send client-generated ID
    };

    // Include document context if documents are selected
    if (selectedDocs && selectedDocs.length > 0) {
      // Fetch document chunks and append to message content
      let contextContent = "";
      for (const doc of selectedDocs) {
        const knowledgeSearchQuery = {
          query: content,
          document_id: doc.id,
          limit: 3 // Adjust limit as needed
        };

        try {
          const searchResults = await api.post("knowledge/search", { json: knowledgeSearchQuery }).json();
          if (searchResults && searchResults.length > 0) {
            contextContent += `\n\nDocument Context from ${doc.title}:\n`;
            for (const result of searchResults) {
              contextContent += `- ${result.chunk}\n`;
            }
          }
        } catch (error) {
          console.error("Error searching knowledge:", error);
          toast.error("Error fetching document context");
        }
      }
      messageData.content += contextContent; // Append context to user message
    }


    if (streaming) {
      try {
        // Initiate streaming session
        const sessionResponse = await api
          .post(`chat/${chatId}/messages/stream`, {
            json: {
              message: messageData,
              assistant_message_id: assistantMessageId,  // Send the assistant message ID
            },
          })
          .json();

        const { session_id } = sessionResponse;

        // Add placeholder for assistant's response with is_streaming flag
        const assistantMessagePlaceholder = {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          created_at: Math.floor(Date.now() / 1000),
          is_streaming: true, // Important flag to indicate streaming status
        };

        // Add placeholder to messages
        const updatedMessages = [
          ...currentChat.get().messages,
          assistantMessagePlaceholder,
        ];
        currentChat.setKey("messages", updatedMessages);

        // Set up SSE connection for streaming response
        const eventSource = new EventSource(
          `/api/chat/stream/${session_id}/events`
        );

        // Handle incoming stream data
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const content = data.content || "";
            const isDone = data.done || false;
            const error = data.error;

            // Update message content
            const messages = currentChat.get().messages;
            const messageIndex = messages.findIndex(
              (msg) => msg.id === assistantMessageId
            );

            if (messageIndex !== -1) {
              // Create updated message with new content
              const updatedMessage = {
                ...messages[messageIndex],
                content: messages[messageIndex].content + content,
              };

              // If stream is done, remove the streaming flag
              if (isDone) {
                updatedMessage.is_streaming = false;
                
                // Check if the chat title has been updated on the server
                setTimeout(async () => {
                  try {
                    // Fetch the latest chat data to get any server-side title updates
                    const chatData = await api.get(`chat/${chatId}`).json();
                    
                    // Only update if title has changed
                    if (chatData.title && chatData.title !== currentChat.get().title && 
                        chatData.title !== "New conversation") {
                      
                      // Update title in current chat
                      currentChat.setKey("title", chatData.title);
                      
                      // Also update the title in the chats list
                      const updatedChats = chats.get().map(chat => 
                        chat.id === chatId ? {...chat, title: chatData.title} : chat
                      );
                      
                      chats.set(updatedChats);
                    }
                  } catch (error) {
                    console.error("Error checking for title updates:", error);
                  }
                }, 1000); // Small delay to ensure title generation has completed
              }

              // Handle any errors
              if (error) {
                console.error("Error in stream:", error);
                updatedMessage.error = true;
                updatedMessage.is_streaming = false;

                // If we have no content yet, add a default error message
                if (!updatedMessage.content) {
                  updatedMessage.content =
                    "Une erreur s'est produite lors de la génération de la réponse. L'API a retourné : " +
                    error;
                }

                toast.error("Erreur lors de la génération de la réponse");
              }

              // Update the message in the array
              const newMessages = [...messages];
              newMessages[messageIndex] = updatedMessage;

              // Update store
              currentChat.setKey("messages", newMessages);
            }

            // If done, clean up
            if (isDone || error) {
              eventSource.close();
              currentChat.setKey("isLoading", false);
            }
          } catch (e) {
            console.error("Error parsing SSE data:", e);

            // Mark the message as errored
            const messages = currentChat.get().messages;
            const messageIndex = messages.findIndex(
              (msg) => msg.id === assistantMessageId
            );

            if (messageIndex !== -1) {
              const updatedMessage = {
                ...messages[messageIndex],
                error: true,
                is_streaming: false,
                content:
                  "Une erreur s'est produite lors de la génération de la réponse.",
              };

              const newMessages = [...messages];
              newMessages[messageIndex] = updatedMessage;

              currentChat.setKey("messages", newMessages);
            }

            eventSource.close();
            currentChat.setKey("isLoading", false);
          }
        };

        // Handle SSE errors
        eventSource.onerror = (error) => {
          console.error("SSE connection error:", error);

          // Mark the message as errored
          const messages = currentChat.get().messages;
          const messageIndex = messages.findIndex(
            (msg) => msg.id === assistantMessageId
          );

          if (messageIndex !== -1) {
            const updatedMessage = {
              ...messages[messageIndex],
              error: true,
              is_streaming: false,
              content:
                "Une erreur de connexion s'est produite. Veuillez réessayer.",
            };

            const newMessages = [...messages];
            newMessages[messageIndex] = updatedMessage;

            currentChat.setKey("messages", newMessages);
          }

          toast.error("Erreur de connexion");
          eventSource.close();
          currentChat.setKey("isLoading", false);
        };

        return assistantMessageId;
      } catch (error) {
        console.error("Error initiating stream:", error);

        // Add an error message directly
        const errorMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Impossible de démarrer la génération. Veuillez réessayer.",
          created_at: Math.floor(Date.now() / 1000),
          error: true,
        };

        const updatedMessages = [...currentChat.get().messages, errorMessage];

        currentChat.setKey("messages", updatedMessages);
        toast.error("Erreur lors du démarrage du flux de messages");
        currentChat.setKey("isLoading", false);
        throw error;
      }
    } else {
      // Non-streaming fallback implementation would go here
      // ...
    }
  } catch (error) {
    console.error("Error sending message:", error);
    currentChat.setKey("isLoading", false);
    throw error;
  }
};
