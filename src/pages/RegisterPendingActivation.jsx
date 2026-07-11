import { Link, useLocation } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import './AuthPages.css'

export function RegisterPendingActivation() {
  const location = useLocation()
  const email = location.state?.email ?? ''

  return (
    <AuthLayout>
      <h1 className="auth-page__title auth-page__title--register">Cuenta creada</h1>

      <p className="auth-page__section-title auth-page__section-title--register">
        Tu registro fue exitoso y tu cuenta quedó pendiente de activación por correo.
      </p>

      <div className="auth-status-card" role="status" aria-live="polite">
        <p className="auth-status-card__message">
          Te enviamos un correo de activación
          {email ? <strong> a {email}</strong> : null}. Revisá tu bandeja de entrada y, si no lo encontrás,
          verificá spam o correo no deseado.
        </p>
        <p className="auth-status-card__hint">
          Cuando actives la cuenta desde el enlace recibido, recién ahí vas a poder iniciar sesión.
        </p>
      </div>

      <div className="auth-page__actions">
        <Link to="/" className="auth-btn auth-btn--primary">
          VOLVER AL INICIO
        </Link>
        <Link
          to="/iniciar-sesion"
          className="auth-btn auth-btn--outline"
          state={{ message: 'Cuando actives tu cuenta por correo, ya podés iniciar sesión.' }}
        >
          YA ACTIVÉ MI CUENTA
        </Link>
      </div>
    </AuthLayout>
  )
}
