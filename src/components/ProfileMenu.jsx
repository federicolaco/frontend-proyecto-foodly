import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../api/auth'
import './ProfileMenu.css'

export function ProfileMenu({ open, onClose, items, anchorRef }) {
  const navigate = useNavigate()
  const menuRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    const onPointerDown = (event) => {
      const target = event.target
      if (menuRef.current?.contains(target)) return
      if (anchorRef?.current?.contains(target)) return
      onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [open, onClose, anchorRef])

  if (!open) return null

  const handleItemClick = async (item) => {
    onClose()

    if (item.action === 'logout') {
      await logout()
      navigate('/iniciar-sesion', { replace: true })
      return
    }

    if (item.to) {
      navigate(item.to)
    }
  }

  return (
    <div ref={menuRef} className="profile-menu" role="menu" aria-label="Opciones de cuenta">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          className={`profile-menu__item${item.action === 'logout' ? ' profile-menu__item--danger' : ''}`}
          onClick={() => handleItemClick(item)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
