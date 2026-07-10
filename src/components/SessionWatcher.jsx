import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SESSION_EXPIRED_EVENT } from '../api/client'
import { isJwtExpired } from '../api/backend/helpers'
import { getSessionToken, clearSessionToken } from '../lib/auth'

const SESSION_EXPIRED_MESSAGE = 'Tu sesión expiró. Por favor iniciá sesión nuevamente.'

export function SessionWatcher() {
  const navigate = useNavigate()

  useEffect(() => {
    function goToLogin() {
      clearSessionToken()
      navigate('/iniciar-sesion', {
        replace: true,
        state: { message: SESSION_EXPIRED_MESSAGE },
      })
    }

    // Chequeo local (rápido, cada 30s): cubre el caso en que el propio JWT
    // ya venció según su campo exp.
    const interval = setInterval(() => {
      const token = getSessionToken()
      if (token && isJwtExpired(token)) {
        goToLogin()
      }
    }, 30 * 1000)

    // Chequeo real (inmediato): el backend puede invalidar una sesión antes
    // de que el JWT expire (ej. sesionesInvalidadasDesde). apiFetch dispara
    // este evento apenas cualquier request devuelve 401/403, así que la
    // sesión muerta se detecta en el momento en vez de esperar al próximo
    // ciclo de 30s o a que el usuario deslogueé manualmente.
    window.addEventListener(SESSION_EXPIRED_EVENT, goToLogin)

    return () => {
      clearInterval(interval)
      window.removeEventListener(SESSION_EXPIRED_EVENT, goToLogin)
    }
  }, [navigate])

  return null
}