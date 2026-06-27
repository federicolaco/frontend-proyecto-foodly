import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../api/client'
import { AuthLayout } from '../components/AuthLayout'
import './AuthPages.css'

export function ActivarCuenta() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') ?? ''

  const [estado, setEstado] = useState('pendiente') 
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  useEffect(() => {
    if (!email) {
      setEstado('error')
      setMensaje('El enlace de activación no es válido.')
    }
  }, [email])

  const handleActivar = async () => {
    setLoading(true)
    setMensaje(null)
    try {
      await apiFetch(`/usuarios/activar?email=${encodeURIComponent(email)}`, { method: 'POST' })
      setEstado('activado')
    } catch (err) {
      setEstado('error')
      setMensaje(err.message ?? 'No se pudo activar la cuenta.')
    } finally {
      setLoading(false)
    }
  }
return (
    <AuthLayout>
      <h1 className="auth-pagetitle">Activar cuenta</h1>

      {estado === 'pendiente' && (
        <>
          <p className="auth-pagesection-title">
            Hacé clic en el botón para activar tu cuenta asociada a <strong>{email}</strong>.
          </p>
          {mensaje && <p className="auth-pageerror" role="alert">{mensaje}</p>}
          <button
            className="auth-btn auth-btn--primary"
            onClick={handleActivar}
            disabled={loading || !email}
          >
            {loading ? 'ACTIVANDO...' : 'ACTIVAR CUENTA'}
          </button>
        </>
      )}

      {estado === 'activado' && (
        <>
          <p className="auth-pagesection-title">
            ¡Tu cuenta fue activada correctamente! Ya podés iniciar sesión.
          </p>
          <Link to="/iniciar-sesion" className="auth-btn auth-btn--primary" style={{ textAlign: 'center' }}>
            IR AL INICIO DE SESIÓN
          </Link>
        </>
      )}

      {estado === 'error' && (
        <>
          <p className="auth-page__error" role="alert">
            {mensaje ?? 'Ocurrió un error al activar la cuenta.'}
          </p>
          <Link to="/iniciar-sesion" className="auth-link">Volver al inicio de sesión</Link>
        </>
      )}
    </AuthLayout>
  )
}