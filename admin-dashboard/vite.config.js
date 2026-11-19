import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Import backend functions with: import { api } from '@backend/_generated/api'
      '@backend': fileURLToPath(new URL('../backend/convex', import.meta.url)),
    },
  },
  server: {
    // Allow Vite to serve files from the sibling backend folder
    fs: { allow: ['..'] },
  },
})
