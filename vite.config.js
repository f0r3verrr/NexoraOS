import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/kinopoisk': {
        // провайдер переехал с kinopoisk.dev на poiskkino.dev (301 на всех эндпоинтах)
        target: 'https://api.poiskkino.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/kinopoisk/, ''),
      },
    },
  },
});
