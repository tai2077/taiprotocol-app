import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
    proxy: {
      '/api': {
        target: 'https://api.tai.lat',
        changeOrigin: true,
        secure: true,
      },
      '/price': {
        target: 'https://api.tai.lat',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          tonconnect: ['@tonconnect/ui-react'],
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'strip-csp-meta-in-dev',
      apply: 'serve',
      transformIndexHtml(html) {
        return html.replace(/\s*<meta http-equiv="Content-Security-Policy"[^>]*>\n?/i, '\n');
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      buffer: 'buffer/',
    },
  },
  optimizeDeps: {
    include: ['buffer'],
  },
});
