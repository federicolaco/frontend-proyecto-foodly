import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { activateAccount } from '../api/account'
import { AuthLayout } from '../components/AuthLayout'
import { useToast } from '../context/ToastContext'
import './AuthPages.css'

export function ActivarCuenta() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const helperMessage = location.state?.message ?? null

  const [estado, setEstado] = useState(token ? 'pendiente' : 'error')
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState(token ? null : 'El enlace de activacion no es valido.')
  const toast = useToast()

  const handleActivar = async () => {
    setLoading(true)
    try {
      await activateAccount(token)
      setEstado('activado')
    } catch (err) {
      toast.error(err.message ?? 'No se pudo activar la cuenta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="auth-pagetitle">Activar cuenta</h1>

      {estado === 'pendiente' && (
        <>
          {helperMessage && (
            <p className="auth-pagesection-title">{helperMessage}</p>
          )}
          <p className="auth-pagesection-title">
            Hace clic en el boton para activar tu cuenta.
          </p>
          <button
            className="auth-btn auth-btn--primary"
            onClick={handleActivar}
            disabled={loading || !token}
          >
            {loading ? 'ACTIVANDO...' : 'ACTIVAR CUENTA'}
          </button>
        </>
      )}

      {estado === 'activado' && (
        <>
          <p className="auth-pagesection-title">
            Tu cuenta fue activada correctamente. Ya podes iniciar sesion.
          </p>
          <Link to="/iniciar-sesion" className="auth-btn auth-btn--primary" style={{ textAlign: 'center' }}>
            IR AL INICIO DE SESION
          </Link>
        </>
      )}

      {estado === 'error' && (
        <>
          <p className="auth-page__error" role="alert">
            {mensaje ?? 'Ocurrio un error al activar la cuenta.'}
          </p>
          <Link to="/iniciar-sesion" className="auth-link">Volver al inicio de sesion</Link>
        </>
      )}
    </AuthLayout>
  )
}
