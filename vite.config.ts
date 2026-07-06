import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      // Reenvía /api al servidor local de dev-server.ts (ver npm run dev:api / dev:local).
      '/api': 'http://localhost:3001',
    },
  },
});
