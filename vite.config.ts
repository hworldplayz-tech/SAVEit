import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api/alldl': {
          target: 'https://ahm7xmakki.com',
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('proxyRes', (proxyRes, _req, res) => {
              delete proxyRes.headers['access-control-allow-origin'];
              proxyRes.headers['access-control-allow-origin'] = '*';
              res.setHeader('Access-Control-Allow-Origin', '*');
            });
          },
        },
        '/api/faizan': {
          target: 'https://downloader.faizankhichi.me',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/faizan/, '/api'),
          headers: {
            referer: 'https://downloader.faizankhichi.me/',
            origin: 'https://downloader.faizankhichi.me',
          },
          secure: false,
          configure: (proxy) => {
            proxy.on('proxyRes', (proxyRes, _req, res) => {
              delete proxyRes.headers['access-control-allow-origin'];
              proxyRes.headers['access-control-allow-origin'] = '*';
              res.setHeader('Access-Control-Allow-Origin', '*');
            });
          },
        },
      },
    },
  };
});
