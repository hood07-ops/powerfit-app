const UPDATE_EVENT = 'powerfit:update-ready'

export function registerPowerFitPwa() {
  if (!('serviceWorker' in navigator)) return
  if (!import.meta.env.PROD) return

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')

      registration.addEventListener('updatefound', () => {
        const worker = registration.installing
        if (!worker) return

        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: registration }))
          }
        })
      })

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (window.__powerfitRefreshing) return
        window.__powerfitRefreshing = true
        window.location.reload()
      })
    } catch (error) {
      console.warn('No se pudo registrar PowerFit PWA', error)
    }
  })
}

export function listenForPowerFitUpdate(callback) {
  function handler(event) {
    callback(event.detail)
  }

  window.addEventListener(UPDATE_EVENT, handler)
  return () => window.removeEventListener(UPDATE_EVENT, handler)
}

export function applyPowerFitUpdate(registration) {
  const worker = registration?.waiting || registration?.installing
  worker?.postMessage({ type: 'SKIP_WAITING' })
}
