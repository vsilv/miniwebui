import React from 'react';
import { MessageSquare, PlusCircle, Database, Zap, Sparkles } from 'lucide-react';

const WelcomeScreen = ({ onNewChat, isLoading, onPromptSelect }) => {
  // Liste des suggestions de prompts
  const promptSuggestions = [
    "Explique-moi comment fonctionne l'apprentissage par renforcement de manière simple.",
    "Rédige une lettre de motivation pour un poste de développeur full-stack.",
    "Quelles sont les meilleures pratiques pour optimiser une application React en 2025 ?"
  ];

  // Fonction pour créer une nouvelle conversation avec un prompt spécifique
  const handlePromptClick = (prompt) => {
    onPromptSelect(prompt);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            MiniWebUI
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Votre assistant IA personnel, simple et efficace
          </p>
        </div>
        
        <div className="bg-white dark:bg-dark-800 shadow-lg rounded-xl p-8 mb-10">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6 text-center">
            Comment puis-je vous aider aujourd'hui ?
          </h2>
          
          <button
            onClick={onNewChat}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-dark-800 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
          >
            <PlusCircle size={24} />
            <span>Nouvelle conversation</span>
          </button>
          
          {/* Suggestions de prompts */}
          <div className="mt-8">
            <h3 className="flex items-center text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
              <Sparkles size={20} className="text-primary-500 mr-2" />
              Suggestions
            </h3>
            
            <div className="space-y-3">
              {promptSuggestions.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handlePromptClick(prompt)}
                  className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 dark:bg-dark-700 dark:hover:bg-dark-600 rounded-lg transition border border-gray-200 dark:border-dark-600 group"
                >
                  <div className="flex items-start">
                    <span className="text-sm text-gray-800 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition">
                      {prompt}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-dark-800 shadow-md rounded-lg p-6">
            <div className="text-primary-600 dark:text-primary-400 mb-3">
              <MessageSquare size={28} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Chat intelligent
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Interaction naturelle avec différents modèles de langage locaux ou basés sur API.
            </p>
          </div>
          
          <div className="bg-white dark:bg-dark-800 shadow-md rounded-lg p-6">
            <div className="text-primary-600 dark:text-primary-400 mb-3">
              <Database size={28} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Base de connaissances
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Importez vos documents et utilisez-les comme contexte pour des réponses plus précises.
            </p>
          </div>
          
          <div className="bg-white dark:bg-dark-800 shadow-md rounded-lg p-6">
            <div className="text-primary-600 dark:text-primary-400 mb-3">
              <Zap size={28} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Interface légère
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Solution compacte et rapide, inspirée d'OpenWebUI avec l'essentiel des fonctionnalités.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;