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
<<<<<<< HEAD
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
  },
=======
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
>>>>>>> 94256b010af947abfb1a10168c375365908e8bb7
})
