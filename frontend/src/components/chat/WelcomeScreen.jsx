// frontend/src/components/chat/WelcomeScreen.jsx
import React, { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import Logo from '../Logo';
import MessageInput from './MessageInput';

const WelcomeScreen = ({ onNewChat, isLoading, onPromptSelect }) => {
  const [message, setMessage] = useState('');
  
  // Trois suggestions de prompts
  const promptSuggestions = [
    "Explique-moi les fondamentaux de l'architecture des microservices pour une application cloud native.",
    "Rédige une lettre de motivation pour un poste de Product Manager dans une startup tech.",
    "Crée un plan marketing pour le lancement d'une nouvelle application mobile de fitness."
  ];

  // Créer une nouvelle conversation avec un prompt spécifique
  const handlePromptClick = (prompt) => {
    onPromptSelect(prompt);
  };
  
  // Gérer l'envoi du message saisi dans l'input
  const handleSendMessage = () => {
    if (message.trim()) {
      onPromptSelect(message.trim());
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center mx-auto px-4 py-6 max-w-4xl w-full">
      {/* Section Hero */}
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <Logo size="xl" />
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-dark-900 dark:text-light-50 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">
            MiniGPT
          </h1>
          <p className="text-xl text-dark-600 dark:text-light-300 max-w-2xl mx-auto mb-8">
            Votre assistant IA personnel pour transformer vos idées en projets concrets
          </p>
        </div>
        
        {/* Input message */}
        <div className="w-full max-w-3xl mb-10">
          <div className="relative glass-effect rounded-xl shadow-md">
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Posez une question ou commencez une discussion..."
              className="w-full resize-none px-4 py-4 pr-14 text-dark-900 dark:text-light-100 bg-white/70 dark:bg-dark-800/70 focus:outline-none min-h-[56px] max-h-[200px] rounded-xl border border-light-300/50 dark:border-dark-700/50"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
                message.trim() 
                  ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm' 
                  : 'bg-dark-200 dark:bg-dark-700 text-dark-400 dark:text-dark-500'
              } disabled:opacity-50 cursor-pointer`}
              aria-label="Envoyer le message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Section Suggestions */}
      <section className="mb-12">
        <div className="flex items-center mb-4">
          <h2 className="text-lg font-medium text-dark-800 dark:text-light-200 flex items-center">
            <Sparkles size={18} className="mr-2 text-primary-500" />
            Suggestions
          </h2>
          <div className="ml-3 h-px bg-dark-200/50 dark:bg-dark-700/50 flex-grow"></div>
        </div>
        
        <div className="flex items-center gap-3">
          {promptSuggestions.map((prompt, index) => (
            <button
              key={index}
              onClick={() => handlePromptClick(prompt)}
              className="w-full max-w-xs aspect-square p-5 bg-white/70 dark:bg-dark-800/50 rounded-xl shadow-sm border border-light-300/30 dark:border-dark-700/50 transition group cursor-pointer"
            >
              <div className="flex flex-col items-center justify-center h-full space-y-3">

                <p className="text-center text-dark-800 dark:text-light-200 transition font-medium text-sm line-clamp-3 ">
                  {prompt}
                </p>
                <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-3">
                  <Sparkles size={20} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default WelcomeScreen;
