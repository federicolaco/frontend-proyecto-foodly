import { useEffect, useRef } from 'react'

/**
 * Ejecuta `callback` de inmediato y luego cada `intervalMs`.
 * La primera ejecución llama a callback(false) (carga "normal", con spinner).
 * Las siguientes llaman a callback(true) (carga "silenciosa", sin spinner,
 * para no parpadear la pantalla en cada refresco de fondo).
 * Se pausa automáticamente mientras la pestaña del navegador no está visible.
 */
export function usePolling(callback, intervalMs, deps = []) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    let isFirst = true

    const tick = () => {
      if (document.visibilityState !== 'visible') return
      callbackRef.current(!isFirst)
      isFirst = false
    }

    tick()
    const id = setInterval(tick, intervalMs)
    return () => clearInterval(id)
   
  }, deps)
}