import { Link, useSearchParams } from 'react-router-dom'
import { OrdersNavbar } from '../../components/OrdersNavbar'
import './PaymentStatus.css'

export function PaymentPending() {
  const [searchParams] = useSearchParams()
  const externalReference = searchParams.get('external_reference')

  return (
    <div className="payment-status-page">
      <OrdersNavbar />
      <main className="payment-status-page__main contenedor">
        <div className="payment-status-card payment-status-card--pending">
          <span className="payment-status-card__icon" aria-hidden="true">⏳</span>
          <h1>Pago en proceso</h1>
          <p>
            Tu pago{externalReference ? ` del pedido #${externalReference}` : ''} está
            siendo procesado. Te avisaremos cuando se confirme.
          </p>
          <Link to="/mis-pedidos" className="payment-status-card__btn">
            Ver mis pedidos
          </Link>
        </div>
      </main>
    </div>
  )
}