import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Since you have a 'public' folder now, we use the default behavior.
  // Vite will copy everything from 'public' to the root of the 'dist' folder on build.
  publicDir: 'public', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    fs: {
      allow: ['.']
    }
  }
});