import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const webSrc = path.resolve(dir, '../..');

export default defineConfig({
  plugins: [react()],
  root: dir,
  publicDir: path.resolve(webSrc, '../public'),
  envDir: path.resolve(dir, '../../../../../'),
  resolve: {
    alias: {
      '@': webSrc,
      'next/navigation': path.join(dir, 'vite-shims/next-navigation.ts'),
    },
  },
  server: {
    port: 5179,
    strictPort: true,
    proxy: {
      '/api/v1/account-intelligence': {
        target: process.env.VITE_M05_API_PROXY || 'http://localhost:4012',
        changeOrigin: true,
      },
    },
  },
});
