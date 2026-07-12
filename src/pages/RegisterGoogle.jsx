import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { completeGoogleRegistration, getHomePathForRole } from '../api/auth'
import { AuthLayout } from '../components/AuthLayout'
import { useToast } from '../context/ToastContext'
import { clearGoogleRegistrationDraft, getGoogleRegistrationDraft } from '../lib/auth'
import { onlyDigits, validateRequiredFields } from '../lib/inputUtils'
import './AuthPages.css'

export function RegisterGoogle() {
  const navigate = useNavigate()
  const toast = useToast()
  const [googleRegistration] = useState(() => getGoogleRegistrationDraft())
  const [street, setStreet] = useState('')
  const [streetNumber, setStreetNumber] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [document, setDocument] = useState('')
  const [loading, setLoading] = useState(false)

  const address = {
    calle: street,
    numero: streetNumber,
    ciudad: city,
    codigoPostal: postalCode,
  }

  useEffect(() => {
    if (googleRegistration?.tokenRegistro) return

    toast.error('No encontramos un registro con Google en curso. Iniciá el flujo nuevamente.')
    navigate('/registrarse', { replace: true })
  }, [googleRegistration, navigate, toast])

  const resetGoogleRegistration = () => {
    clearGoogleRegistrationDraft()
    navigate('/registrarse', { replace: true })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validateRequiredFields(event.currentTarget, toast)) return

    if (!googleRegistration?.tokenRegistro) {
      toast.error('No encontramos el token temporal de registro. Iniciá el flujo con Google nuevamente.')
      return
    }

    setLoading(true)

    try {
      const { user } = await completeGoogleRegistration({
        tokenRegistro: googleRegistration.tokenRegistro,
        document,
        address,
        acceptTerms: true,
      })

      clearGoogleRegistrationDraft()
      navigate(getHomePathForRole(user.role), { replace: true })
    } catch (err) {
      toast.error(err.message ?? 'No fue posible completar el registro con Google.')
    } finally {
      setLoading(false)
    }
  }

  if (!googleRegistration?.tokenRegistro) return null

  return (
    <AuthLayout>
      <h1 className="auth-page__title auth-page__title--register">Completá tu registro con Google</h1>

      <h2 className="auth-page__section-title auth-page__section-title--register">
        Confirmá los datos faltantes para terminar tu alta
      </h2>

      <form className="auth-form auth-form--google-extra" onSubmit={handleSubmit} noValidate>
        <label className="auth-field" htmlFor="google-register-email">
          <span className="auth-field__label">Correo electrónico</span>
          <span className="auth-field__control">
            <input
              id="google-register-email"
              type="email"
              value={googleRegistration.email ?? ''}
              disabled
            />
          </span>
        </label>

        <div className="auth-form__row">
          <label className="auth-field" htmlFor="google-register-first-name">
            <span className="auth-field__label">Nombre</span>
            <span className="auth-field__control">
              <input
                id="google-register-first-name"
                type="text"
                value={googleRegistration.nombre ?? ''}
                disabled
              />
            </span>
          </label>

          <label className="auth-field" htmlFor="google-register-last-name">
            <span className="auth-field__label">Apellido</span>
            <span className="auth-field__control">
              <input
                id="google-register-last-name"
                type="text"
                value={googleRegistration.apellido ?? ''}
                disabled
              />
            </span>
          </label>
        </div>

        <div className="auth-form__row">
          <label className="auth-field" htmlFor="google-register-street">
            <span className="auth-field__label">Calle</span>
            <span className="auth-field__control">
              <input
                id="google-register-street"
                type="text"
                placeholder="Calle"
                autoComplete="address-line1"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                required
              />
            </span>
          </label>

          <label className="auth-field" htmlFor="google-register-street-number">
            <span className="auth-field__label">Número</span>
            <span className="auth-field__control">
              <input
                id="google-register-street-number"
                type="text"
                placeholder="Número"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="address-line2"
                value={streetNumber}
                onChange={(e) => setStreetNumber(onlyDigits(e.target.value))}
                required
              />
            </span>
          </label>
        </div>

        <label className="auth-field" htmlFor="google-register-city">
          <span className="auth-field__label">Ciudad</span>
          <span className="auth-field__control">
            <input
              id="google-register-city"
              type="text"
              placeholder="Ciudad"
              autoComplete="address-level2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </span>
        </label>

        <label className="auth-field" htmlFor="google-register-postal-code">
          <span className="auth-field__label">Código postal</span>
          <span className="auth-field__control">
            <input
              id="google-register-postal-code"
              type="text"
              placeholder="Código postal"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="postal-code"
              value={postalCode}
              onChange={(e) => setPostalCode(onlyDigits(e.target.value))}
              required
            />
          </span>
        </label>

        <label className="auth-field" htmlFor="google-register-document">
          <span className="auth-field__label">Documento</span>
          <span className="auth-field__control">
            <input
              id="google-register-document"
              type="text"
              placeholder="Documento"
              inputMode="numeric"
              maxLength={8}
              value={document}
              onChange={(e) => setDocument(e.target.value.replace(/\D/g, '').slice(0, 8))}
              required
            />
          </span>
        </label>

        <div className="auth-field">
          <span className="auth-field__label">Foto de perfil opcional</span>
          <span className="auth-field__control">
            <div className="auth-google-photo">
              {googleRegistration.foto ? (
                <img
                  className="auth-google-photo__preview"
                  src={googleRegistration.foto}
                  alt="Foto de perfil para el registro con Google"
                />
              ) : (
                <div className="auth-google-photo__placeholder" aria-hidden="true">
                  Foto
                </div>
              )}
              <div className="auth-google-photo__content">
                <p className="auth-google-photo__title">Usaremos tu foto de Google como foto de perfil.</p>
                <p className="auth-google-photo__hint">Podés reemplazarla en tu perfil.</p>
              </div>
            </div>
          </span>
        </div>

        <button
          type="submit"
          className="auth-btn auth-btn--primary auth-btn--register-submit"
          disabled={loading}
        >
          {loading ? 'COMPLETANDO...' : 'COMPLETAR REGISTRO CON GOOGLE'}
        </button>

        <button type="button" className="auth-btn auth-btn--outline" onClick={resetGoogleRegistration} disabled={loading}>
          CANCELAR FLUJO GOOGLE
        </button>
      </form>
    </AuthLayout>
  )
}
