// src/api/auth.js
import api from './config';

/**
 * Login with email and password
 * @param {string} email User email
 * @param {string} password User password
 * @returns {Promise<Object>} Response with token and user info
 */
export const loginUser = async (email, password) => {
  try {
    // Format data as expected by FastAPI OAuth2PasswordRequestForm
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await api.post('auth/token', { body: formData }).json();
    return { success: true, data: response };
  } catch (error) {
    console.error('Login error:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Invalid email or password' 
    };
  }
};

/**
 * Register a new user
 * @param {string} username Username
 * @param {string} email User email
 * @param {string} password User password
 * @returns {Promise<Object>} Response with user info
 */
export const registerUser = async (username, email, password) => {
  try {
    const response = await api.post('auth/register', { 
      json: { username, email, password }
    }).json();
    return { success: true, data: response };
  } catch (error) {
    console.error('Registration error:', error);
    let errorMessage = 'Registration failed';
    
    // Try to extract error details from the response
    if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    }
    
    return { success: false, error: errorMessage };
  }
};

/**
 * Get current user profile
 * @returns {Promise<Object>} User profile data
 */
export const getCurrentUser = async () => {
  try {
    return await api.get('auth/me').json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};