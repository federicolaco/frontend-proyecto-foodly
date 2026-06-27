import { useRef, useState } from 'react'

import { useNavigate } from 'react-router-dom'

import { submitLocalRegistration } from '../api/localPanel'
import { addressFromFields } from '../api/backend/helpers'
import { isApiConfigured } from '../api/client'
import { getStoredUser } from '../lib/auth'

import { PasswordField } from '../components/PasswordField'

import './RegisterLocal.css'



function CameraIcon() {

  return (

    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">

      <path

        d="M4 8h3l1.5-2h7L17 8h3a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2v-8a2 2 0 012-2z"

        stroke="currentColor"

        strokeWidth="2"

        strokeLinejoin="round"

      />

      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="2" />

    </svg>

  )

}



export function RegisterLocal() {

  const navigate = useNavigate()

  const user = getStoredUser()

  const logoInputRef = useRef(null)

  const imagesInputRef = useRef(null)

  const [logoPreview, setLogoPreview] = useState(null)

  const [selectedImages, setSelectedImages] = useState([])

  const [name, setName] = useState('')

  const [email, setEmail] = useState(user.email ?? '')

  const [street, setStreet] = useState('')
  const [streetNumber, setStreetNumber] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')

  const [description, setDescription] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)



  const handleLogoChange = (event) => {

    const file = event.target.files?.[0]

    if (!file) return

    setLogoPreview(URL.createObjectURL(file))
    setLogoFile(file)

  }



  const handleImagesChange = (event) => {

    const files = Array.from(event.target.files ?? [])

    setSelectedImages(files)

  }



  const handleSubmit = async (event) => {

    event.preventDefault()

    setError(null)

    setSuccess(null)

    setLoading(true)



    if (!name.trim() || !email.trim() || !street.trim() || !streetNumber.trim() || !city.trim() || !postalCode.trim() || !description.trim()) {
      setError('Los campos nombre, correo, dirección y descripción son requeridos.')
      setLoading(false)
      return
    }

    if (isApiConfigured()) {
      if (!password || password.length < 8) {
        setError('Debe indicar una contraseña de al menos 8 caracteres para la cuenta del local.')
        setLoading(false)
        return
      }

      if (password !== confirmPassword) {
        setError('Las contraseñas ingresadas no coinciden.')
        setLoading(false)
        return
      }
    }

    try {
      const images = [...selectedImages]
      if (logoFile) images.unshift(logoFile)

      await submitLocalRegistration({
        name,
        email,
        address: addressFromFields({ street, streetNumber, city, postalCode }),
        description,
        password: isApiConfigured() ? password : undefined,
        images,
        imageCount: images.length,
      })



      setSuccess(

        'Solicitud enviada con estado «Pendiente». Un administrador la revisará pronto.',

      )

      setTimeout(() => navigate('/iniciar-sesion', { replace: true }), 2500)

    } catch (err) {

      setError(err.message ?? 'No pudimos enviar la solicitud.')

    } finally {

      setLoading(false)

    }

  }



  return (

    <div className="register-local-page">


      <header className="register-local-page__header">
        <span className="register-local-page__logo">Foodly</span>
      </header>


      <main className="register-local-page__main contenedor">

        <h1 className="register-local-page__title">Registro de Local</h1>



        {error && (

          <p className="register-local-page__alert register-local-page__alert--error" role="alert">

            {error}

          </p>

        )}

        {success && (

          <p className="register-local-page__alert register-local-page__alert--success">{success}</p>

        )}



        <form className="register-local-form" onSubmit={handleSubmit}>

          <div className="register-local-form__grid">

            <div className="register-local-form__column">

              <div className="register-local-form__logo-wrap">

                <button

                  type="button"

                  className="register-local-form__logo-btn"

                  onClick={() => logoInputRef.current?.click()}

                  aria-label="Subir logo del local"

                >

                  {logoPreview ? (

                    <img src={logoPreview} alt="" className="register-local-form__logo-image" />

                  ) : (

                    <span className="register-local-form__logo-placeholder" aria-hidden="true">

                      <CameraIcon />

                      <span>Logo</span>

                    </span>

                  )}

                </button>

                <input

                  ref={logoInputRef}

                  type="file"

                  accept="image/jpeg,image/png"

                  className="register-local-form__file-input"

                  onChange={handleLogoChange}

                />

              </div>



              <label className="register-local-field">

                <span className="register-local-field__label">Nombre del Local</span>

                <input

                  type="text"

                  placeholder="Ej. TrapBurger"

                  className="register-local-field__input"

                  value={name}

                  onChange={(e) => setName(e.target.value)}

                  required

                />

              </label>



              <label className="register-local-field">

                <span className="register-local-field__label">Correo electrónico</span>

                <input

                  type="email"

                  placeholder="ejemplo@gmail.com"

                  className="register-local-field__input"

                  autoComplete="email"

                  value={email}

                  onChange={(e) => setEmail(e.target.value)}

                  required

                />

              </label>

              {isApiConfigured() && (
                <>
                  <PasswordField
                    label="Contraseña de la cuenta del local"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <PasswordField
                    label="Confirmar contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </>
              )}

              <label className="register-local-field">
                <input
                  type="text"
                  placeholder="Calle"
                  className="register-local-field__input"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  required
                />
              </label>

              <label className="register-local-field">
                <input
                  type="text"
                  placeholder="Número"
                  inputMode="numeric"
                  className="register-local-field__input"
                  value={streetNumber}
                  onChange={(e) => setStreetNumber(e.target.value)}
                  required
                />
              </label>

              <label className="register-local-field">
                <input
                  type="text"
                  placeholder="Ciudad"
                  className="register-local-field__input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </label>

              <label className="register-local-field">
                <input
                  type="text"
                  placeholder="Código postal"
                  inputMode="numeric"
                  maxLength={5}
                  className="register-local-field__input"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  required
                />
              </label>

              <label className="register-local-field">

                <span className="register-local-field__label">Descripción del menú</span>

                <textarea

                  rows={6}

                  placeholder="Ofrecemos hamburguesas smash con diferente opciones de papas como acompañamiento."

                  className="register-local-field__textarea"

                  value={description}

                  onChange={(e) => setDescription(e.target.value)}

                  required

                />

              </label>

            </div>



            <div className="register-local-form__column register-local-form__column--right">

              <div className="register-local-field register-local-field--images">

                <span className="register-local-field__label">Imágenes</span>

                <button

                  type="button"

                  className="register-local-form__images-zone"

                  onClick={() => imagesInputRef.current?.click()}

                >

                  <span className="register-local-form__images-placeholder">

                    {selectedImages.length > 0 ? (

                      `${selectedImages.length} imagen${selectedImages.length > 1 ? 'es' : ''} seleccionada${selectedImages.length > 1 ? 's' : ''}`

                    ) : (

                      <>

                        <CameraIcon />

                        <span>Adjunta tus imágenes aquí...</span>

                      </>

                    )}

                  </span>

                </button>

                <input

                  ref={imagesInputRef}

                  type="file"

                  accept="image/jpeg,image/png"

                  multiple

                  className="register-local-form__file-input"

                  onChange={handleImagesChange}

                />

              </div>



              <div className="register-local-form__notice-group">

                <span className="register-local-field__label">Importante:</span>

                <p className="register-local-form__notice" role="note">

                  Antes de procesar la solicitud para registrar tu local, por favor asegúrate de

                  que todos los datos sean correctos y las imágenes cumplan los requisitos.

                </p>

              </div>



              <div className="register-local-form__submit-wrap">

                <button type="submit" className="register-local-form__submit" disabled={loading}>

                  {loading ? 'ENVIANDO...' : 'SOLICITAR REGISTRO'}

                </button>

              </div>

            </div>

          </div>

        </form>

      </main>

    </div>

  )

}


