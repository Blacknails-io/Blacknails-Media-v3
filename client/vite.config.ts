import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { themeSyncPlugin } from './vite-plugin-theme-sync.ts'

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      themeSyncPlugin()
    ],
    server: {
      host: true,
      watch: {
        usePolling: true
      },
      proxy: {
        '/api': {
          target: process.env.API_URL || 'http://localhost:3003',
          changeOrigin: true,
          ws: true
        },
        '/static': {
          target: process.env.API_URL || 'http://localhost:3003',
          changeOrigin: true
        }
      }
    }
  }
})
