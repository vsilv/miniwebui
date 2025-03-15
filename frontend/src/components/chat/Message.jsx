import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Copy, Check, RotateCcw, User, Bot } from 'lucide-react';
import MarkdownContent from './MarkdownContent';

const Message = ({ message }) => {
  const [copied, setCopied] = useState(false);
  
  const isUser = message.role === 'user';
  
  // Format timestamp
  const formattedTime = message.created_at 
    ? format(new Date(message.created_at), 'HH:mm', { locale: fr })
    : '';
  
  // Copy message content to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Regenerate response - for future implementation
  const regenerateResponse = () => {
    console.log('Regenerate response for message:', message.id);
    // TODO: Implement regenerate functionality
  };

  return (
    <div 
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-4`}
    >
      <div 
        className={`
          flex items-start space-x-2 max-w-[85%] group
          ${isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'}
        `}
      >
        {/* Avatar */}
        <div className={`w-8 h-8 flex-shrink-0 rounded-full overflow-hidden ${
          isUser ? 'bg-primary-100 dark:bg-primary-900' : 'bg-gray-100 dark:bg-dark-700'
        } flex items-center justify-center text-gray-800 dark:text-gray-200`}>
          {isUser ? (
            <User size={16} />
          ) : (
            <Bot size={16} />
          )}
        </div>
        
        {/* Message content */}
        <div 
          className={`
            flex-1 px-4 py-3 rounded-lg shadow-sm
            ${isUser 
              ? 'message-user bg-primary-600 text-white dark:bg-primary-700' 
              : 'message-assistant bg-gray-100 text-gray-800 dark:bg-dark-800 dark:text-gray-200'
            }
          `}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <MarkdownContent content={message.content} />
          )}
          
          {/* Message actions and timestamp */}
          <div 
            className={`
              mt-2 flex items-center text-xs
              ${isUser 
                ? 'justify-start text-primary-100' 
                : 'justify-end text-gray-500 dark:text-gray-400'
              }
            `}
          >
            <span>{formattedTime}</span>
            
            {!isUser && (
              <div className="ml-4 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={copyToClipboard}
                  className="p-1 hover:text-gray-700 dark:hover:text-gray-300 rounded-full"
                  aria-label="Copy message"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
                
                <button
                  onClick={regenerateResponse}
                  className="p-1 hover:text-gray-700 dark:hover:text-gray-300 rounded-full"
                  aria-label="Regenerate response"
                >
                  <RotateCcw size={14} />
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