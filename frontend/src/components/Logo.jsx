// frontend/src/components/Logo.jsx
import React from 'react';

const Logo = ({ size = 'md', variant = 'full', className = '' }) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
    xl: 'h-16'
  };

  const heightClass = sizeClasses[size] || sizeClasses.md;

  // Logo minimaliste inspiré de l'image
  if (variant === 'icon') {
    return (
      <div className={`${heightClass} aspect-square relative ${className}`}>
        <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <path 
            d="M25 5C13.954 5 5 13.954 5 25C5 36.046 13.954 45 25 45C36.046 45 45 36.046 45 25C45 13.954 36.046 5 25 5Z" 
            className="fill-primary-200 dark:fill-primary-900"
          />
          <path 
            d="M25 15C19.477 15 15 19.477 15 25C15 30.523 19.477 35 25 35C30.523 35 35 30.523 35 25C35 19.477 30.523 15 25 15Z" 
            className="fill-primary-500 dark:fill-primary-400"
          />
          <path 
            d="M32.5 25C32.5 21.134 29.366 18 25.5 18C21.634 18 18.5 21.134 18.5 25C18.5 28.866 21.634 32 25.5 32" 
            className="stroke-white dark:stroke-dark-800" 
            strokeWidth="3" 
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  // Logo complet avec nom
  return (
    <div className={`flex items-center ${className}`}>
      <div className={`${heightClass} aspect-square relative`}>
        <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <path 
            d="M25 5C13.954 5 5 13.954 5 25C5 36.046 13.954 45 25 45C36.046 45 45 36.046 45 25C45 13.954 36.046 5 25 5Z" 
            className="fill-primary-200 dark:fill-primary-900"
          />
          <path 
            d="M25 15C19.477 15 15 19.477 15 25C15 30.523 19.477 35 25 35C30.523 35 35 30.523 35 25C35 19.477 30.523 15 25 15Z" 
            className="fill-primary-500 dark:fill-primary-400"
          />
          <path 
            d="M32.5 25C32.5 21.134 29.366 18 25.5 18C21.634 18 18.5 21.134 18.5 25C18.5 28.866 21.634 32 25.5 32" 
            className="stroke-white dark:stroke-dark-800" 
            strokeWidth="3" 
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className={`ml-2 font-display font-semibold text-dark-900 dark:text-white`}>
        <span className="text-primary-600 dark:text-primary-400">Mini</span>
        <span>GPT</span>
      </div>
    </div>
  );
};

export default Logo;