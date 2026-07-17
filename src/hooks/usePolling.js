import { useEffect, useRef } from 'react'


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