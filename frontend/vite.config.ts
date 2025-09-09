import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries
          vendor: ['react', 'react-dom'],
          // Split UI library
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-label'],
          // Split chart library
          charts: ['recharts'],
          // Split icon library
          icons: ['lucide-react'],
          // Split utilities
          utils: ['axios', 'clsx', 'tailwind-merge']
        }
      }
    },
    // Enable source maps for production debugging
    sourcemap: process.env.NODE_ENV === 'production',
    // Optimize chunk size
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'lucide-react',
      'recharts',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-label'
    ]
  },
  server: {
    // Enable hmr for better development experience
    hmr: true,
    // Optimize build performance
    watch: {
      usePolling: true,
      interval: 100
    }
  }
})