import { useEffect, useState } from 'react'

import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { getHomePathForRole, login, loginWithGoogle, validateSession } from '../api/auth'
import { useGoogleLogin } from '@react-oauth/google'
import { isMockMode } from '../api/client'
import { DEMO_ACCOUNTS } from '../lib/roles'

import { AuthLayout } from '../components/AuthLayout'

import { PasswordField } from '../components/PasswordField'
import { useToast } from '../context/ToastContext'
import { validateRequiredFields } from '../lib/inputUtils'

import './AuthPages.css'

function GoogleIcon() {
  return (
    <svg className="auth-btn__google-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

export function Login() {

  const location = useLocation()

  const navigate = useNavigate()

  const redirectTo = location.state?.from ?? null
  const successMessage = location.state?.message ?? null
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(null)

  const [email, setEmail] = useState('')

  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true)
      try {
        const { user } = await loginWithGoogle(tokenResponse.access_token)
        navigate(redirectTo ?? getHomePathForRole(user.role), { replace: true })
      } catch (err) {
        toast.error(err.message ?? 'No fue posible iniciar sesión con Google.')
      } finally {
        setLoading(false)
      }
    },
    onError: () => toast.error('No se pudo autenticar con Google.')
  })

  useEffect(() => {
    if (successMessage) toast.success(successMessage)
  
  }, [])

  useEffect(() => {

    let cancelled = false



    validateSession()

      .then((isValid) => {

        if (!cancelled) setAlreadyLoggedIn(isValid)

      })

      .catch(() => {

        if (!cancelled) setAlreadyLoggedIn(false)

      })



    return () => {

      cancelled = true

    }

  }, [])



  const handleSubmit = async (event) => {

    event.preventDefault()

    if (!validateRequiredFields(event.currentTarget, toast)) return

    setLoading(true)



    try {

      const { user } = await login(email, password)

      navigate(redirectTo ?? getHomePathForRole(user.role, user), { replace: true })

    } catch (err) {

      toast.error(err.message ?? 'No pudimos iniciar sesión.')

    } finally {

      setLoading(false)

    }

  }



  if (alreadyLoggedIn) {

    return <Navigate to={redirectTo ?? '/pedidos'} replace />

  }



  if (alreadyLoggedIn === null) {

    return null

  }


  return (

    <AuthLayout>

      <h1 className="auth-page__title auth-page__title--login">Bienvenido a Foodly</h1>

      <h2 className="auth-page__section-title auth-page__section-title--login">

        Inicia sesión y pedí en segundos

      </h2>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>

        <label className="auth-field" htmlFor="login-email">

          <span className="auth-field__label">Correo electrónico</span>

          <span className="auth-field__control">

            <input

              id="login-email"

              type="email"

              placeholder="Correo electrónico"

              autoComplete="email"

              value={email}

              onChange={(e) => setEmail(e.target.value)}

              required

            />

          </span>

        </label>



        <PasswordField

          id="login-password"

          label="Contraseña"

          placeholder="Contraseña"

          value={password}

          onChange={(e) => setPassword(e.target.value)}

          required

        />



        <div className="auth-links-row">
          <Link to="/recuperar-contrasena" className="auth-link">
            ¿Olvidaste tu contraseña?
          </Link>

          <Link to="/reenviar-activacion" className="auth-link">
            ¿No activaste tu cuenta? Reenviar correo de activación
          </Link>
        </div>



        <button type="submit" className="auth-btn auth-btn--primary" disabled={loading}>

          {loading ? 'INGRESANDO...' : 'INGRESAR'}

        </button>

      </form>



      {isMockMode() && (
        <details className="auth-demo-accounts">
          <summary>Cuentas de prueba (mock)</summary>
          <ul>
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.email}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(account.email)
                    setPassword(account.password)
                  }}
                >
                  {account.role}: {account.email}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}


      <button
        type="button"
        className="auth-btn auth-btn--outline auth-btn--google"
        onClick={() => handleGoogleLogin()}
        disabled={loading}
      >
        <GoogleIcon />
        CONTINUAR CON GOOGLE
      </button>
      
      <div className="auth-divider auth-divider--login-accent" aria-hidden="true">

        <span className="auth-divider__line" />

      </div>



      <div className="auth-page__footer">

        <p className="auth-page__footer-text">¿No estás registrado?</p>

        <Link to="/registrarse" className="auth-btn auth-btn--outline">

          REGISTRARSE

        </Link>

      </div>

    </AuthLayout>

  )

}


