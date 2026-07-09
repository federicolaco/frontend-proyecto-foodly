import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { ToastViewport } from '../components/ToastViewport'

const ToastContext = createContext(null)

const DEFAULT_DURATIONS = {
  success: 4000,
  error: 5500,
  info: 4000,
  warning: 5000,
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counterRef = useRef(0)

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((message, options = {}) => {
    if (!message) return null
    const { type = 'info', duration } = typeof options === 'string' ? { type: options } : options

    counterRef.current += 1
    const id = `toast-${Date.now()}-${counterRef.current}`
    const resolvedDuration = duration ?? DEFAULT_DURATIONS[type] ?? DEFAULT_DURATIONS.info

    setToasts((prev) => [...prev, { id, message, type, duration: resolvedDuration }])
    return id
  }, [])

  const toast = useMemo(
    () => ({
      show: showToast,
      success: (message, duration) => showToast(message, { type: 'success', duration }),
      error: (message, duration) => showToast(message, { type: 'error', duration }),
      info: (message, duration) => showToast(message, { type: 'info', duration }),
      warning: (message, duration) => showToast(message, { type: 'warning', duration }),
      dismiss: dismissToast,
    }),
    [showToast, dismissToast],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de un <ToastProvider>')
  }
  return ctx
}
