// frontend/src/components/chat/WelcomeScreen.jsx
import React from 'react';
import { 
  MessageSquare, 
  PlusCircle, 
  Database, 
  Zap, 
  Sparkles, 
  ArrowRight,
  FileSearch,
  Brain,
  Bot,
  Command
} from 'lucide-react';
import Logo from '../Logo';

const WelcomeScreen = ({ onNewChat, isLoading, onPromptSelect }) => {
  // Liste des suggestions de prompts
  const promptSuggestions = [
    "Explique-moi les fondamentaux de l'architecture des microservices pour une application cloud native.",
    "Rédige une lettre de motivation pour un poste de Product Manager dans une startup tech.",
    "Crée un plan marketing pour le lancement d'une nouvelle application mobile de fitness.",
    "Quelles sont les meilleures pratiques pour optimiser les performances d'une application React en 2025 ?",
    "Comment puis-je structurer un système de design cohérent pour mon produit SaaS B2B ?"
  ];

  // Fonction pour créer une nouvelle conversation avec un prompt spécifique
  const handlePromptClick = (prompt) => {
    onPromptSelect(prompt);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-dark-900 dark:text-light-50 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">
            Bienvenue sur MiniGPT
          </h1>
          <p className="text-xl text-dark-600 dark:text-light-300 max-w-2xl mx-auto">
            Votre assistant IA personnel pour transformer vos idées en projets concrets.
            Discutez, organisez et créez avec puissance et intuitivité.
          </p>
        </div>
        
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-soft border border-light-300/30 dark:border-dark-700/50 p-8 mb-12">
          <h2 className="text-2xl font-display font-semibold text-dark-800 dark:text-light-100 mb-6 text-center">
            Commencer une nouvelle conversation
          </h2>
          
          <button
            onClick={onNewChat}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-5 px-6 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-dark-800 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium shadow-sm"
          >
            <PlusCircle size={24} />
            <span>Nouvelle conversation</span>
          </button>
          
          {/* Suggestions de prompts */}
          <div className="mt-10 relative">
            <div className="flex items-center justify-center absolute inset-x-0 -top-5">
              <div className="bg-dark-100 dark:bg-dark-700 px-4 py-1 rounded-full text-dark-600 dark:text-light-300 text-sm font-medium">
                Inspirations
              </div>
            </div>
            
            <div className="mt-6 space-y-3 pt-2">
              {promptSuggestions.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handlePromptClick(prompt)}
                  className="w-full text-left p-4 bg-light-50/70 hover:bg-light-100 dark:bg-dark-700/70 dark:hover:bg-dark-700 rounded-xl transition border border-light-300/30 dark:border-dark-600/30 group shadow-sm hover:shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-dark-800 dark:text-light-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition font-medium">
                        {prompt}
                      </p>
                    </div>
                    <div className="ml-4 mt-0.5 text-primary-600 dark:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-soft border border-light-300/30 dark:border-dark-700/50 p-6">
            <div className="h-12 w-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-5">
              <Bot size={24} />
            </div>
            <h3 className="text-lg font-semibold text-dark-900 dark:text-light-100 mb-3">
              Assistant IA évolué
            </h3>
            <p className="text-dark-600 dark:text-light-400">
              Interactions naturelles avec de puissants modèles de langage pour vous aider dans vos projets et recherches.
            </p>
          </div>
          
          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-soft border border-light-300/30 dark:border-dark-700/50 p-6">
            <div className="h-12 w-12 rounded-lg bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center text-secondary-600 dark:text-secondary-400 mb-5">
              <FileSearch size={24} />
            </div>
            <h3 className="text-lg font-semibold text-dark-900 dark:text-light-100 mb-3">
              Base de connaissances
            </h3>
            <p className="text-dark-600 dark:text-light-400">
              Importez et exploitez vos documents comme contexte pour obtenir des réponses précises et pertinentes.
            </p>
          </div>
          
          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-soft border border-light-300/30 dark:border-dark-700/50 p-6">
            <div className="h-12 w-12 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center text-accent-600 dark:text-accent-400 mb-5">
              <Command size={24} />
            </div>
            <h3 className="text-lg font-semibold text-dark-900 dark:text-light-100 mb-3">
              Gestion de projets
            </h3>
            <p className="text-dark-600 dark:text-light-400">
              Organisez votre travail en projets structurés, avec suivi des tâches et intégration de documents.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;