import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { resendActivationLink } from '../api/account'
import { isMockMode } from '../api/client'
import { AuthLayout } from '../components/AuthLayout'
import { useToast } from '../context/ToastContext'
import { validateRequiredFields } from '../lib/inputUtils'
import './AuthPages.css'

export function ResendActivation() {
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState(location.state?.email ?? '')
  const [mockActivationPath, setMockActivationPath] = useState(null)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validateRequiredFields(event.currentTarget, toast)) return

    setLoading(true)
    setMockActivationPath(null)

    try {
      const res = await resendActivationLink(email)

      if (isMockMode() && res.mockActivationPath) {
        toast.success(res.message)
        setMockActivationPath(res.mockActivationPath)
        return
      }

      navigate('/iniciar-sesion', {
        replace: true,
        state: { message: res.message },
      })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="auth-page__title">Reenviar activación de cuenta</h1>
      <p className="auth-page__section-title">
        Ingresá el correo con el que te registraste y, si tu cuenta está pendiente de activación,
        te reenviamos el enlace.
      </p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label className="auth-field" htmlFor="resend-activation-email">
          <span className="auth-field__label">Correo electrónico</span>
          <span className="auth-field__control">
            <input
              id="resend-activation-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </span>
        </label>
        <button type="submit" className="auth-btn auth-btn--primary" disabled={loading}>
          {loading ? 'ENVIANDO...' : 'REENVIAR ENLACE'}
        </button>
      </form>

      {isMockMode() && mockActivationPath && (
        <p className="auth-page__footer-text" style={{ marginTop: '1rem' }}>
          Mock: <Link to={mockActivationPath}>Activar cuenta</Link>
        </p>
      )}

      <div className="auth-page__footer" style={{ marginTop: '1.5rem' }}>
        <Link to="/iniciar-sesion" className="auth-link">Volver al inicio de sesión</Link>
      </div>
    </AuthLayout>
  )
}
