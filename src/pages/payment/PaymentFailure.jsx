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
          <span className="payment-status-card__icon" aria-hidden="true">X</span>
          <h1>No pudimos confirmar el pago</h1>
          <p>
            Todavia no pudimos acreditar el pago
            {externalReference ? ` del pedido (ID ${externalReference})` : ''}. Revisa el estado
            en Mis Pedidos y, si corresponde, reintenta el pago desde alli.
          </p>
          <Link to="/mis-pedidos" className="payment-status-card__btn">
            Ver mis pedidos
          </Link>
        </div>
      </main>
    </div>
  )
}
