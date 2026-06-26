import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './NavBurgerMenu.css'

export function NavBurgerMenu({ open, onClose, links, title = 'Menú', userName }) {
  const navigate = useNavigate()

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

  const handleNavigate = (to) => {
    onClose()
    navigate(to)
  }

  return (
    <div className="nav-burger" role="presentation">
      <button
        type="button"
        className="nav-burger__backdrop"
        aria-label="Cerrar menú"
        onClick={onClose}
      />

      <aside className="nav-burger__panel" role="dialog" aria-modal="true" aria-label={title}>
        <header className="nav-burger__header">
          <div>
            <p className="nav-burger__title">{title}</p>
            {userName && <p className="nav-burger__user">¡Hola, {userName}!</p>}
          </div>
          <button type="button" className="nav-burger__close" aria-label="Cerrar menú" onClick={onClose}>
            ×
          </button>
        </header>

        <nav className="nav-burger__nav">
          <ul className="nav-burger__list">
            {links.map((link) => (
              <li key={link.to}>
                <button
                  type="button"
                  className="nav-burger__link"
                  onClick={() => handleNavigate(link.to)}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  )
}
