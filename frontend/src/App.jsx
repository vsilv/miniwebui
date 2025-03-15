import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useStore } from '@nanostores/react';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import Knowledge from './pages/Knowledge';

// Components
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';

// Stores
import { isAuthenticated, isLoading, checkAuth } from './store/authStore';

// Thème
import './index.css';

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
  const $isLoading = useStore(isLoading);
  
  useEffect(() => {
    const initApp = async () => {
      await checkAuth();
      setIsInitialized(true);
    };
    
    initApp();
  }, []);
  
  // Afficher un écran de chargement pendant l'initialisation
  if (!isInitialized || $isLoading) {
    return <LoadingScreen />;
  }
  
  return (
    <Router>
      <div className="app min-h-screen bg-white dark:bg-dark-900 text-gray-900 dark:text-gray-100">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Chat />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/chat/:chatId" element={
            <ProtectedRoute>
              <Layout>
                <Chat />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/knowledge" element={
            <ProtectedRoute>
              <Layout>
                <Knowledge />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Toast notifications */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;