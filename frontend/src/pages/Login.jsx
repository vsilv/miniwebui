// frontend/src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { toast } from 'react-hot-toast';
import { isAuthenticated, isLoading, login } from '../store/authStore';
import { ArrowRight, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';

const Login = () => {
  const navigate = useNavigate();
  const $isAuthenticated = useStore(isAuthenticated);
  const $isLoading = useStore(isLoading);
  
  // Initial default values are just for development convenience
  const [email, setEmail] = useState('admin@admin.com');
  const [password, setPassword] = useState('adminadmin');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if ($isAuthenticated) {
      navigate('/');
    }
  }, [$isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simple validation
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    setError('');
    
    const result = await login(email, password);
    
    if (result.success) {
      toast.success('Connexion réussie');
      navigate('/');
    } else {
      setError(result.error || 'Échec de la connexion');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white dark:bg-dark-950">
      {/* Left panel - Brand illustration */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 p-8 text-white">
        <div className="w-full max-w-md mx-auto flex flex-col justify-between">
          <div>
            <Logo size="lg" className="mb-8" />
            <h1 className="text-4xl font-display font-bold mb-6">
              Bienvenue sur MiniGPT
            </h1>
            <p className="text-xl font-light opacity-90 mb-6">
              Votre assistant IA personnel pour transformer vos idées en projets concrets.
            </p>
          </div>
          
          {/* Decorative pattern - visible but subtle */}
          <div className="relative h-64">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 blur-2xl"></div>
            <div className="absolute bottom-10 left-10 w-40 h-40 rounded-full bg-secondary-500/20 blur-xl"></div>
          </div>
          
          <div className="mt-auto">
            <p className="text-sm opacity-70">
              © 2025 Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
      
      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo - only visible on mobile screens */}
          <div className="flex justify-center mb-8 md:hidden">
            <Logo size="lg" />
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-dark-900 dark:text-light-100">
              Connexion à votre compte
            </h2>
            <p className="mt-2 text-dark-600 dark:text-dark-300">
              Accédez à votre assistant IA personnel
            </p>
          </div>
          
          {error && (
            <div className="mb-6 px-4 py-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 rounded-xl" role="alert">
              <p className="flex items-center">
                <span className="font-medium">{error}</span>
              </p>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dark-800 dark:text-dark-200 mb-1">
                Adresse email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-dark-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-3 border border-dark-300 dark:border-dark-700 rounded-xl placeholder-dark-400 text-dark-900 dark:text-light-100 dark:bg-dark-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="exemple@email.com"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-dark-800 dark:text-dark-200 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-dark-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-10 px-3 py-3 border border-dark-300 dark:border-dark-700 rounded-xl placeholder-dark-400 text-dark-900 dark:text-light-100 dark:bg-dark-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-dark-400 hover:text-dark-600 dark:hover:text-dark-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex justify-end mt-1">
                <a href="#" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                  Mot de passe oublié ?
                </a>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={$isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
              >
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-primary-300" aria-hidden="true" />
                </span>
                {$isLoading ? 'Connexion en cours...' : 'Se connecter'}
                {!$isLoading && (
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-dark-600 dark:text-dark-400">
              Vous n'avez pas de compte ?{' '}
              <Link to="/register" className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;