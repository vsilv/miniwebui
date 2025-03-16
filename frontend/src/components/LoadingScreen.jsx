// frontend/src/components/LoadingScreen.jsx
import React, { useState, useEffect } from 'react';
import Logo from './Logo';

const LoadingScreen = () => {
  const [showLoader, setShowLoader] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(true);
    }, 300);
    
    // Simuler une progression de chargement pour une meilleure UX
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        const nextProgress = prev + Math.random() * 15;
        return nextProgress > 90 ? 90 : nextProgress; // Cap à 90% pour ne pas donner l'impression que c'est terminé
      });
    }, 400);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);
  
  if (!showLoader) {
    return <div className="min-h-screen bg-white dark:bg-dark-950"></div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-light-50 dark:bg-dark-950 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -right-48 w-96 h-96 rounded-full bg-primary-400/5 dark:bg-primary-500/5 blur-3xl"></div>
        <div className="absolute -bottom-48 -left-48 w-96 h-96 rounded-full bg-secondary-400/5 dark:bg-secondary-500/5 blur-3xl"></div>
      </div>
      
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="mb-8 scale-100 transition-all">
          <Logo size="xl" />
        </div>
        
        <div className="w-64 h-1 bg-dark-200/30 dark:bg-dark-800/50 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
            style={{ width: `${loadingProgress}%`, transition: 'width 0.4s ease-in-out' }}
          ></div>
        </div>
        
        <p className="text-lg font-medium text-dark-800 dark:text-light-200 mb-1">
          Chargement...
        </p>
        <p className="text-dark-500 dark:text-dark-400 max-w-xs">
          Préparation de votre environnement
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;