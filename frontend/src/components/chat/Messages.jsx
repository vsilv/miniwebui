import React, { useEffect, useRef } from "react";
import Message from "./Message";

const Messages = ({ messages, isLoading }) => {
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Filter out system messages (they are used for context but not displayed)
  const visibleMessages = messages.filter(
    (message) => message.role !== "system"
  );

  // Check if the latest assistant message is still streaming
  const hasStreamingMessage = visibleMessages.some(
    (message) => message.role === "assistant" && message.is_streaming === true
  );

  return (
    <div className="overflow-y-auto py-6 space-y-0 divide-y divide-gray-100 dark:divide-dark-800 w-full">
      {visibleMessages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          Commencez la conversation en envoyant un message
        </div>
      ) : (
        <>
          {visibleMessages.map((message) => (
            <Message key={message.id} message={message} />
          ))}

          {/* Show loading indicator for assistant response only if we don't have a streaming message */}
          {isLoading && !hasStreamingMessage && (
            <div className="px-4 sm:px-8 md:px-12 pt-6 pb-2">
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
            </div>
          )}

          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
};

export default Messages;