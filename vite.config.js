import { defineConfig } from "vite";
import react from "@vitejs/react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false, // Isso acelera muito o build e evita travamentos
    chunkSizeWarningLimit: 1600,
  },
});
