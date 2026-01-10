
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: 'public', // Ensures anything in /public is copied to the root of the site
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    sourcemap: false,
    emptyOutDir: true
  }
});
