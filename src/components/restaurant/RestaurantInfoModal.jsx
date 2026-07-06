import { useEffect } from 'react'
import './RestaurantInfoModal.css'

export function RestaurantInfoModal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="restaurant-info-modal" role="presentation">
      <button
        type="button"
        className="restaurant-info-modal__backdrop"
        aria-label="Cerrar"
        onClick={onClose}
      />

      <div className="restaurant-info-modal__panel" role="dialog" aria-modal="true" aria-label={title}>
        <header className="restaurant-info-modal__header">
          <h2 className="restaurant-info-modal__title">{title}</h2>
          <button
            type="button"
            className="restaurant-info-modal__close"
            aria-label="Cerrar"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="restaurant-info-modal__body">{children}</div>
      </div>
    </div>
  )
}