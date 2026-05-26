import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/ai-summaries': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/admin': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/share': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/feedback': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
