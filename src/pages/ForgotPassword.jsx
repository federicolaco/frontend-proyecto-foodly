import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordRecovery } from '../api/account'
import { isMockMode } from '../api/client'
import { AuthLayout } from '../components/AuthLayout'
import './AuthPages.css'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState(null)
  const [mockToken, setMockToken] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    setMockToken(null)

    try {
      const res = await requestPasswordRecovery(email)
      setMessage(res.message)
      if (res.mockToken) setMockToken(res.mockToken)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="auth-page__title">Recuperar contraseña</h1>
      <p className="auth-page__section-title">Ingresá tu correo y te enviaremos un enlace de recuperación.</p>

      {error && <p className="auth-page__error" role="alert">{error}</p>}
      {message && <p className="panel-page__success" style={{ marginBottom: '1rem' }}>{message}</p>}

      <form className="auth-form" onSubmit={handleSubmit}>
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
