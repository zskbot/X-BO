import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    // GitHub Pages publishes this project at /X-BO/, not at the domain root.
    // VITE_BASE_PATH can be overridden for previews or other hosting providers.
    base: process.env.VITE_BASE_PATH || '/X-BO/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/v1': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
        '/chat': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
