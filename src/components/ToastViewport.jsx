import { createPortal } from 'react-dom'
import { Toast } from './Toast'
import './Toast.css'

export function ToastViewport({ toasts, onDismiss }) {
  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="toast-viewport" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body,
  )
}
