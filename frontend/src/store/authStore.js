// src/store/authStore.js
import { atom } from 'nanostores';
import { loginUser, registerUser, getCurrentUser } from '../api/auth';

// Auth state atoms
export const user = atom(null);
export const isAuthenticated = atom(false);
export const isLoading = atom(true);

/**
 * Check if user is authenticated by verifying token and fetching user data
 * @returns {Promise<boolean>} Authentication status
 */
export const checkAuth = async () => {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    isAuthenticated.set(false);
    isLoading.set(false);
    return false;
  }
  
  try {
    const userData = await getCurrentUser();
    user.set(userData);
    isAuthenticated.set(true);
    isLoading.set(false);
    return true;
  } catch (error) {
    console.error('Auth check failed:', error);
    logout();
    return false;
  }
};

/**
 * Login user
 * @param {string} email User email
 * @param {string} password User password
 * @returns {Promise<Object>} Result object with success flag and data/error
 */
export const login = async (email, password) => {
  try {
    isLoading.set(true);
    const result = await loginUser(email, password);
    
    if (result.success) {
      const { access_token } = result.data;
      localStorage.setItem('auth_token', access_token);
      
      // Get user profile
      const userData = await getCurrentUser();
      user.set(userData);
      isAuthenticated.set(true);
    }
    
    isLoading.set(false);
    return result;
  } catch (error) {
    isLoading.set(false);
    return { 
      success: false, 
      error: error.message || 'Login failed'
    };
  }
};

/**
 * Register a new user
 * @param {string} username Username
 * @param {string} email User email
 * @param {string} password User password
 * @returns {Promise<Object>} Result object with success flag and data/error
 */
export const register = async (username, email, password) => {
  try {
    isLoading.set(true);
    const result = await registerUser(username, email, password);
    isLoading.set(false);
    return result;
  } catch (error) {
    isLoading.set(false);
    return { 
      success: false, 
      error: error.message || 'Registration failed'
    };
  }
};

/**
 * Logout user
 */
export const logout = () => {
  localStorage.removeItem('auth_token');
  user.set(null);
  isAuthenticated.set(false);
  isLoading.set(false);
};