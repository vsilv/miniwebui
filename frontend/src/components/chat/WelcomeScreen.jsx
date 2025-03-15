import React from 'react';
import { MessageSquare, PlusCircle, Database, Zap } from 'lucide-react';

const WelcomeScreen = ({ onNewChat, isLoading }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-gray-100 mb-8">
          MiniWebUI
        </h1>
        
        <div className="bg-white dark:bg-dark-800 shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Comment puis-je vous aider aujourd'hui ?
          </h2>
          
          <button
            onClick={onNewChat}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-dark-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusCircle size={20} />
            <span>Nouvelle conversation</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-dark-800 shadow-sm rounded-lg p-5">
            <div className="text-primary-600 dark:text-primary-400 mb-2">
              <MessageSquare size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Chat intelligent
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Interaction naturelle avec différents modèles de langage locaux ou basés sur API.
            </p>
          </div>
          
          <div className="bg-white dark:bg-dark-800 shadow-sm rounded-lg p-5">
            <div className="text-primary-600 dark:text-primary-400 mb-2">
              <Database size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Base de connaissances
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Importez vos documents et utilisez-les comme contexte pour des réponses plus précises.
            </p>
          </div>
          
          <div className="bg-white dark:bg-dark-800 shadow-sm rounded-lg p-5">
            <div className="text-primary-600 dark:text-primary-400 mb-2">
              <Zap size={24} />
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