import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { validateSession } from '../api/auth'
import { getStoredUser } from '../lib/auth'
import { getHomePathForRole } from '../lib/roles'
import './ProtectedRoute.css'

export function ProtectedRoute({ children, roles = null }) {
  const location = useLocation()
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    let cancelled = false

    async function checkSession() {
      try {
        const isValid = await validateSession()
        if (!cancelled) setStatus(isValid ? 'valid' : 'invalid')
      } catch {
        if (!cancelled) setStatus('invalid')
      }
    }

    checkSession()

    return () => {
      cancelled = true
    }
  }, [])

  if (status === 'checking') {
    return (
      <div className="protected-route" role="status" aria-live="polite">
        <span className="protected-route__spinner" aria-hidden="true" />
        Verificando sesión...
      </div>
    )
  }

  if (status === 'invalid') {
    return <Navigate to="/iniciar-sesion" state={{ from: location.pathname }} replace />
  }

  const user = getStoredUser()

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={getHomePathForRole(user.role, user)} replace />
  }

  if (user.role === 'local' && user.localEnabled === false && !location.pathname.startsWith('/registrar-local')) {
    return <Navigate to="/registrar-local" replace />
  }

  return children
}
