
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // This allows ngrok tunnels and other external hosts to access your dev server
    allowedHosts: true,
    // Ensure the port matches what you are using (usually 3000 or 5173)
    port: 3000, 
    strictPort: true,
  },
});
