// frontend/src/api/config.js
import ky from 'ky';

// Configuration de l'API
export const API_URL = '/api';

// Configuration de l'instance Ky
const api = ky.create({
  prefixUrl: API_URL,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = localStorage.getItem('token');
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      }
    ],
    afterResponse: [
      async (request, options, response) => {
        if (response.status === 401) {
          localStorage.removeItem('token');
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
        return response;
      }
    ]
  },
  // Configuration importante : activer le suivi des redirections
  redirect: 'follow',
  // timeout
  timeout: 30000
});

export default api;