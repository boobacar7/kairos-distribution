import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: resolve(root, 'gallery'),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@kairos/ui': resolve(root, 'src/index.ts'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
  },
  build: {
    outDir: resolve(root, 'gallery-dist'),
    emptyOutDir: true,
  },
});
