// frontend/src/store/authStore.js
import { atom } from 'nanostores';
import api from '../api/config';

// Store pour l'authentification
export const user = atom(null);
export const isAuthenticated = atom(false);
export const isLoading = atom(true);

// Vérifier l'authentification au chargement
export const checkAuth = async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    isAuthenticated.set(false);
    isLoading.set(false);
    return false;
  }
  
  try {
    // Ajouter un slash à la fin pour éviter la redirection
    const userData = await api.get('auth/me/').json();
    user.set(userData);
    isAuthenticated.set(true);
    isLoading.set(false);
    return true;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'authentification:', error);
    localStorage.removeItem('token');
    user.set(null);
    isAuthenticated.set(false);
    isLoading.set(false);
    return false;
  }
};

// Fonction pour se connecter
export const login = async (email, password) => {
  try {
    // Format attendu par l'API FastAPI OAuth2PasswordRequestForm
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    // Ajouter un slash à la fin pour éviter la redirection
    const response = await api.post('auth/token/', { body: formData }).json();
    const { access_token } = response;
    
    localStorage.setItem('token', access_token);
    
    // Ajouter un slash à la fin pour éviter la redirection
    const userData = await api.get('auth/me/').json();
    user.set(userData);
    isAuthenticated.set(true);
    
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return { 
      success: false, 
      error: error.message || 'Erreur lors de la connexion'
    };
  }
};

// Fonction pour s'inscrire
export const register = async (username, email, password) => {
  try {
    // Ajouter un slash à la fin pour éviter la redirection
    const response = await api.post('auth/register/', { 
      json: { username, email, password }
    }).json();
    
    return { success: true, user: response };
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    return { 
      success: false, 
      error: error.message || 'Erreur lors de l\'inscription'
    };
  }
};

// Fonction pour se déconnecter
export const logout = () => {
  localStorage.removeItem('token');
  user.set(null);
  isAuthenticated.set(false);
};