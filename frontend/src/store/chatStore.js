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
export const selectedModel = atom("gemini-1.5-pro"); // Default to Gemini 1.5 Pro

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

// Create a new chat
export const createChat = async (
  model = "gemini-1.5-pro",
  systemPrompt = null
) => {
  try {
    currentChat.setKey("isLoading", true);

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

// Send a message with streaming
export const sendMessage = async (content, streaming = true) => {
  const chatId = currentChat.get().id;
  if (!chatId) return null;

  try {
    currentChat.setKey("isLoading", true);

    // Add user message locally
    const userMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content,
      created_at: Math.floor(Date.now() / 1000), // Convert to UNIX timestamp (seconds)
    };

    const currentMessages = currentChat.get().messages;
    currentChat.setKey("messages", [...currentMessages, userMessage]);

    // Prepare message data
    const messageData = {
      role: "user",
      content,
    };

    if (streaming) {
      try {
        // Initiate streaming session
        const sessionResponse = await api
          .post(`chat/${chatId}/messages/stream`, {
            json: messageData,
          })
          .json();

        const { session_id, message_id } = sessionResponse;

        // Add placeholder for assistant's response
        const assistantMessagePlaceholder = {
          id: message_id,
          role: "assistant",
          content: "",
          created_at: Math.floor(Date.now() / 1000),
          is_streaming: true,
        };

        // Add placeholder to messages
        const updatedMessages = [
          ...currentChat.get().messages,
          assistantMessagePlaceholder,
        ];
        currentChat.setKey("messages", updatedMessages);

        // Set up SSE connection
        const eventSource = new EventSource(
          `/api/chat/stream/${session_id}/events`
        );

        // Handle new content chunks
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const content = data.content || "";
            const isDone = data.done || false;
            const error = data.error;

            // Update message content
            const messages = currentChat.get().messages;
            const messageIndex = messages.findIndex(
              (msg) => msg.id === message_id
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
              }

              // Update the message in the array
              const newMessages = [...messages];
              newMessages[messageIndex] = updatedMessage;

              // Update store
              currentChat.setKey("messages", newMessages);
            }

            // Handle any errors
            if (error) {
              console.error("Error in stream:", error);
              toast.error("Error receiving message stream");
            }

            // If done, clean up
            if (isDone) {
              eventSource.close();
              currentChat.setKey("isLoading", false);
            }
          } catch (e) {
            console.error("Error parsing SSE data:", e);
          }
        };

        // Handle SSE errors
        eventSource.onerror = (error) => {
          console.error("SSE connection error:", error);
          toast.error("Connection error");
          eventSource.close();
          currentChat.setKey("isLoading", false);
        };

        return message_id;
      } catch (error) {
        console.error("Error initiating stream:", error);
        toast.error("Failed to start message stream");
        currentChat.setKey("isLoading", false);
        throw error;
      }
    } else {
      // Non-streaming fallback
      try {
        const response = await api
          .post(`chat/${chatId}/messages`, { json: messageData })
          .json();

        // Add assistant response
        const assistantMessage = {
          id: response.id,
          role: "assistant",
          content: response.content,
          created_at: response.created_at,
        };

        const updatedMessages = [
          ...currentChat.get().messages,
          assistantMessage,
        ];
        currentChat.setKey("messages", updatedMessages);
        currentChat.setKey("isLoading", false);

        return assistantMessage;
      } catch (error) {
        console.error("Error sending message:", error);
        toast.error("Failed to send message");
        currentChat.setKey("isLoading", false);
        throw error;
      }
    }
  } catch (error) {
    console.error("Error sending message:", error);
    currentChat.setKey("isLoading", false);
    throw error;
  }
};
