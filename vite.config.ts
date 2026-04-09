import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
  // Use relative asset URLs so `dist/index.html` works when opened as file://
  // and when hosted under a subpath (e.g. GitHub Project Pages). Override with VITE_BASE_PATH if needed.
  base: process.env.VITE_BASE_PATH || './',
})
