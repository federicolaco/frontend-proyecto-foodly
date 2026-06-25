import { useEffect, useState } from 'react'

import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { getHomePathForRole, login, validateSession } from '../api/auth'
import { isApiConfigured } from '../api/client'
import { DEMO_ACCOUNTS } from '../lib/roles'

import { AuthLayout } from '../components/AuthLayout'

import { PasswordField } from '../components/PasswordField'

import './AuthPages.css'



export function Login() {

  const location = useLocation()

  const navigate = useNavigate()

  const redirectTo = location.state?.from ?? null

  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(null)

  const [email, setEmail] = useState('')

  const [password, setPassword] = useState('')

  const [error, setError] = useState(null)

  const [loading, setLoading] = useState(false)



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

    setError(null)

    setLoading(true)



    try {

      const { user } = await login(email, password)

      navigate(redirectTo ?? getHomePathForRole(user.role, user), { replace: true })

    } catch (err) {

      setError(err.message ?? 'No pudimos iniciar sesión.')

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



      {error && (

        <p className="auth-page__error" role="alert">

          {error}

        </p>

      )}



      <form className="auth-form" onSubmit={handleSubmit}>

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

        />



        <Link to="#" className="auth-link">

          ¿Olvidaste tu contraseña?

        </Link>



        <button type="submit" className="auth-btn auth-btn--primary" disabled={loading}>

          {loading ? 'INGRESANDO...' : 'INGRESAR'}

        </button>

      </form>



      {!isApiConfigured() && (
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


