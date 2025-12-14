import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// FIX: Import fileURLToPath for ESM context to define __dirname
import { fileURLToPath } from 'url';

export default defineConfig(() => {
    // FIX: Define __dirname for ESM context
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './'),
        }
      },
      // CRITICAL fix for relative paths in deployment (Vercel)
      // This ensures that relative asset paths (like assets) work correctly in deployment
      base: './', 
    };
});