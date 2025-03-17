// frontend/src/components/Layout.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

const Layout = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState("default"); // 'default', 'rose-pine', 'rose-pine-dawn'

  // Initialisation du thème dark/light
  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Charger le thème sauvegardé
    const savedTheme = localStorage.getItem("theme") || "default";
    setTheme(savedTheme);
    applyTheme(savedTheme);

    // Charger l'état de la sidebar
    const savedSidebarState = localStorage.getItem("sidebarOpen");
    if (savedSidebarState !== null) {
      setSidebarOpen(savedSidebarState === "true");
    }

    // Ajouter la classe smooth-transitions pour les transitions CSS
    document.body.classList.add("transition-colors", "duration-300");
  }, []);

  // Fonction pour changer le mode dark/light
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Fonction pour changer le thème
  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  // Fonction pour basculer l'état de la sidebar
  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem("sidebarOpen", newState);
  };

  // Appliquer le thème à l'élément root
  const applyTheme = (themeName) => {
    document.body.className = "transition-colors duration-300";
    if (themeName !== "default") {
      document.body.classList.add(themeName);
    }
  };

  return (
    <div className={`${theme}`}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div
        className={`transition-all duration-300 flex flex-col min-h-screen bg-light-50 ${
          sidebarOpen ? "md:ml-72" : ""
        }`}
      >
        <Header
          onMenuClick={toggleSidebar}
          darkMode={darkMode}
          theme={theme}
          onThemeChange={changeTheme}
          onDarkModeToggle={toggleDarkMode}
          sidebarOpen={sidebarOpen}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-light-100">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-48 -right-48 w-96 h-96 rounded-full bg-primary-400/5 dark:bg-primary-500/5 blur-3xl"></div>
            <div className="absolute -bottom-48 -left-48 w-96 h-96 rounded-full bg-secondary-400/5 dark:bg-secondary-500/5 blur-3xl"></div>
          </div>

          {/* Content container */}
          <div className="relative z-10 min-h-full">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
