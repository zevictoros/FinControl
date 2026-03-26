import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path' // 👈 IMPORTANTE

export default defineConfig({
  logLevel: 'error',
  plugins: [
    base44({
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // 👈 ISSO RESOLVE
    },
  },
});