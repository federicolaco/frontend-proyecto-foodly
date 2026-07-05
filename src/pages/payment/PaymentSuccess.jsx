import { Link, useSearchParams } from 'react-router-dom'
import { OrdersNavbar } from '../../components/OrdersNavbar'
import './PaymentStatus.css'

export function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const paymentMethod = searchParams.get('metodo')
  const externalReference =
    searchParams.get('pedido') ?? searchParams.get('external_reference')
  const isCashPayment = paymentMethod === 'efectivo'

  return (
    <div className="payment-status-page">
      <OrdersNavbar />
      <main className="payment-status-page__main contenedor">
        <div className="payment-status-card payment-status-card--success">
          <span className="payment-status-card__icon" aria-hidden="true">✓</span>
          <h1>{isCashPayment ? 'Pedido confirmado' : '¡Pago aprobado!'}</h1>
          <p>
            {isCashPayment
              ? `Tu pedido${externalReference ? ` (ID ${externalReference})` : ''} fue registrado para pagar en efectivo. El local lo confirmará en breve.`
              : `Tu pedido${externalReference ? ` (ID ${externalReference})` : ''} fue registrado correctamente. El local lo confirmará en breve.`}
          </p>
          <Link to="/mis-pedidos" className="payment-status-card__btn">
            Ver mis pedidos
          </Link>
        </div>
      </main>
    </div>
  )
}
