import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../api/account'
import { AuthLayout } from '../components/AuthLayout'
import { PasswordField } from '../components/PasswordField'
import './AuthPages.css'

export function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (password !== confirmPassword) {
      setError('Las contraseñas ingresadas no coinciden.')
      return
    }
    if (!token) {
      setError('El enlace de recuperación no es válido.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await resetPassword(token, password)
      navigate('/iniciar-sesion', { replace: true, state: { message: 'Contraseña restablecida. Inicie sesión.' } })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="auth-page__title">Nueva contraseña</h1>
      <p className="auth-page__section-title">Ingresá y confirmá tu nueva contraseña.</p>

      {error && <p className="auth-page__error" role="alert">{error}</p>}

      <form className="auth-form" onSubmit={handleSubmit}>
        <PasswordField id="new-pass" label="Nueva contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
        <PasswordField id="confirm-pass" label="Confirmar contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        <button type="submit" className="auth-btn auth-btn--primary" disabled={loading || !token}>
          {loading ? 'GUARDANDO...' : 'RESTABLECER'}
        </button>
      </form>

      <div className="auth-page__footer" style={{ marginTop: '1.5rem' }}>
        <Link to="/iniciar-sesion" className="auth-link">Volver al inicio de sesión</Link>
      </div>
    </AuthLayout>
  )
}
