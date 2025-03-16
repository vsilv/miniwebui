// frontend/src/pages/Register.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { toast } from 'react-hot-toast';
import { isAuthenticated, register, login } from '../store/authStore';
import { ArrowRight, Mail, Lock, User, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import Logo from '../components/Logo';

const Register = () => {
  const navigate = useNavigate();
  const $isAuthenticated = useStore(isAuthenticated);
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Password strength indicators
  const [passStrength, setPassStrength] = useState({
    length: false,
    hasLowerCase: false,
    hasUpperCase: false,
    hasNumber: false,
  });

  // Redirect if already authenticated
  useEffect(() => {
    if ($isAuthenticated) {
      navigate('/');
    }
  }, [$isAuthenticated, navigate]);

  // Check password strength
  useEffect(() => {
    setPassStrength({
      length: password.length >= 8,
      hasLowerCase: /[a-z]/.test(password),
      hasUpperCase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    });
  }, [password]);

  const getPasswordStrength = () => {
    const { length, hasLowerCase, hasUpperCase, hasNumber } = passStrength;
    const criteria = [length, hasLowerCase, hasUpperCase, hasNumber];
    const metCriteria = criteria.filter(Boolean).length;
    
    if (metCriteria === 4) return { text: 'Fort', class: 'text-green-600 dark:text-green-400' };
    if (metCriteria >= 2) return { text: 'Moyen', class: 'text-amber-500 dark:text-amber-400' };
    return { text: 'Faible', class: 'text-red-500' };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!username || !email || !password || !passwordConfirm) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    if (password !== passwordConfirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    
    // Register user
    const result = await register(username, email, password);
    
    if (result.success) {
      toast.success('Inscription réussie');
      
      // Auto-login
      const loginResult = await login(email, password);
      
      if (loginResult.success) {
        navigate('/');
      } else {
        // If auto-login fails, redirect to login page
        navigate('/login');
      }
    } else {
      setError(result.error || 'Échec de l\'inscription');
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white dark:bg-dark-950">
      {/* Left panel - Brand illustration */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 p-8 text-white">
        <div className="w-full max-w-md mx-auto flex flex-col justify-between">
          <div>
            <Logo size="lg" className="mb-8" />
            <h1 className="text-4xl font-display font-bold mb-6">
              Rejoignez MiniGPT aujourd'hui
            </h1>
            <p className="text-xl font-light opacity-90 mb-6">
              Créez votre compte pour accéder à toutes les fonctionnalités de notre assistant IA.
            </p>
            
            <div className="mt-8 space-y-4">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-secondary-300 mr-2 flex-shrink-0 mt-0.5" />
                <p>Conversations IA intelligentes et personnalisées</p>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-secondary-300 mr-2 flex-shrink-0 mt-0.5" />
                <p>Base de connaissances pour contextualiser vos questions</p>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-secondary-300 mr-2 flex-shrink-0 mt-0.5" />
                <p>Organisation en projets pour une meilleure productivité</p>
              </div>
            </div>
          </div>
          
          {/* Decorative pattern - visible but subtle */}
          <div className="relative h-48">
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
      
      {/* Right panel - Registration form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo - only visible on mobile screens */}
          <div className="flex justify-center mb-8 md:hidden">
            <Logo size="lg" />
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-dark-900 dark:text-light-100">
              Créer un compte
            </h2>
            <p className="mt-2 text-dark-600 dark:text-dark-300">
              Commencez à utiliser dès aujourd'hui
            </p>
          </div>
          
          {error && (
            <div className="mb-6 px-4 py-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 rounded-xl" role="alert">
              <p className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </p>
            </div>
          )}
          
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-dark-800 dark:text-dark-200 mb-1">
                Nom d'utilisateur
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-dark-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-3 border border-dark-300 dark:border-dark-700 rounded-xl placeholder-dark-400 text-dark-900 dark:text-light-100 dark:bg-dark-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="votre_nom"
                />
              </div>
            </div>
            
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
                  autoComplete="new-password"
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
              
              {/* Password strength indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-dark-600 dark:text-dark-400">Force du mot de passe:</span>
                    <span className={`text-xs font-medium ${strength.class}`}>{strength.text}</span>
                  </div>
                  <div className="flex gap-2">
                    <div className={`h-1 flex-1 rounded-full ${passStrength.length ? 'bg-green-500' : 'bg-dark-300 dark:bg-dark-700'}`}></div>
                    <div className={`h-1 flex-1 rounded-full ${passStrength.hasLowerCase ? 'bg-green-500' : 'bg-dark-300 dark:bg-dark-700'}`}></div>
                    <div className={`h-1 flex-1 rounded-full ${passStrength.hasUpperCase ? 'bg-green-500' : 'bg-dark-300 dark:bg-dark-700'}`}></div>
                    <div className={`h-1 flex-1 rounded-full ${passStrength.hasNumber ? 'bg-green-500' : 'bg-dark-300 dark:bg-dark-700'}`}></div>
                  </div>
                  <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <li className={`flex items-center ${passStrength.length ? 'text-green-600 dark:text-green-400' : 'text-dark-600 dark:text-dark-400'}`}>
                      <CheckCircle size={12} className="mr-1 flex-shrink-0" />
                      Min. 8 caractères
                    </li>
                    <li className={`flex items-center ${passStrength.hasLowerCase ? 'text-green-600 dark:text-green-400' : 'text-dark-600 dark:text-dark-400'}`}>
                      <CheckCircle size={12} className="mr-1 flex-shrink-0" />
                      Une lettre minuscule
                    </li>
                    <li className={`flex items-center ${passStrength.hasUpperCase ? 'text-green-600 dark:text-green-400' : 'text-dark-600 dark:text-dark-400'}`}>
                      <CheckCircle size={12} className="mr-1 flex-shrink-0" />
                      Une lettre majuscule
                    </li>
                    <li className={`flex items-center ${passStrength.hasNumber ? 'text-green-600 dark:text-green-400' : 'text-dark-600 dark:text-dark-400'}`}>
                      <CheckCircle size={12} className="mr-1 flex-shrink-0" />
                      Un chiffre
                    </li>
                  </ul>
                </div>
              )}
            </div>
            
            <div>
              <label htmlFor="password-confirm" className="block text-sm font-medium text-dark-800 dark:text-dark-200 mb-1">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-dark-400" />
                </div>
                <input
                  id="password-confirm"
                  name="password-confirm"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-3 border border-dark-300 dark:border-dark-700 rounded-xl placeholder-dark-400 text-dark-900 dark:text-light-100 dark:bg-dark-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
              {passwordConfirm && password !== passwordConfirm && (
                <p className="mt-1 text-xs text-red-500">Les mots de passe ne correspondent pas</p>
              )}
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
              >
                {isSubmitting ? 'Création en cours...' : 'Créer mon compte'}
                {!isSubmitting && (
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-dark-600 dark:text-dark-400">
              Vous avez déjà un compte ?{' '}
              <Link to="/login" className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;