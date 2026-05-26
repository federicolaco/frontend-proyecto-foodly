import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './Navbar.css'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <nav className="navbar__inner contenedor">
        <a href="" className="navbar__menu" aria-label="Menú">
          <span />
          <span />
          <span />
        </a>

        <Link to="/" className="navbar__logo">
          Foodly
        </Link>

        <Link to="/iniciar-sesion" className="navbar__login">
          INGRESAR
        </Link>
      </nav>
    </header>
  )
}
