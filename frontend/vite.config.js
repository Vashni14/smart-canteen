import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import path from 'path'

export default defineConfig({
  plugins: [react(), basicSsl()],
  resolve: {
    alias: {
      '@':           path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages':      path.resolve(__dirname, './src/pages'),
      '@layouts':    path.resolve(__dirname, './src/layouts'),
      '@hooks':      path.resolve(__dirname, './src/hooks'),
      '@context':    path.resolve(__dirname, './src/context'),
      '@services':   path.resolve(__dirname, './src/services'),
      '@utils':      path.resolve(__dirname, './src/utils'),
      '@assets':     path.resolve(__dirname, './src/assets'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: false,
    proxy: {
      '/api': {
        target:       'http://localhost:5001',
        changeOrigin: true,
        secure:       false,
      },
      '/socket.io': {
        target:       'http://localhost:5001',
        changeOrigin: true,
        ws:           true,
        secure:       false,
      },
    },
  },
})
