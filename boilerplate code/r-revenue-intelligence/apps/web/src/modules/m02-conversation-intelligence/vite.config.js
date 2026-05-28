import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  root: dir,
  envDir: path.resolve(dir, '../../../../../'),
  define: {
    'import.meta.env.VITE_GROQ_API_KEY': JSON.stringify(
      process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY || '',
    ),
    'import.meta.env.VITE_OPENROUTER_API_KEY': JSON.stringify(
      process.env.VITE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || '',
    ),
  },
  server: {
    port: 5175,
    strictPort: true,
    proxy: {
      '/api/v1': {
        target: process.env.VITE_M02_API_PROXY || 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
});
