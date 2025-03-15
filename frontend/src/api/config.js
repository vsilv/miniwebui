// Configuration de l'API
export const API_URL = '/api';

import ky from 'ky';

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
          if (!window.location.pathname.includes('/login')) {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
        }
        return response;
      }
    ]
  },
  // 30 seconds timeout
  timeout: 30000
});

export default api;
