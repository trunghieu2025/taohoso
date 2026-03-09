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
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'templates/*.docx'],
      manifest: {
        name: 'TạoHồSơ - Tạo hồ sơ xây dựng',
        short_name: 'TạoHồSơ',
        description: 'Ứng dụng tạo hồ sơ xây dựng quân đội tự động',
        theme_color: '#10b981',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        // Cache busting: SW mới kích hoạt ngay, không chờ tab cũ đóng
        skipWaiting: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        // Không cache .docx/.xlsx để template luôn tải bản mới nhất
        globPatterns: ['**/*.{js,css,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
})
