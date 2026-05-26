import { Link } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { PasswordField } from '../components/PasswordField'
import './AuthPages.css'

const PASSWORD_HINT = {
  intro: 'La contraseña debe tener:',
  items: [
    'Un largo mínimo de 8 caracteres',
    'Al menos 1 letra mayúscula',
    'Al menos 1 número',
    'Al menos 1 carácter especial (ej. _ @ !)',
  ],
}

function GoogleIcon() {
  return (
    <svg className="auth-btn__google-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export function Register() {
  return (
    <AuthLayout>
      <h1 className="auth-page__title auth-page__title--register">Registrate en Foodly</h1>

      <button type="button" className="auth-btn auth-btn--outline auth-btn--google">
        <GoogleIcon />
        CONTINUAR CON GOOGLE
      </button>

      <div className="auth-divider" aria-hidden="true">
        <span className="auth-divider__line" />
        <span className="auth-divider__label">o</span>
        <span className="auth-divider__line" />
      </div>

      <h2 className="auth-page__section-title auth-page__section-title--register">
        Ingresa tus datos para registrarte
      </h2>

      <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
        <div className="auth-form__row">
          <label className="auth-field" htmlFor="register-first-name">
            <span className="auth-field__label">Nombre</span>
            <span className="auth-field__control">
              <input id="register-first-name" type="text" placeholder="Nombre" autoComplete="given-name" />
            </span>
          </label>

          <label className="auth-field" htmlFor="register-last-name">
            <span className="auth-field__label">Apellido</span>
            <span className="auth-field__control">
              <input id="register-last-name" type="text" placeholder="Apellido" autoComplete="family-name" />
            </span>
          </label>
        </div>

        <label className="auth-field" htmlFor="register-address">
          <span className="auth-field__label">Domicilio (calle, número)</span>
          <span className="auth-field__control">
            <input
              id="register-address"
              type="text"
              placeholder="Domicilio (calle, número)"
              autoComplete="street-address"
            />
          </span>
        </label>

        <label className="auth-field" htmlFor="register-email">
          <span className="auth-field__label">Correo electrónico</span>
          <span className="auth-field__control">
            <input
              id="register-email"
              type="email"
              placeholder="Correo electrónico"
              autoComplete="email"
            />
          </span>
        </label>

        <PasswordField
          id="register-password"
          label="Contraseña"
          placeholder="Contraseña"
          hint={PASSWORD_HINT}
        />

        <PasswordField
          id="register-confirm-password"
          label="Confirmar contraseña"
          placeholder="Confirmar contraseña"
        />

        <button type="submit" className="auth-btn auth-btn--primary auth-btn--register-submit">
          REGISTRARSE
        </button>
      </form>

      <p className="auth-page__signin">
        ¿Ya tenés cuenta? <Link to="/iniciar-sesion">Iniciá sesión</Link>
      </p>
    </AuthLayout>
  )
}
