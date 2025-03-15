import React, { useState } from 'react';
import { Edit2, Settings, Share2 } from 'lucide-react';
import { useStore } from '@nanostores/react';
import { currentChat, models, selectedModel } from '../../store/chatStore';

const ChatHeader = ({ title }) => {
  const $models = useStore(models);
  const $selectedModel = useStore(selectedModel);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(title);
  const [showSettings, setShowSettings] = useState(false);
  
  // Mettre à jour le titre du chat
  const updateTitle = async () => {
    if (newTitle.trim() && newTitle !== title) {
      try {
        // TODO: Implement title update API call
        // For now, we'll just update the local state
        currentChat.setKey('title', newTitle);
      } catch (error) {
        console.error('Erreur lors de la mise à jour du titre:', error);
      }
    }
    
    setIsEditingTitle(false);
  };
  
  // Changer le modèle utilisé
  const changeModel = (modelId) => {
    selectedModel.set(modelId);
    setShowSettings(false);
  };

  return (
    <div className="border-b border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center">
        {isEditingTitle ? (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              updateTitle();
            }}
            className="flex items-center"
          >
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="border border-gray-300 dark:border-dark-600 rounded-md px-2 py-1 text-sm bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
              autoFocus
              onBlur={updateTitle}
            />
          </form>
        ) : (
          <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 truncate max-w-md">
            {title}
          </h2>
        )}
        
        <button
          onClick={() => {
            setNewTitle(title);
            setIsEditingTitle(!isEditingTitle);
          }}
          className="ml-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full"
          aria-label="Edit title"
        >
          <Edit2 size={16} />
        </button>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700"
            aria-label="Chat settings"
          >
            <Settings size={16} />
          </button>
          
          {showSettings && (
            <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-dark-800 ring-1 ring-black ring-opacity-5 z-10 py-1">
              <div className="px-3 py-2 border-b border-gray-200 dark:border-dark-700">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Modèle
                </h3>
                <div className="mt-2 space-y-1">
                  {$models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => changeModel(model.model_id)}
                      className={`w-full text-left px-2 py-1 text-sm rounded-md ${
                        $selectedModel === model.model_id 
                          ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100' 
                          : 'hover:bg-gray-100 dark:hover:bg-dark-700'
                      }`}
                    >
                      {model.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="px-3 py-2">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </h3>
                <div className="mt-2 space-y-1">
                  <button
                    className="flex items-center w-full text-left px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-md"
                    onClick={() => {
                      // TODO: Implement share functionality
                      setShowSettings(false);
                    }}
                  >
                    <Share2 size={14} className="mr-2" />
                    Partager la conversation
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;