import { defineConfig } from 'vite'
import react from '@vitejs/react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Desativa source maps para economizar memória
    sourcemap: false,
    // Aumenta o limite de chunks
    chunkSizeWarningLimit: 2000,
    // Força a limpeza de cache do rollup
    rollupOptions: {
      cache: false,
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'recharts'],
        },
      },
    },
  },
})