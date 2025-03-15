// frontend/vite.config.js
import path from "path";
import { defineConfig } from "vite";

import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const backendPort = process.env.BACKEND_PORT || 8000;
  const vitePort = process.env.PORT || 5173;

  return {
    server: {
      port: vitePort,
      hmr: process.env.HMR || true,
      proxy: {
        "/api": {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
          secure: false,
          // Configuration importante pour préserver les headers lors des redirections
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              // Préserver l'en-tête Authorization s'il existe
              if (req.headers.authorization) {
                proxyReq.setHeader('Authorization', req.headers.authorization);
              }
            });
          }
        },
      },
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});