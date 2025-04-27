import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  // Build configurations
  build: {
    outDir: 'client/dist', // Ensure the build output directory is 'dist'
  },

  // Proxy for API requests during development
  server: {
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'production' ? 'https://your-backend-url.onrender.com' : 'http://localhost:5000', // Use backend URL on Render for production
        changeOrigin: true,
        secure: false
      }
    }
  }
});
