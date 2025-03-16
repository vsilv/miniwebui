// frontend/src/components/chat/ChatHeader.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Edit2, Settings, Share2, ChevronDown, Info, Bot, Save, X } from 'lucide-react';
import { useStore } from '@nanostores/react';
import { currentChat, models, selectedModel, updateChatTitle } from '../../store/chatStore';
import { toast } from 'react-hot-toast';

const ChatHeader = () => {
  const $currentChat = useStore(currentChat);
  const $models = useStore(models);
  const $selectedModel = useStore(selectedModel);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState($currentChat.title || 'Nouvelle conversation');
  const [showSettings, setShowSettings] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  
  const settingsRef = useRef(null);
  const infoRef = useRef(null);
  const titleInputRef = useRef(null);
  
  // Mettre à jour le state local quand le titre change
  useEffect(() => {
    setNewTitle($currentChat.title || 'Nouvelle conversation');
  }, [$currentChat.title]);
  
  // Mettre à jour le titre du chat
  const handleUpdateTitle = async () => {
    if (newTitle.trim() && newTitle !== $currentChat.title) {
      try {
        await updateChatTitle($currentChat.id, newTitle);
        toast.success('Titre mis à jour');
      } catch (error) {
        console.error('Erreur lors de la mise à jour du titre:', error);
        toast.error('Erreur lors de la mise à jour du titre');
        
        // Restaurer le titre original en cas d'erreur
        setNewTitle($currentChat.title || 'Nouvelle conversation');
      }
    } else {
      // Même si on n'a pas changé, on remet la valeur du store pour s'assurer qu'elle est correcte
      setNewTitle($currentChat.title || 'Nouvelle conversation');
    }
    
    setIsEditingTitle(false);
  };
  
  // Changer le modèle utilisé
  const changeModel = (modelId) => {
    selectedModel.set(modelId);
    setShowSettings(false);
  };
  
  // Focus sur l'input titre quand on active l'édition
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);
  
  // Fermer les menus quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
      if (infoRef.current && !infoRef.current.contains(event.target)) {
        setShowInfo(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="sticky top-0 z-20 glass-effect px-4 py-3.5 flex items-center justify-between">
      <div className="flex items-center">
        {isEditingTitle ? (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdateTitle();
            }}
            className="flex items-center"
          >
            <input
              ref={titleInputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="border border-primary-300 dark:border-primary-700 rounded-lg px-3 py-1.5 text-base bg-white dark:bg-dark-800 text-dark-900 dark:text-light-100 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent w-64"
              onBlur={handleUpdateTitle}
            />
            <div className="flex space-x-1 ml-2">
              <button 
                type="submit"
                className="p-1.5 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 bg-primary-100 dark:bg-primary-900/30 rounded-lg"
              >
                <Save size={16} />
              </button>
              <button 
                type="button"
                onClick={() => {
                  setNewTitle($currentChat.title || 'Nouvelle conversation');
                  setIsEditingTitle(false);
                }}
                className="p-1.5 text-dark-600 hover:text-dark-700 dark:text-dark-400 dark:hover:text-dark-300 bg-dark-100 dark:bg-dark-700 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center">
            <h2 className="text-lg font-medium text-dark-800 dark:text-light-100 truncate max-w-md">
              {$currentChat.title || 'Nouvelle conversation'}
            </h2>
            
            <button
              onClick={() => {
                setNewTitle($currentChat.title || 'Nouvelle conversation');
                setIsEditingTitle(true);
              }}
              className="ml-2 p-1.5 text-dark-400 hover:text-dark-600 dark:text-dark-400 dark:hover:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg"
              aria-label="Edit title"
            >
              <Edit2 size={16} />
            </button>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        {/* Model selection badge */}
        <div className="hidden md:flex items-center px-3 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-sm text-primary-700 dark:text-primary-300">
          <Bot size={16} className="mr-2" />
          <span>{$models.find(model => model.model_id === $selectedModel)?.name || $selectedModel}</span>
        </div>

        {/* Chat info button */}
        <div ref={infoRef} className="relative">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 text-dark-500 hover:text-dark-700 dark:text-dark-400 dark:hover:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg"
            aria-label="Chat information"
          >
            <Info size={18} />
          </button>
          
          {showInfo && (
            <div className="absolute right-0 mt-2 w-72 py-2 bg-white dark:bg-dark-800 rounded-xl shadow-medium border border-dark-200/50 dark:border-dark-700 z-10">
              <div className="px-4 py-3 border-b border-dark-200 dark:border-dark-700">
                <h3 className="font-medium text-dark-800 dark:text-light-200 mb-1">
                  Informations sur le chat
                </h3>
                <p className="text-xs text-dark-500">
                  Détails de cette conversation
                </p>
              </div>
              
              <div className="px-4 py-2">
                <div className="mb-3">
                  <p className="text-xs text-dark-500 dark:text-dark-400 mb-1">ID de la conversation</p>
                  <p className="text-sm text-dark-800 dark:text-light-200 bg-dark-100 dark:bg-dark-700 p-1.5 rounded overflow-x-auto font-mono text-xs">
                    {$currentChat.id}
                  </p>
                </div>
                
                <div className="mb-3">
                  <p className="text-xs text-dark-500 dark:text-dark-400 mb-1">Modèle</p>
                  <p className="text-sm text-dark-800 dark:text-light-200">
                    {$models.find(model => model.model_id === $selectedModel)?.name || $selectedModel}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-dark-500 dark:text-dark-400 mb-1">Messages</p>
                  <p className="text-sm text-dark-800 dark:text-light-200">
                    {$currentChat.messages?.length || 0} messages
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
          
        {/* Settings button */}
        <div ref={settingsRef} className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-dark-500 hover:text-dark-700 dark:text-dark-400 dark:hover:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg"
            aria-label="Chat settings"
          >
            <Settings size={18} />
          </button>
          
          {showSettings && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-medium bg-white dark:bg-dark-800 border border-dark-200/50 dark:border-dark-700 z-10 overflow-hidden">
              <div className="px-4 py-3 border-b border-dark-200 dark:border-dark-700">
                <h3 className="font-medium text-dark-800 dark:text-light-200 mb-1">
                  Modèle
                </h3>
                <p className="text-xs text-dark-500">
                  Sélectionnez le moteur à utiliser
                </p>
              </div>
              
              <div className="py-2 max-h-72 overflow-y-auto">
                {$models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => changeModel(model.model_id)}
                    className={`w-full text-left px-4 py-2 flex items-center justify-between ${
                      $selectedModel === model.model_id 
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200' 
                        : 'hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-300'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{model.name}</div>
                      <div className="text-xs text-dark-500 dark:text-dark-400 mt-0.5">
                        {model.description || 'Modèle ' + model.provider}
                      </div>
                    </div>
                    
                    {$selectedModel === model.model_id && (
                      <span className="h-2 w-2 rounded-full bg-primary-500"></span>
                    )}
                  </button>
                ))}
              </div>
              
              <div className="px-4 py-3 border-t border-dark-200 dark:border-dark-700">
                <h3 className="font-medium text-dark-800 dark:text-light-200 mb-1">
                  Actions
                </h3>
                
                <button
                  className="flex items-center w-full text-left mt-2 px-3 py-2 text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg"
                  onClick={() => {
                    // TODO: Implement share functionality
                    setShowSettings(false);
                  }}
                >
                  <Share2 size={16} className="mr-2" />
                  Partager la conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;