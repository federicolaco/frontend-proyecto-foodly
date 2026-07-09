import { useEffect, useRef, useState } from 'react'
import './Toast.css'

const ICONS = {
  success: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
      <path d="M7.5 12.5l3 3 6-6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
      <path d="M12 7.5v5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16.3" r="1.15" fill="currentColor" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3.5l9.5 16.5H2.5L12 3.5z" fill="currentColor" opacity="0.15" />
      <path d="M12 9.5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.1" fill="currentColor" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
      <circle cx="12" cy="8.3" r="1.1" fill="currentColor" />
      <path d="M12 11v5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
}

export function Toast({ id, type = 'info', message, duration = 4000, onDismiss }) {
  const [closing, setClosing] = useState(false)
  const [paused, setPaused] = useState(false)
  const remainingRef = useRef(duration)
  const startRef = useRef(Date.now())
  const timerRef = useRef(null)

  const close = () => {
    setClosing(true)
    window.setTimeout(() => onDismiss(id), 180)
  }

  useEffect(() => {
    if (duration === Infinity) return undefined

    const tick = () => {
      startRef.current = Date.now()
      timerRef.current = window.setTimeout(close, remainingRef.current)
    }

    if (!paused) tick()

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
        remainingRef.current = Math.max(remainingRef.current - (Date.now() - startRef.current), 0)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused])

  return (
    <div
      className={`toast toast--${type}${closing ? ' toast--closing' : ''}`}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span className="toast__icon">{ICONS[type] ?? ICONS.info}</span>
      <p className="toast__message">{message}</p>
      <button type="button" className="toast__close" aria-label="Cerrar notificación" onClick={close}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      {duration !== Infinity && (
        <span
          className="toast__progress"
          style={{ animationDuration: `${duration}ms`, animationPlayState: paused ? 'paused' : 'running' }}
        />
      )}
    </div>
  )
}
