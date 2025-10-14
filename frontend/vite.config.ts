import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'react-vendor'
            if (id.includes('framer-motion')) return 'framer-motion'
            if (id.includes('@tanstack') || id.includes('react-query')) return 'tanstack-query'
            if (id.includes('lucide-react')) return 'icons'
            if (id.includes('@radix-ui')) return 'radix'
            if (id.includes('tailwindcss')) return 'tailwind'
            return 'vendor'
          }
        }
      }
    }
  }
})
