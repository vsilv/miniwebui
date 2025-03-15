import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Sun, Moon } from 'lucide-react';

const Layout = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState('default'); // 'default', 'rose-pine', 'rose-pine-dawn'

  // Initialisation du thème dark/light
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Charger le thème sauvegardé
    const savedTheme = localStorage.getItem('theme') || 'default';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  // Fonction pour changer le mode dark/light
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Fonction pour changer le thème
  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  // Appliquer le thème à l'élément root
  const applyTheme = (themeName) => {
    document.body.className = '';
    if (themeName !== 'default') {
      document.body.classList.add(themeName);
    }
  };

  return (
    <div className={`flex h-screen ${theme}`}>
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          darkMode={darkMode}
          theme={theme}
          onThemeChange={changeTheme}
          onDarkModeToggle={toggleDarkMode}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-dark-900">
          {children}
        </main>
        
        {/* Toggle dark mode button (fixed) */}
        <button
          onClick={toggleDarkMode}
          className="fixed bottom-4 right-4 p-2 rounded-full bg-gray-200 dark:bg-dark-700 text-gray-800 dark:text-gray-200 shadow-lg"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </div>
  );
};

export default Layout;