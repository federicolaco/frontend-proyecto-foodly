import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { confirmEmailChange } from '../api/account'
import { AuthLayout } from '../components/AuthLayout'
import { clearSessionToken } from '../lib/auth'
import './AuthPages.css'

export function ConfirmEmailChange() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [status, setStatus] = useState('loading') 
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('El enlace de confirmación no es válido.')
      return
    }

    confirmEmailChange(token)
      .then((res) => {
        setStatus('success')
        setMessage(res.message)
        clearSessionToken()
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.message)
      })
  }, [token])

  return (
    <AuthLayout>
      <h1 className="auth-page__title">Confirmar cambio de correo</h1>

      {status === 'loading' && <p className="auth-page__section-title">Confirmando el cambio de correo...</p>}

      {status === 'success' && (
        <p className="auth-page__section-title">{message}</p>
      )}

      {status === 'error' && (
        <p className="auth-page__error" role="alert">{message}</p>
      )}

      <div className="auth-page__footer" style={{ marginTop: '1.5rem' }}>
        <Link to="/iniciar-sesion" className="auth-link">Ir a iniciar sesión</Link>
      </div>
    </AuthLayout>
  )
}
