'use client'

import { useEffect } from 'react'

/**
 * Registers the app-shell service worker (public/sw.js) for PWA installability +
 * offline static assets. Production-only (a SW in dev interferes with HMR), and
 * a no-op where the API is unavailable. The SW never caches wallet data — see
 * public/sw.js.
 */
export function ServiceWorkerRegister () {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    const onLoad = () => { void navigator.serviceWorker.register('/sw.js').catch(() => {}) }
    window.addEventListener('load', onLoad)
    return () => window.removeEventListener('load', onLoad)
  }, [])
  return null
}
