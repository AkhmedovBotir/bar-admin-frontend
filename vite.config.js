import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    cors: false,
    proxy: {
      '/api': {
        target: 'https://barbackend.mixmall.uz',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'https://barbackend.mixmall.uz',
        changeOrigin: true,
        secure: false,
        ws: false
      }
    }
  }
})
