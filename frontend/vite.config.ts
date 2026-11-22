import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Em dev, o Vite repassa /api para o backend (no compose: http://backend:8000).
const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:8000'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Identifica o build: versiona o cache do service worker (public/sw.js).
  define: { __BUILD_ID__: JSON.stringify(Date.now().toString(36)) },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
    },
  },
})
