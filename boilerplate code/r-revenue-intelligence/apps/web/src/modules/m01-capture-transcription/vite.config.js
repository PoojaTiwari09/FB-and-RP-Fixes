import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  root: dir,
  envDir: path.resolve(dir, '../../../../../'),
  resolve: {
    alias: {
      'next/link': path.join(dir, 'vite-shims/next-link.tsx'),
      'next/navigation': path.join(dir, 'vite-shims/next-navigation.ts'),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
    // Only proxy Nest routes — NOT /api/*.ts (Vite serves the local `api/` client folder at that path)
    proxy: {
      '/api/v1': {
        target: process.env.VITE_M01_API_PROXY || 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.VITE_M01_API_PROXY || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
