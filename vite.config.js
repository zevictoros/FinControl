import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // ou @vitejs/react-swc se estiver usando
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false, // Desativa os mapas de código para economizar RAM
    chunkSizeWarningLimit: 2000, // Aumenta o limite de aviso
    rollupOptions: {
      output: {
        // Divide o código em pedaços menores para facilitar o build
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          charts: ["recharts"],
          ui: ["framer-motion", "lucide-react"],
        },
      },
    },
  },
});
