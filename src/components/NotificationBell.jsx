import { useEffect, useRef, useState } from 'react'
import { getMyNotifications, markNotificationAsRead } from '../api/notifications'
import { formatDateTime } from '../lib/format'
import './NotificationBell.css'

const POLL_INTERVAL_MS = 30000

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const btnRef = useRef(null)
  const menuRef = useRef(null)

  const load = async () => {
    try {
      const data = await getMyNotifications()
      setNotifications(data)
    } catch {
     
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    const onPointerDown = (event) => {
      if (menuRef.current?.contains(event.target)) return
      if (btnRef.current?.contains(event.target)) return
      setOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [open])

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleToggle = () => {
    setOpen((prev) => !prev)
  }

  const handleNotificationClick = async (notification) => {
    if (notification.read) return

    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    )

    try {
      setLoading(true)
      await markNotificationAsRead(notification.id)
    } catch {
      
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="notification-bell">
      <button
        ref={btnRef}
        type="button"
        className="orders-navbar__icon-btn notification-bell__btn"
        aria-label={unreadCount > 0 ? `Notificaciones (${unreadCount} sin leer)` : 'Notificaciones'}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={handleToggle}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="notification-bell__badge" aria-hidden="true">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div ref={menuRef} className="notification-bell__menu" role="menu" aria-label="Notificaciones">
          <div className="notification-bell__header">Notificaciones</div>

          {notifications.length === 0 ? (
            <p className="notification-bell__empty">No tenés notificaciones.</p>
          ) : (
            <ul className="notification-bell__list">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    className={`notification-bell__item${notification.read ? '' : ' notification-bell__item--unread'}`}
                    onClick={() => handleNotificationClick(notification)}
                    disabled={loading}
                  >
                    <span className="notification-bell__message">{notification.message}</span>
                    <span className="notification-bell__date">{formatDateTime(notification.date)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}