import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

// Register service worker immediately to enable offline caching and offline page reload
registerSW({
  immediate: true,
  onOfflineReady() {
    console.log('[SteamShed] App is cached and ready to load fully offline.');
  },
  onNeedRefresh() {
    console.log('[SteamShed] New update available.');
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

