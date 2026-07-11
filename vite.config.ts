import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Served from https://abramov-ms.github.io/retrograder/
  base: '/retrograder/',
})
