import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const isElectron = process.env.ELECTRON_BUILD === 'true'

// https://vite.dev/config/
export default defineConfig({
  // Use relative paths for Electron production build
  base: isElectron ? './' : '/',
  // Inject version mỗi lần build để cache busting phát hiện phiên bản mới
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(Date.now().toString()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'gstatic-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
      manifest: {
        name: 'TạoHồSơ — Tự động hóa hồ sơ',
        short_name: 'TạoHồSơ',
        description: 'Tạo, quản lý và xuất hồ sơ hành chính tại Việt Nam',
        theme_color: '#10b981',
        background_color: '#ffffff',
        display: 'standalone',
        lang: 'vi',
        icons: [
          { src: '/vite.svg', sizes: '64x64', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
})
