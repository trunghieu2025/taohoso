import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Load Inter font — latin subset only (giảm ~70% dung lượng font)
import '@fontsource/inter/latin-300.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/inter/latin-800.css'
import './index.css'
import App from './App.tsx'
import { ToastProvider } from './components/Toast.tsx'
import PinLock from './components/PinLock.tsx'

// Detect desktop (Electron) mode
const isDesktop = typeof window !== 'undefined' && (
  (window as any).electronAPI?.isDesktop || window.location.protocol === 'file:'
)

// Add CSS class for desktop-specific styling (title bar padding etc.)
if (isDesktop) {
  document.body.classList.add('electron-desktop');
}

// ============================================================
// CACHE BUSTING V2: XÓA TOÀN BỘ SW + CACHE CŨ ngay lập tức
// (Chỉ chạy trên web, KHÔNG chạy trên desktop)
// ============================================================

if (!isDesktop && 'serviceWorker' in navigator) {
  // Build-time version hash (thay đổi mỗi lần Vite build)
  const APP_VERSION = '__BUILD_' + (import.meta.env.VITE_APP_VERSION || '0') + '__'
  const STORED_VERSION = localStorage.getItem('app-version')

  // Version check — if version changed, clear old caches first
  if (STORED_VERSION !== APP_VERSION) {
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (const name of names) {
          caches.delete(name)
        }
      })
    }
    localStorage.setItem('app-version', APP_VERSION)
    if (STORED_VERSION) {
      window.location.reload()
    }
  }

  // Register Service Worker for PWA
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { })
  })

  // Auto-reload when SW updates
  let isReloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!isReloading) {
      isReloading = true
      window.location.reload()
    }
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <PinLock>
        <App />
      </PinLock>
    </ToastProvider>
  </StrictMode>,
)

