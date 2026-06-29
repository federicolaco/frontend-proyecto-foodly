import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isJwtExpired } from '../api/backend/helpers'
import { getSessionToken, clearSessionToken } from '../lib/auth'

export function SessionWatcher() {
  const navigate = useNavigate()

  useEffect(() => {
    const interval = setInterval(() => {
      const token = getSessionToken()
      if (token && isJwtExpired(token)) {
        clearSessionToken()
        navigate('/iniciar-sesion', {
          replace: true,
          state: { message: 'Tu sesión expiró. Por favor iniciá sesión nuevamente.' },
        })
      }
    }, 30 * 1000)

    return () => clearInterval(interval)
  }, [navigate])

  return null
}