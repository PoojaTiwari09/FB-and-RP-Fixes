import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  root: dir,
  envDir: path.resolve(dir, '../../../../../'),
  server: {
    port: 5178,
    strictPort: true,
    // Only proxy Nest routes — NOT /api/*.ts (Vite serves the local `api/` client folder)
    proxy: {
      '/api/v1': {
        target: process.env.VITE_M10_API_PROXY || 'http://localhost:4011',
        changeOrigin: true,
      },
    },
  },
});
