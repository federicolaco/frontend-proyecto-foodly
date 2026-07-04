import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getHomePathForRole, register, registerWithGoogle } from '../api/auth'
import { AuthLayout } from '../components/AuthLayout'
import { PasswordField } from '../components/PasswordField'
import { useGoogleLogin } from '@react-oauth/google'
import './AuthPages.css'

const PASSWORD_HINT = {
  intro: 'La contraseña debe tener:',
  items: [
    'Un largo mínimo de 8 caracteres',
    'Al menos 1 letra mayúscula',
    'Al menos 1 número',
    'Al menos 1 carácter especial (ej. _ @ !)',
  ],
}

function GoogleIcon() {
  return (
    <svg className="auth-btn__google-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export function Register() {
  const navigate = useNavigate()
  const [accountType, setAccountType] = useState('cliente')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [street, setStreet] = useState('')
  const [streetNumber, setStreetNumber] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [document, setDocument] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError(null)
      setLoading(true)
      try {
        const { user } = await registerWithGoogle({
          idToken: tokenResponse.access_token,
          address,
          document,
          esRegistro: true,
        })
        navigate(getHomePathForRole(user.role), { replace: true })
      } catch (err) {
        setError(err.message ?? 'No fue posible completar la autenticación con Google.')
      } finally {
        setLoading(false)
      }
    },
    onError: () => setError('No se pudo autenticar con Google.')
  })

  const address = {
    calle: street,
    numero: streetNumber,
    ciudad: city,
    codigoPostal: postalCode,
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Las contraseñas ingresadas no coinciden. Por favor, verifique e inténtelo de nuevo.')
      return
    }

    setLoading(true)

    try {
      await register({
        firstName, lastName, address, document, email, password, role: accountType,
      })
      navigate('/iniciar-sesion', {
        replace: true,
        state: { message: '¡Registro exitoso! Revisá tu correo para activar tu cuenta.' },
      })
    } catch (err) {
      setError(err.message ?? 'No pudimos crear la cuenta.')
    } finally {
      setLoading(false)
    }
  }


  return (
    <AuthLayout>
      <h1 className="auth-page__title auth-page__title--register">Registrate en Foodly</h1>

      {error && (
        <p className="auth-page__error" role="alert">
          {error}
        </p>
      )}

      <div className="auth-account-type">
        <button
          type="button"
          className={`auth-account-type__btn${accountType === 'cliente' ? ' auth-account-type__btn--active' : ''}`}
          onClick={() => setAccountType('cliente')}
        >
          Cliente
        </button>
        <button
          type="button"
          className="auth-account-type__btn"
          onClick={() => navigate('/registrar-local')}
        >
          Local comercial
        </button>
      </div>

      <button
        type="button"
        className="auth-btn auth-btn--outline auth-btn--google"
        onClick={() => handleGoogleLogin()}
        disabled={loading}
      >
        <GoogleIcon />
        CONTINUAR CON GOOGLE
      </button>



      <div className="auth-divider" aria-hidden="true">
        <span className="auth-divider__line" />
        <span className="auth-divider__label">o</span>
        <span className="auth-divider__line" />
      </div>

      <h2 className="auth-page__section-title auth-page__section-title--register">
        Ingresa tus datos para registrarte
      </h2>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form__row">
          <label className="auth-field" htmlFor="register-first-name">
            <span className="auth-field__label">Nombre</span>
            <span className="auth-field__control">
              <input
                id="register-first-name"
                type="text"
                placeholder="Nombre"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </span>
          </label>

          <label className="auth-field" htmlFor="register-last-name">
            <span className="auth-field__label">Apellido</span>
            <span className="auth-field__control">
              <input
                id="register-last-name"
                type="text"
                placeholder="Apellido"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </span>
          </label>
        </div>

        <div className="auth-form__row">
          <label className="auth-field" htmlFor="register-street">
            <span className="auth-field__label">Calle</span>
            <span className="auth-field__control">
              <input
                id="register-street"
                type="text"
                placeholder="Calle"
                autoComplete="address-line1"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                required
              />
            </span>
          </label>

          <label className="auth-field" htmlFor="register-street-number">
            <span className="auth-field__label">Número</span>
            <span className="auth-field__control">
              <input
                id="register-street-number"
                type="text"
                placeholder="Número"
                inputMode="numeric"
                autoComplete="address-line2"
                value={streetNumber}
                onChange={(e) => setStreetNumber(e.target.value)}
                required
              />
            </span>
          </label>
        </div>

        <label className="auth-field" htmlFor="register-city">
          <span className="auth-field__label">Ciudad</span>
          <span className="auth-field__control">
            <input
              id="register-city"
              type="text"
              placeholder="Ciudad"
              autoComplete="address-level2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </span>
        </label>

        <label className="auth-field" htmlFor="register-postal-code">
          <span className="auth-field__label">Código postal</span>
          <span className="auth-field__control">
            <input
              id="register-postal-code"
              type="text"
              placeholder="Código postal"
              autoComplete="postal-code"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              required
            />
          </span>
        </label>

        <label className="auth-field" htmlFor="register-document">
          <span className="auth-field__label">Documento</span>
          <span className="auth-field__control">
            <input
              id="register-document"
              type="text"
              placeholder="Documento"
              inputMode="numeric"
              maxLength={8}
              value={document}
              onChange={(e) =>
                setDocument(e.target.value.replace(/\D/g, '').slice(0, 8))
              }
              required
            />
          </span>
        </label>

        <label className="auth-field" htmlFor="register-email">
          <span className="auth-field__label">Correo electrónico</span>
          <span className="auth-field__control">
            <input
              id="register-email"
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
          id="register-password"
          label="Contraseña"
          placeholder="Contraseña"
          hint={PASSWORD_HINT}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <PasswordField
          id="register-confirm-password"
          label="Confirmar contraseña"
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button type="submit" className="auth-btn auth-btn--primary auth-btn--register-submit" disabled={loading}>
          {loading ? 'REGISTRANDO...' : 'REGISTRARSE'}
        </button>
      </form>

      <p className="auth-page__signin">
        ¿Ya tenés cuenta? <Link to="/iniciar-sesion">Iniciá sesión</Link>
      </p>
    </AuthLayout>
  )
}
