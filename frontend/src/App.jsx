// frontend/src/App.jsx
import React, { useEffect, useState, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useStore } from "@nanostores/react";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import Knowledge from "./pages/Knowledge";
import Projects from "./pages/Projects";
import Project from "./pages/Project";

// Components
import Layout from "./components/Layout";
import LoadingScreen from "./components/LoadingScreen";

// Stores
import { isAuthenticated, isLoading, checkAuth } from "./store/authStore";

// Thème
import "./index.css";

// ProtectedRoute component
const ProtectedRoute = ({ children }) => {
  const $isAuthenticated = useStore(isAuthenticated);
  const $isLoading = useStore(isLoading);

  if ($isLoading) {
    return <LoadingScreen />;
  }

  if (!$isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const $isLoading = useStore(isLoading);

  useEffect(() => {
    const initApp = async () => {
      // Timer pour décider si on affiche le loader
      const loaderTimer = setTimeout(() => {
        if (!isInitialized) {
          setShowLoader(true);
        }
      }, 300); // Ne montre le loader que si l'initialisation prend plus de 300ms

      await checkAuth();
      setIsInitialized(true);

      // Nettoyer le timer
      clearTimeout(loaderTimer);
    };

    initApp();
    
    // Ajouter un effet de transition global au corps de page
    document.body.classList.add('transition-colors', 'duration-300');
    
    // Ajouter les polices via Google Fonts - uniquement si ce n'est pas déjà fait
    if (!document.getElementById('google-fonts')) {
      const link = document.createElement('link');
      link.id = 'google-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lexend:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // N'afficher le loader que si l'initialisation prend du temps
  if (!isInitialized) {
    if (!showLoader) {
      // Rendre un écran vide plutôt qu'un loader
      return <div className="min-h-screen bg-white dark:bg-dark-950"></div>;
    }
    return <LoadingScreen />;
  }

  return (
    <Router>
      <div className="app min-h-screen bg-light-50 dark:bg-dark-950 text-dark-900 dark:text-light-100">
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Chat />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:chatId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Chat />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/knowledge"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Knowledge />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Projects />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/project/:projectId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Project />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "var(--color-dark-800)",
              color: "#fff",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              borderRadius: "0.75rem",
              padding: "0.75rem 1rem",
            },
            success: {
              iconTheme: {
                primary: 'var(--color-primary-500)',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ff4b4b',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;