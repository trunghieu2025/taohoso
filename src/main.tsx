import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// ============================================================
// CACHE BUSTING V2: XÓA TOÀN BỘ SW + CACHE CŨ ngay lập tức
// ============================================================

// Build-time version hash (thay đổi mỗi lần Vite build)
const APP_VERSION = '__BUILD_' + (import.meta.env.VITE_APP_VERSION || '0') + '__'
const STORED_VERSION = localStorage.getItem('app-version')

if ('serviceWorker' in navigator) {
  // Nếu version thay đổi (hoặc chưa lưu) → xóa hết SW + cache
  if (STORED_VERSION !== APP_VERSION) {
    // Unregister tất cả Service Workers cũ
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister()
      }
    })
    // Xóa tất cả caches
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (const name of names) {
          caches.delete(name)
        }
      })
    }
    localStorage.setItem('app-version', APP_VERSION)
    // Reload 1 lần để đảm bảo load code mới
    if (STORED_VERSION) {
      window.location.reload()
    }
  }

  // Tự động reload khi SW mới kích hoạt
  let isReloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!isReloading) {
      isReloading = true
      window.location.reload()
    }
  })

  // Check update SW mỗi 60 giây
  navigator.serviceWorker.ready.then((registration) => {
    registration.update().catch(() => { })
    setInterval(() => {
      registration.update().catch(() => { })
    }, 60 * 1000)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

