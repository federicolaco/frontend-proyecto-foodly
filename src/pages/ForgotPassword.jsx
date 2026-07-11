import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordRecovery } from '../api/account'
import { isMockMode } from '../api/client'
import { AuthLayout } from '../components/AuthLayout'
import { useToast } from '../context/ToastContext'
import { validateRequiredFields } from '../lib/inputUtils'
import './AuthPages.css'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [mockToken, setMockToken] = useState(null)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validateRequiredFields(event.currentTarget, toast)) return

    setLoading(true)
    setMockToken(null)

    try {
      const res = await requestPasswordRecovery(email)
      toast.success(res.message)
      if (res.mockToken) setMockToken(res.mockToken)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="auth-page__title">Recuperar contraseña</h1>
      <p className="auth-page__section-title">Ingresá tu correo y te enviaremos un enlace de recuperación.</p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label className="auth-field" htmlFor="recovery-email">
          <span className="auth-field__label">Correo electrónico</span>
          <span className="auth-field__control">
            <input id="recovery-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </span>
        </label>
        <button type="submit" className="auth-btn auth-btn--primary" disabled={loading}>
          {loading ? 'ENVIANDO...' : 'ENVIAR ENLACE'}
        </button>
      </form>

      {isMockMode() && mockToken && (
        <p className="auth-page__footer-text" style={{ marginTop: '1rem' }}>
          Mock: <Link to={`/restablecer-contrasena?token=${mockToken}`}>Restablecer contraseña</Link>
        </p>
      )}

      <div className="auth-page__footer" style={{ marginTop: '1.5rem' }}>
        <Link to="/iniciar-sesion" className="auth-link">Volver al inicio de sesión</Link>
      </div>
    </AuthLayout>
  )
}
