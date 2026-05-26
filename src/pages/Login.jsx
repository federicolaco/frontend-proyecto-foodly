import { Link } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { PasswordField } from '../components/PasswordField'
import './AuthPages.css'

export function Login() {
  return (
    <AuthLayout>
      <h1 className="auth-page__title auth-page__title--login">Bienvenido a Foodly</h1>
      <h2 className="auth-page__section-title auth-page__section-title--login">
        Inicia sesión y pedí en segundos
      </h2>

      <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
        <label className="auth-field" htmlFor="login-email">
          <span className="auth-field__label">Correo electrónico</span>
          <span className="auth-field__control">
            <input
              id="login-email"
              type="email"
              placeholder="Correo electrónico"
              autoComplete="email"
            />
          </span>
        </label>

        <PasswordField id="login-password" label="Contraseña" placeholder="Contraseña" />

        <Link to="#" className="auth-link">
          ¿Olvidaste tu contraseña?
        </Link>

        <button type="submit" className="auth-btn auth-btn--primary">
          INGRESAR
        </button>
      </form>

      <div className="auth-divider auth-divider--login-accent" aria-hidden="true">
        <span className="auth-divider__line" />
      </div>

      <div className="auth-page__footer">
        <p className="auth-page__footer-text">¿No estás registrado?</p>
        <Link to="/registrarse" className="auth-btn auth-btn--outline">
          REGISTRARSE
        </Link>
      </div>
    </AuthLayout>
  )
}
