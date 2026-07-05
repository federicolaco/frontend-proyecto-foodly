import { Link, useSearchParams } from 'react-router-dom'
import { OrdersNavbar } from '../../components/OrdersNavbar'
import './PaymentStatus.css'

export function PaymentFailure() {
  const [searchParams] = useSearchParams()
  const externalReference = searchParams.get('external_reference')

  return (
    <div className="payment-status-page">
      <OrdersNavbar />
      <main className="payment-status-page__main contenedor">
        <div className="payment-status-card payment-status-card--error">
          <span className="payment-status-card__icon" aria-hidden="true">✕</span>
          <h1>No pudimos procesar el pago</h1>
          <p>
            El pago{externalReference ? ` del pedido (ID ${externalReference})` : ''} fue
            rechazado o cancelado. Podés intentar nuevamente desde el local.
          </p>
          <Link to="/pedidos" className="payment-status-card__btn">
            Volver a pedidos
          </Link>
        </div>
      </main>
    </div>
  )
}
