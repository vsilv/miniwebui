// src/api/config.js
import ky from "ky";

// API base URL
export const API_URL = "/api";


// Create a configured Ky instance with prefixUrl
const api = ky.create({
  prefixUrl: API_URL,
  timeout: 30000,
  hooks: {
    beforeRequest: [
      (request) => {
        // Add authentication token to requests if available
        const token = localStorage.getItem("auth_token");
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      (request, options, response) => {
        // Handle authentication errors
        if (response.status === 401) {
          // Clear token and redirect to login if not already there
          localStorage.removeItem("auth_token");
          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login";
          }
        }
        return response;
      },
    ],
  },

});

export default api;
