import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // Inject version mỗi lần build để cache busting phát hiện phiên bản mới
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(Date.now().toString()),
  },
  plugins: [
    react(),
    // VitePWA tạm tắt để kill-switch SW xóa cache cũ
    // VitePWA({...}),
  ],
})
