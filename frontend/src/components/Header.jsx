import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { Menu, UserCircle, LogOut, Settings, ChevronDown } from 'lucide-react';
import { user, logout } from '../store/authStore';

const Header = ({ onMenuClick, darkMode, theme, onThemeChange, onDarkModeToggle }) => {
  const navigate = useNavigate();
  const $user = useStore(user);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header bg-white dark:bg-dark-800 shadow-sm py-2 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>
          
          <h1 className="ml-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
            MiniWebUI
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Theme selector */}
          <div className="relative">
            <button
              onClick={() => setThemeMenuOpen(!themeMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 focus:outline-none"
            >
              Theme
              <ChevronDown size={16} />
            </button>
            
            {themeMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 py-2 bg-white dark:bg-dark-800 rounded-md shadow-lg z-20">
                <button
                  onClick={() => {
                    onThemeChange('default');
                    setThemeMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm ${theme === 'default' ? 'bg-gray-100 dark:bg-dark-700' : ''} hover:bg-gray-100 dark:hover:bg-dark-700`}
                >
                  Default
                </button>
                <button
                  onClick={() => {
                    onThemeChange('rose-pine');
                    setThemeMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm ${theme === 'rose-pine' ? 'bg-gray-100 dark:bg-dark-700' : ''} hover:bg-gray-100 dark:hover:bg-dark-700`}
                >
                  Rose Pine
                </button>
                <button
                  onClick={() => {
                    onThemeChange('rose-pine-dawn');
                    setThemeMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm ${theme === 'rose-pine-dawn' ? 'bg-gray-100 dark:bg-dark-700' : ''} hover:bg-gray-100 dark:hover:bg-dark-700`}
                >
                  Rose Pine Dawn
                </button>
              </div>
            )}
          </div>
          
          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 focus:outline-none"
            >
              <UserCircle size={20} />
              <span className="font-medium">{$user?.username || 'User'}</span>
              <ChevronDown size={16} />
            </button>
            
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 py-2 bg-white dark:bg-dark-800 rounded-md shadow-lg z-20">
                <button
                  onClick={() => {
                    // TODO: Implement settings page
                    setUserMenuOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700"
                >
                  <Settings size={16} className="mr-2" />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-dark-700"
                >
                  <LogOut size={16} className="mr-2" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;