import React, { useState, useEffect } from 'react';

const LoadingScreen = () => {
  const [showLoader, setShowLoader] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!showLoader) {
    return <div className="min-h-screen bg-white dark:bg-dark-900"></div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-dark-900">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;