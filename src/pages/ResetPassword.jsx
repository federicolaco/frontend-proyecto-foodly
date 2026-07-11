import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../api/account'
import { AuthLayout } from '../components/AuthLayout'
import { PasswordField } from '../components/PasswordField'
import { useToast } from '../context/ToastContext'
import './AuthPages.css'

export function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!password.trim() || !confirmPassword.trim()) {
      toast.error('Completá todos los campos obligatorios.')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Las contraseñas ingresadas no coinciden.')
      return
    }
    if (!token) {
      toast.error('El enlace de recuperación no es válido.')
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, password, confirmPassword)
      navigate('/iniciar-sesion', { replace: true, state: { message: 'Contraseña restablecida. Inicie sesión.' } })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="auth-page__title">Nueva contraseña</h1>
      <p className="auth-page__section-title">Ingresá y confirmá tu nueva contraseña.</p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
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
