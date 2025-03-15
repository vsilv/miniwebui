import React, { useEffect, useRef } from 'react';
import Message from './Message';

const Messages = ({ messages, isLoading }) => {
  const messagesEndRef = useRef(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Filter out system messages (they are used for context but not displayed)
  const visibleMessages = messages.filter(message => message.role !== 'system');
  
  return (
    <div className="flex-1 overflow-y-auto py-4 space-y-6">
      {visibleMessages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          Commencez la conversation en envoyant un message
        </div>
      ) : (
        <>
          {visibleMessages.map((message) => (
            <Message 
              key={message.id} 
              message={message} 
            />
          ))}
          
          {/* Show loading indicator for assistant response */}
          {isLoading && (
            <div className="flex items-center space-x-2 px-4 py-3 rounded-lg bg-gray-100 dark:bg-dark-800 max-w-[85%] ml-4">
              <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse"></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
};

export default Messages;