import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAppNavLinks, getProfileMenuItems } from '../lib/navLinks'
import { getStoredUser } from '../lib/auth'
import { NavBurgerMenu } from './NavBurgerMenu'
import { ProfileMenu } from './ProfileMenu'
import './OrdersNavbar.css'

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6h15l-1.5 9H8L6 6z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M6 6L5 3H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="10" cy="19" r="1.5" fill="currentColor" />
      <circle cx="17" cy="19" r="1.5" fill="currentColor" />
    </svg>
  )
}

export function OrdersNavbar() {
  const navigate = useNavigate()
  const user = getStoredUser()
  const profileBtnRef = useRef(null)

  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const navLinks = getAppNavLinks(user)
  const profileItems = getProfileMenuItems(user)

  const panelPath =
    user.role === 'admin'
      ? '/admin/solicitudes'
      : user.role === 'local' && user.localEnabled
        ? '/local-panel'
        : '/pedidos'

  const toggleProfile = () => setProfileOpen((prev) => !prev)

  return (
    <>
      <header className="orders-navbar">
        <nav className="orders-navbar__inner contenedor">
          <button
            type="button"
            className="orders-navbar__menu"
            aria-label="Abrir menú de navegación"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>

          <button
            type="button"
            className="orders-navbar__logo"
            onClick={() => navigate(panelPath)}
          >
            Foodly
          </button>

          <div className="orders-navbar__actions">
            <span className="orders-navbar__greeting">¡Hola, {user.name}!</span>

            {user.role === 'cliente' && (
              <>
                <button
                  type="button"
                  className="orders-navbar__text-btn orders-navbar__text-btn--desktop"
                  onClick={() => navigate('/pedidos')}
                >
                  Platos
                </button>
                <button
                  type="button"
                  className="orders-navbar__text-btn orders-navbar__text-btn--desktop"
                  onClick={() => navigate('/locales')}
                >
                  Locales
                </button>
                <button
                  type="button"
                  className="orders-navbar__text-btn orders-navbar__text-btn--desktop"
                  onClick={() => navigate('/mis-pedidos')}
                >
                  Mis pedidos
                </button>
              </>
            )}

            {user.role === 'admin' && (
              <>
                <button
                  type="button"
                  className="orders-navbar__text-btn orders-navbar__text-btn--desktop"
                  onClick={() => navigate('/admin/solicitudes')}
                >
                  Solicitudes
                </button>
                <button
                  type="button"
                  className="orders-navbar__text-btn orders-navbar__text-btn--desktop"
                  onClick={() => navigate('/admin/usuarios')}
                >
                  Usuarios
                </button>
              </>
            )}

            {user.role === 'local' && user.localEnabled && (
              <button
                type="button"
                className="orders-navbar__text-btn orders-navbar__text-btn--desktop"
                onClick={() => navigate('/local-panel')}
              >
                Mi local
              </button>
            )}

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
                <UserIcon />
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
                className="orders-navbar__icon-btn"
                aria-label="Carrito"
                onClick={() => navigate('/pedidos')}
              >
                <CartIcon />
              </button>
            )}
          </div>
        </nav>
      </header>

      <NavBurgerMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        links={navLinks}
        title="Navegación"
        userName={user.name}
      />
    </>
  )
}
