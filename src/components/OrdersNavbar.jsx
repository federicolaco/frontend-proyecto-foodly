import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getAppNavLinks, getProfileMenuItems } from '../lib/navLinks'
import { getStoredUser } from '../lib/auth'
import { useCart } from '../context/CartContext'
import { NotificationBell } from './NotificationBell'
import { ProfileMenu } from './ProfileMenu'
import './OrdersNavbar.css'

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="21" r="1" stroke="currentColor" strokeWidth="2" />
      <circle cx="20" cy="21" r="1" stroke="currentColor" strokeWidth="2" />
      <path
        d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function OrdersNavbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getStoredUser()
  const profileBtnRef = useRef(null)
  const linksRef = useRef(null)
  const { cart, itemCount } = useCart()

  const [profileOpen, setProfileOpen] = useState(false)
  const [linksOverflowing, setLinksOverflowing] = useState(false)

  const navLinks = getAppNavLinks(user)
  const profileItems = getProfileMenuItems(user)

  useEffect(() => {
    const el = linksRef.current
    if (!el) return

    const checkOverflow = () => setLinksOverflowing(el.scrollWidth > el.clientWidth + 1)

    checkOverflow()
    const observer = new ResizeObserver(checkOverflow)
    observer.observe(el)

    return () => observer.disconnect()
  }, [navLinks])

  const panelPath =
    user.role === 'admin'
      ? '/admin/solicitudes'
      : user.role === 'local' && user.localEnabled
        ? '/local-panel'
        : '/pedidos'

  const toggleProfile = () => setProfileOpen((prev) => !prev)

  const handleCartClick = () => {
    if (cart.restaurantId) {
      navigate(`/local/${cart.restaurantId}`)
      return
    }

    navigate('/pedidos')
  }

  return (
      <header className="orders-navbar">
        <nav className="orders-navbar__inner contenedor">
          <ul
            ref={linksRef}
            className={`orders-navbar__links${linksOverflowing ? ' orders-navbar__links--overflowing' : ''}`}
          >
            {navLinks.map((link) => (
              <li key={link.to}>
                <button
                  type="button"
                  className={`orders-navbar__link${
                    location.pathname === link.to ? ' orders-navbar__link--active' : ''
                  }`}
                  onClick={() => navigate(link.to)}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="orders-navbar__logo"
            onClick={() => navigate(panelPath)}
          >
            Foodly
          </button>

          <div className="orders-navbar__actions">
            <span className="orders-navbar__greeting">¡Hola, {user.name}!</span>

            <NotificationBell />

            <div className="orders-navbar__profile-wrap">
              <button
                ref={profileBtnRef}
                type="button"
                className="orders-navbar__icon-btn"
                aria-label="Menú de perfil"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                onClick={toggleProfile}
              >
                {user.photo ? (
                  <img
                    src={user.photo}
                    alt=""
                    className="orders-navbar__profile-photo"
                    aria-hidden="true"
                  />
                ) : (
                  <UserIcon />
                )}
              </button>

              <ProfileMenu
                open={profileOpen}
                onClose={() => setProfileOpen(false)}
                items={profileItems}
                anchorRef={profileBtnRef}
              />
            </div>
            {user.role === 'cliente' && (
              <button
                type="button"
                className="orders-navbar__icon-btn orders-navbar__cart-btn"
                aria-label={itemCount > 0 ? `Carrito (${itemCount} items)` : 'Carrito'}
                onClick={handleCartClick}
              >
                <CartIcon />
                {itemCount > 0 && (
                  <span className="orders-navbar__cart-badge" aria-hidden="true">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </nav>
      </header>
  )
}