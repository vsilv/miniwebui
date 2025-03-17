// frontend/src/components/Header.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { 
  Menu, 
  UserCircle, 
  LogOut, 
  Settings, 
  ChevronDown,
  Bell,
  Sun,
  Moon,
  HelpCircle,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { user, logout } from '../store/authStore';
import Logo from './Logo';

const Header = ({ 
  onMenuClick, 
  darkMode, 
  onDarkModeToggle,
  theme,
  onThemeChange,
  sidebarOpen
}) => {
  const navigate = useNavigate();
  const $user = useStore(user);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  
  const userMenuRef = useRef(null);
  const themeMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  const searchRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Handle clicks outside of menus to close them
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setThemeMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="glass-effect sticky top-0 z-50 py-3 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="mr-4 p-2 rounded-full text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:hover:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 focus:outline-none transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
          </button>
          
     

          {/* Global search */}
          <div ref={searchRef} className="hidden md:block ml-8 relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher..."
                className={`
                  ${searchOpen ? 'w-64 pl-10' : 'w-40 pl-9'} 
                  py-1.5 pr-3 rounded-full bg-dark-100/50 dark:bg-dark-800/50 
                  border border-transparent focus:border-primary-300 dark:focus:border-primary-700
                  text-dark-800 dark:text-light-200 placeholder-dark-400 dark:placeholder-dark-500
                  focus:outline-none focus:ring-1 focus:ring-primary-400 
                  transition-all duration-300
                `}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setSearchOpen(false)}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 dark:text-dark-500">
                <Search size={16} />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 md:space-x-2">
          {/* Theme mode toggle */}
          <button
            onClick={onDarkModeToggle}
            className="p-2 rounded-full text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:hover:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 focus:outline-none transition-colors"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Theme selector */}
          <div ref={themeMenuRef} className="relative hidden md:block">
            <button
              onClick={() => setThemeMenuOpen(!themeMenuOpen)}
              className="p-2 rounded-full text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:hover:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 focus:outline-none transition-colors"
            >
              <Settings size={20} />
            </button>
            
            {themeMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 py-2 bg-white dark:bg-dark-800 rounded-xl shadow-medium border border-dark-200/50 dark:border-dark-700 z-20">
                <div className="px-3 py-2 border-b border-dark-100 dark:border-dark-700">
                  <h3 className="text-xs font-medium text-dark-400 dark:text-dark-500 uppercase tracking-wider">
                    Thème
                  </h3>
                  <div className="mt-2 space-y-1">
                    <button
                      onClick={() => {
                        onThemeChange('default');
                        setThemeMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
                        theme === 'default' 
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                          : 'hover:bg-dark-100 dark:hover:bg-dark-700'
                      }`}
                    >
                      Standard
                    </button>
                    <button
                      onClick={() => {
                        onThemeChange('rose-pine');
                        setThemeMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
                        theme === 'rose-pine' 
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                          : 'hover:bg-dark-100 dark:hover:bg-dark-700'
                      }`}
                    >
                      Rose Pine
                    </button>
                    <button
                      onClick={() => {
                        onThemeChange('rose-pine-dawn');
                        setThemeMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
                        theme === 'rose-pine-dawn' 
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                          : 'hover:bg-dark-100 dark:hover:bg-dark-700'
                      }`}
                    >
                      Rose Pine Dawn
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div ref={notificationsRef} className="relative hidden md:block">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 rounded-full text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:hover:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 focus:outline-none transition-colors"
            >
              <div className="relative">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  2
                </span>
              </div>
            </button>
            
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 py-2 bg-white dark:bg-dark-800 rounded-xl shadow-medium border border-dark-200/50 dark:border-dark-700 z-20">
                <div className="px-3 py-2 border-b border-dark-100 dark:border-dark-700 flex justify-between items-center">
                  <h3 className="text-sm font-medium text-dark-800 dark:text-light-200">
                    Notifications
                  </h3>
                  <button className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                    Tout marquer comme lu
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <div className="px-3 py-2 hover:bg-dark-100 dark:hover:bg-dark-700 border-l-2 border-primary-500">
                    <p className="text-sm text-dark-800 dark:text-light-200 font-medium">Bienvenue sur MiniGPT</p>
                    <p className="text-xs text-dark-500">Il y a 2 heures</p>
                  </div>
                  <div className="px-3 py-2 hover:bg-dark-100 dark:hover:bg-dark-700 border-l-2 border-primary-500">
                    <p className="text-sm text-dark-800 dark:text-light-200 font-medium">Nouvelle mise à jour disponible</p>
                    <p className="text-xs text-dark-500">Il y a 1 jour</p>
                  </div>
                </div>
                <div className="px-3 py-2 border-t border-dark-100 dark:border-dark-700">
                  <button className="w-full text-center text-xs text-primary-600 dark:text-primary-400 hover:underline">
                    Voir toutes les notifications
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Help */}
          <button
            className="hidden md:block p-2 rounded-full text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:hover:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 focus:outline-none transition-colors"
          >
            <HelpCircle size={20} />
          </button>

          {/* User menu */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 ml-1 px-2 py-1.5 rounded-full hover:bg-dark-100 dark:hover:bg-dark-700 focus:outline-none transition-colors"
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-medium overflow-hidden">
                {$user?.username ? $user.username.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-dark-800 dark:text-light-200 line-clamp-1">
                  {$user?.username || 'Utilisateur'}
                </p>
                <p className="text-xs text-dark-500 dark:text-dark-400 line-clamp-1">
                  {$user?.email || 'user@example.com'}
                </p>
              </div>
              <ChevronDown size={16} className="hidden md:block text-dark-400" />
            </button>
            
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 py-2 bg-white dark:bg-dark-800 rounded-xl shadow-medium border border-dark-200/50 dark:border-dark-700 z-20">
                <div className="px-4 py-3 border-b border-dark-100 dark:border-dark-700">
                  <p className="text-sm font-medium text-dark-800 dark:text-light-200">
                    {$user?.username || 'Utilisateur'}
                  </p>
                  <p className="text-xs text-dark-500 dark:text-dark-400 truncate">
                    {$user?.email || 'user@example.com'}
                  </p>
                </div>
                
                <div className="py-1">
                  <button
                    onClick={() => {
                      // TODO: Implement settings page
                      setUserMenuOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700"
                  >
                    <Settings size={16} className="mr-2" />
                    Paramètres
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-dark-100 dark:hover:bg-dark-700"
                  >
                    <LogOut size={16} className="mr-2" />
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;