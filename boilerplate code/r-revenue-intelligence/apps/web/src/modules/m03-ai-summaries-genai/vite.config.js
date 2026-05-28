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
    port: 5177,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_M03_API_PROXY || 'http://localhost:4010',
        changeOrigin: true,
      },
    },
  },
});
