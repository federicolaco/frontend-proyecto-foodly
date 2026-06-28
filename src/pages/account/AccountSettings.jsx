import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  confirmPasswordChange,
  deleteAccount,
  getMyClientRating,
  startPasswordChange,
  updateProfile,
  verifyPasswordChangeCode,
} from '../../api/account'
import { addressFromFields, splitAddressFields } from '../../api/backend/helpers'
import { isMockMode } from '../../api/client'
import { OrdersNavbar } from '../../components/OrdersNavbar'
import { StarRating } from '../../components/StarRating'
import { getStoredUser } from '../../lib/auth'
import { ROLES } from '../../lib/roles'
import '../Account.css'
import '../Panel.css'

const TABS = [
  { id: 'profile', label: 'Mi perfil' },
  { id: 'password', label: 'Cambiar contraseña' },
  { id: 'rating', label: 'Mi calificación', roles: [ROLES.CLIENT] },
  { id: 'danger', label: 'Eliminar cuenta', roles: [ROLES.CLIENT] },
]

export function AccountSettings() {
  const navigate = useNavigate()
  const user = getStoredUser()
  const [tab, setTab] = useState('profile')
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  const initialAddress = splitAddressFields(user)
  const [firstName, setFirstName] = useState(user.firstName ?? user.name?.split(' ')[0] ?? '')
  const [lastName, setLastName] = useState(user.lastName ?? user.name?.split(' ').slice(1).join(' ') ?? '')
  const [localName, setLocalName] = useState(user.name ?? '')
  const [description, setDescription] = useState(user.description ?? '')
  const [street, setStreet] = useState(initialAddress.street)
  const [streetNumber, setStreetNumber] = useState(initialAddress.streetNumber)
  const [city, setCity] = useState(initialAddress.city)
  const [postalCode, setPostalCode] = useState(initialAddress.postalCode)

  const [currentPassword, setCurrentPassword] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passStep, setPassStep] = useState(1)

  const [rating, setRating] = useState(null)

  const visibleTabs = TABS.filter((t) => !t.roles || t.roles.includes(user.role))

  useEffect(() => {
    if (tab !== 'rating' || user.role !== ROLES.CLIENT) return
    getMyClientRating().then(setRating).catch(() => setRating({ average: 0, total: 0, breakdown: {} }))
  }, [tab, user.role])

  const handleProfileSave = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      await updateProfile({
        firstName,
        lastName,
        name: localName,
        description,
        address: addressFromFields({ street, streetNumber, city, postalCode }),
      })
      setMessage('Datos actualizados correctamente.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePassStep1 = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await startPasswordChange(currentPassword)
      setMessage(res.message)
      setPassStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePassStep2 = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await verifyPasswordChangeCode(code)
      setMessage('Código verificado. Ingrese su nueva contraseña.')
      setPassStep(3)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePassStep3 = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await confirmPasswordChange(newPassword, confirmPassword)
      setMessage(res.message)
      setPassStep(1)
      setCurrentPassword('')
      setCode('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('¿Confirma la eliminación de su cuenta? Esta acción no se puede deshacer.')) return
    setLoading(true)
    setError(null)
    try {
      await deleteAccount()
      navigate('/iniciar-sesion', { replace: true })
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="panel-page">
      <OrdersNavbar />
      <main className="panel-page__main contenedor">
        <h1 className="panel-page__title">Configuración de cuenta</h1>

        {error && <p className="panel-page__error" role="alert">{error}</p>}
        {message && <p className="panel-page__success">{message}</p>}

        <nav className="account-tabs">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`account-tabs__btn${tab === t.id ? ' account-tabs__btn--active' : ''}`}
              onClick={() => { setTab(t.id); setError(null); setMessage(null) }}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <section className="panel-card">
          {tab === 'profile' && (
            <form className="panel-form" onSubmit={handleProfileSave}>
              {user.role === ROLES.CLIENT && (
                <>
                  <label className="panel-field">
                    <span className="panel-field__label">Nombre</span>
                    <input className="panel-field__input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  </label>
                  <label className="panel-field">
                    <span className="panel-field__label">Apellido</span>
                    <input className="panel-field__input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                  </label>
                  <label className="panel-field">
                    <span className="panel-field__label">Calle</span>
                    <input className="panel-field__input" value={street} onChange={(e) => setStreet(e.target.value)} required />
                  </label>
                  <label className="panel-field">
                    <span className="panel-field__label">Número</span>
                    <input className="panel-field__input" value={streetNumber} onChange={(e) => setStreetNumber(e.target.value)} required />
                  </label>
                  <label className="panel-field">
                    <span className="panel-field__label">Ciudad</span>
                    <input className="panel-field__input" value={city} onChange={(e) => setCity(e.target.value)} required />
                  </label>
                  <label className="panel-field">
                    <span className="panel-field__label">Código postal</span>
                    <input
                      className="panel-field__input"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      required
                    />
                  </label>
                </>
              )}
              {user.role === ROLES.LOCAL && (
                <>
                  <label className="panel-field">
                    <span className="panel-field__label">Nombre del local</span>
                    <input className="panel-field__input" value={localName} onChange={(e) => setLocalName(e.target.value)} required />
                  </label>
                  <label className="panel-field">
                    <span className="panel-field__label">Descripción</span>
                    <textarea className="panel-field__textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                  </label>
                  <label className="panel-field">
                    <span className="panel-field__label">Calle</span>
                    <input className="panel-field__input" value={street} onChange={(e) => setStreet(e.target.value)} required />
                  </label>
                  <label className="panel-field">
                    <span className="panel-field__label">Número</span>
                    <input className="panel-field__input" value={streetNumber} onChange={(e) => setStreetNumber(e.target.value)} required />
                  </label>
                  <label className="panel-field">
                    <span className="panel-field__label">Ciudad</span>
                    <input className="panel-field__input" value={city} onChange={(e) => setCity(e.target.value)} required />
                  </label>
                  <label className="panel-field">
                    <span className="panel-field__label">Código postal</span>
                    <input
                      className="panel-field__input"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      required
                    />
                  </label>
                </>
              )}
              <button type="submit" className="panel-btn panel-btn--primary" disabled={loading}>
                Guardar cambios
              </button>
            </form>
          )}

          {tab === 'password' && (
            <>
              {passStep === 1 && (
                <form className="panel-form" onSubmit={handlePassStep1}>
                  <label className="panel-field">
                    <span className="panel-field__label">Contraseña actual</span>
                    <input type="password" className="panel-field__input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                  </label>
                  {isMockMode() && <p className="panel-page__subtitle">Mock: el código será <strong>123456</strong></p>}
                  <button type="submit" className="panel-btn panel-btn--primary" disabled={loading}>Solicitar código</button>
                </form>
              )}
              {passStep === 2 && (
                <form className="panel-form" onSubmit={handlePassStep2}>
                  <label className="panel-field">
                    <span className="panel-field__label">Código de verificación (6 dígitos)</span>
                    <input className="panel-field__input" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} required />
                  </label>
                  <button type="submit" className="panel-btn panel-btn--primary" disabled={loading}>Verificar código</button>
                </form>
              )}
              {passStep === 3 && (
                <form className="panel-form" onSubmit={handlePassStep3}>
                  <label className="panel-field">
                    <span className="panel-field__label">Nueva contraseña</span>
                    <input type="password" className="panel-field__input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                  </label>
                  <label className="panel-field">
                    <span className="panel-field__label">Confirmar contraseña</span>
                    <input type="password" className="panel-field__input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                  </label>
                  <button type="submit" className="panel-btn panel-btn--primary" disabled={loading}>Actualizar contraseña</button>
                </form>
              )}
            </>
          )}

          {tab === 'rating' && rating && (
            <div>
              {rating.total === 0 ? (
                <p className="panel-empty">Aún no ha recibido calificaciones de ningún local.</p>
              ) : (
                <>
                  <p><strong>Promedio:</strong> {rating.average} / 5 ({rating.total} valoraciones)</p>
                  <div className="rating-summary">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <div key={star} className="rating-summary__row">
                        <span>{star}★</span>
                        <div className="rating-summary__bar">
                          <div className="rating-summary__fill" style={{ width: `${rating.total ? (rating.breakdown[star] / rating.total) * 100 : 0}%` }} />
                        </div>
                        <span>{rating.breakdown[star] ?? 0}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'danger' && (
            <div>
              <p className="panel-page__subtitle">Al eliminar su cuenta perderá el acceso y su historial quedará anonimizado.</p>
              <button type="button" className="panel-btn panel-btn--danger" disabled={loading} onClick={handleDelete}>
                Eliminar cuenta
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

