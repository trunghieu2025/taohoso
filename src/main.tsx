import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// ============================================================
// CACHE BUSTING MẠNH: đảm bảo người dùng LUÔN thấy bản mới nhất
// ============================================================

// Phiên bản app - thay đổi mỗi lần build nhờ Vite inject timestamp
const APP_VERSION = import.meta.env.VITE_APP_VERSION || Date.now().toString()

if ('serviceWorker' in navigator) {
  // 1. Tự động reload khi SW mới kích hoạt
  let isReloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!isReloading) {
      isReloading = true
      window.location.reload()
    }
  })

  // 2. Chủ động check update SW mỗi 60 giây
  navigator.serviceWorker.ready.then((registration) => {
    // Check ngay lập tức
    registration.update().catch(() => { })

    // Check định kỳ mỗi 60 giây
    setInterval(() => {
      registration.update().catch(() => { })
    }, 60 * 1000)
  })

  // 3. Xóa toàn bộ cache cũ của SW (trừ font cache)
  if ('caches' in window) {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        // Giữ lại font cache, xóa hết cache khác nếu version khác
        if (!cacheName.includes('fonts')) {
          const savedVersion = localStorage.getItem('app-version')
          if (savedVersion && savedVersion !== APP_VERSION) {
            caches.delete(cacheName)
          }
        }
      })
      localStorage.setItem('app-version', APP_VERSION)
    })
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

