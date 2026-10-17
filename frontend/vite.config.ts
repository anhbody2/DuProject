import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// The browser always calls the relative `/api/...`. In dev (and `vite preview`)
// Vite proxies it to BACKEND_URL; in Docker, nginx does the same (see nginx.conf.template).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // ws: chat's Socket.IO endpoint is /api/socket.io.
  const proxy = { '/api': { target: env.BACKEND_URL || 'http://localhost:3000', changeOrigin: true, ws: true } };
  return {
    plugins: [react()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    // Hashed bundles go to /static so they don't mix with the design images in public/assets.
    build: { assetsDir: 'static' },
    server: { port: 5173, proxy },
    preview: { port: 5173, proxy },
  };
});
