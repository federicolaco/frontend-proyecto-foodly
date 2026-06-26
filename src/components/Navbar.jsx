import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { hasSession, getStoredUser } from '../lib/auth'
import { getAppNavLinks, getProfileMenuItems, PUBLIC_NAV_LINKS } from '../lib/navLinks'
import { getHomePathForRole } from '../lib/roles'
import { NavBurgerMenu } from './NavBurgerMenu'
import { ProfileMenu } from './ProfileMenu'
import './Navbar.css'

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

export function Navbar() {
  const navigate = useNavigate()
  const profileBtnRef = useRef(null)
  const loggedIn = hasSession()
  const user = loggedIn ? getStoredUser() : null

  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const burgerLinks = loggedIn ? getAppNavLinks(user) : PUBLIC_NAV_LINKS
  const profileItems = loggedIn ? getProfileMenuItems(user) : []

  const handleLogoClick = () => {
    if (loggedIn) {
      navigate(getHomePathForRole(user.role, user))
      return
    }

    navigate('/')
  }

  return (
    <>
      <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
        <nav className="navbar__inner contenedor">
          <button
            type="button"
            className="navbar__menu"
            aria-label="Abrir menú de navegación"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>

          <button type="button" className="navbar__logo" onClick={handleLogoClick}>
            Foodly
          </button>

          {loggedIn ? (
            <div className="navbar__actions">
              <span className="navbar__greeting">¡Hola, {user.name}!</span>
              <div className="navbar__profile-wrap">
                <button
                  ref={profileBtnRef}
                  type="button"
                  className="navbar__profile-btn"
                  aria-label="Menú de perfil"
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                  onClick={() => setProfileOpen((prev) => !prev)}
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
            </div>
          ) : (
            <Link to="/iniciar-sesion" className="navbar__login">
              INGRESAR
            </Link>
          )}
        </nav>
      </header>

      <NavBurgerMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        links={burgerLinks}
        title={loggedIn ? 'Navegación' : 'Foodly'}
        userName={loggedIn ? user.name : null}
      />
    </>
  )
}
