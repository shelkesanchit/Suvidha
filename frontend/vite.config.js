import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    allowedHosts: [
      'localhost',
      '.ngrok.io',
      '.ngrok-free.app',
      '.ngrok-free.dev',
      '.trycloudflare.com',
      '.loca.lt'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        // Allow multipart file uploads up to 10 MB through the proxy
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Preserve the original Content-Type (including multipart boundary) for file uploads
            if (req.headers['content-type']) {
              proxyReq.setHeader('content-type', req.headers['content-type']);
            }
          });
        },
      }
    }
  },
  build: {
    outDir: 'build',
    sourcemap: false
  }
})
