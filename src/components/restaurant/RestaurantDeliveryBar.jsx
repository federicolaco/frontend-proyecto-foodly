import { useEffect, useMemo, useState } from 'react'
import { normalizeAddress } from '../../api/backend/helpers'
import './RestaurantDeliveryBar.css'

function LocationIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s6-5.33 6-10a6 6 0 10-12 0c0 4.67 6 10 6 10z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="11" r="2" fill="currentColor" />
    </svg>
  )
}

function formatDeliveryAddress(address) {
  const normalized = normalizeAddress(address)
  return [normalized.calle, normalized.numero, normalized.ciudad, normalized.codigoPostal]
    .filter(Boolean)
    .join(', ')
}

export function RestaurantDeliveryBar({ address, onAddressChange }) {
  const normalizedAddress = useMemo(() => normalizeAddress(address), [address])
  const [isEditing, setIsEditing] = useState(false)
  const [draftAddress, setDraftAddress] = useState(normalizedAddress)

  useEffect(() => {
    setDraftAddress(normalizedAddress)
  }, [normalizedAddress])

  const handleToggle = () => {
    setDraftAddress(normalizedAddress)
    setIsEditing((prev) => !prev)
  }

  const handleFieldChange = (field, value) => {
    setDraftAddress((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCancel = () => {
    setDraftAddress(normalizedAddress)
    setIsEditing(false)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onAddressChange(normalizeAddress(draftAddress))
    setIsEditing(false)
  }

  return (
    <div className="restaurant-delivery-bar">
      <button type="button" className="restaurant-delivery-bar__item" onClick={handleToggle}>
        <LocationIcon />
        <span className="restaurant-delivery-bar__copy">
          <strong>Enviar a:</strong>
          <span>{formatDeliveryAddress(normalizedAddress)}</span>
        </span>
        <span className="restaurant-delivery-bar__chevron" aria-hidden="true">
          {isEditing ? '^' : 'v'}
        </span>
      </button>

      {isEditing && (
        <form className="restaurant-delivery-bar__editor" onSubmit={handleSubmit}>
          <p className="restaurant-delivery-bar__editor-title">Cambiar dirección solo para este envío</p>

          <div className="restaurant-delivery-bar__grid">
            <label className="restaurant-delivery-bar__field">
              <span>Calle</span>
              <input
                type="text"
                value={draftAddress.calle}
                onChange={(event) => handleFieldChange('calle', event.target.value)}
                required
              />
            </label>

            <label className="restaurant-delivery-bar__field">
              <span>Número</span>
              <input
                type="text"
                value={draftAddress.numero}
                onChange={(event) => handleFieldChange('numero', event.target.value)}
                required
              />
            </label>

            <label className="restaurant-delivery-bar__field">
              <span>Ciudad</span>
              <input
                type="text"
                value={draftAddress.ciudad}
                onChange={(event) => handleFieldChange('ciudad', event.target.value)}
                required
              />
            </label>

            <label className="restaurant-delivery-bar__field">
              <span>Código postal</span>
              <input
                type="text"
                value={draftAddress.codigoPostal}
                onChange={(event) => handleFieldChange('codigoPostal', event.target.value)}
                required
              />
            </label>
          </div>

          <div className="restaurant-delivery-bar__actions">
            <button
              type="button"
              className="restaurant-delivery-bar__action restaurant-delivery-bar__action--ghost"
              onClick={handleCancel}
            >
              Cancelar
            </button>
            <button type="submit" className="restaurant-delivery-bar__action">
              Guardar envío
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

