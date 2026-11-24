import { copyFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Vercel serves this for any path that is not a real file, including /login.
function spaFallback() {
  return {
    name: 'spa-fallback',
    apply: 'build',
    writeBundle(options) {
      if (!options.dir) return
      copyFileSync(join(options.dir, 'index.html'), join(options.dir, '404.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), spaFallback()],
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
