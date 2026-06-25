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

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function DeliveryIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 16h2l2-7h9l2 4h3v3h-2M7 16a2 2 0 104 0M15 16a2 2 0 104 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function RestaurantDeliveryBar({ deliveryTime }) {
  return (
    <div className="restaurant-delivery-bar">
      <button type="button" className="restaurant-delivery-bar__item">
        <LocationIcon />
        <span>
          <strong>Enviar a:</strong> Calle Falsa 123, Barrio
        </span>
        <span className="restaurant-delivery-bar__chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      <div className="restaurant-delivery-bar__item restaurant-delivery-bar__item--static">
        <ClockIcon />
        <span>
          <strong>Tiempo estimado de entrega:</strong> {deliveryTime}
        </span>
      </div>

      <button type="button" className="restaurant-delivery-bar__item">
        <DeliveryIcon />
        <span className="restaurant-delivery-bar__mode">DELIVERY</span>
        <span className="restaurant-delivery-bar__chevron" aria-hidden="true">
          ▾
        </span>
      </button>
    </div>
  )
}
