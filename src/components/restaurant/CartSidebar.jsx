import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createOrder } from '../../api/orders'
import { formatPrice } from '../../lib/cart'
import { useCart } from '../../context/CartContext'
import { useToast } from '../../context/ToastContext'
import './CartSidebar.css'

const PAYMENT_METHODS = [
  {
    id: 'mercadopago',
    label: 'Mercado Pago',
    description: 'Pagás online y te redirigimos para completar el pago.',
  },
  {
    id: 'efectivo',
    label: 'Efectivo',
    description: 'Confirmás el pedido ahora y pagás al recibirlo.',
  },
]

function BagIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 8h14l-1.2 9H8.2L7 8zM9 8V6a3 3 0 116 0v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16M9 7V5h6v2M7 7l1 12h8l1-12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function CartSidebar({ restaurantOpen = true, deliveryAddress }) {
  const navigate = useNavigate()
  const { cart, subtotal, total, updateQuantity, removeFromCart, clearCart } = useCart()
  const hasItems = cart.items.length > 0
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0].id)
  const toast = useToast()

  const handleCheckout = async () => {
    if (!hasItems) return

    setLoading(true)

    try {
      const order = await createOrder({
        restaurantId: cart.restaurantId,
        paymentMethod,
        deliveryAddress,
        items: cart.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      })

      if (paymentMethod === 'mercadopago' && !order.mpInitPoint) {
        throw new Error('No pudimos generar el link de pago. Intente nuevamente.')
      }

      clearCart()

      if (paymentMethod === 'mercadopago') {
        window.location.href = order.mpInitPoint
        return
      }

      const successParams = new URLSearchParams({
        metodo: paymentMethod,
      })

      if (order.id) {
        successParams.set('pedido', String(order.id))
      }

      navigate(`/pago/exito?${successParams.toString()}`)
    } catch (err) {
      toast.error(err.message ?? 'No pudimos registrar el pedido.')
      setLoading(false)
    }
  }

  return (
    <aside className="cart-sidebar">
      <section className="cart-sidebar__panel">
        <header className="cart-sidebar__header">
          <BagIcon />
          <h2 className="cart-sidebar__title">Tu pedido</h2>
        </header>

        {!restaurantOpen && (
          <p className="cart-sidebar__closed" role="alert">
            Este local está cerrado y no acepta pedidos por el momento.
          </p>
        )}

        {!hasItems && (
          <div className="cart-sidebar__empty">
            <span className="cart-sidebar__empty-icon" aria-hidden="true">
              <BagIcon />
            </span>
            <p>Tu pedido está vacío</p>
          </div>
        )}

        {hasItems && (
          <ul className="cart-sidebar__items">
            {cart.items.map((item) => (
              <li key={item.id} className="cart-sidebar__item">
                {item.image && (
                  <img src={item.image} alt="" className="cart-sidebar__item-image" />
                )}
                <div className="cart-sidebar__item-info">
                  <span className="cart-sidebar__item-name">{item.name}</span>
                  <span className="cart-sidebar__item-price">{formatPrice(item.price)}</span>
                </div>
                <div className="cart-sidebar__qty">
                  <button
                    type="button"
                    aria-label={`Quitar uno de ${item.name}`}
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    aria-label={`Agregar uno de ${item.name}`}
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="cart-sidebar__remove"
                  aria-label={`Eliminar ${item.name}`}
                  onClick={() => removeFromCart(item.id)}
                >
                  <TrashIcon />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="cart-sidebar__summary">
          {hasItems && (
            <fieldset className="cart-sidebar__payment-methods">
              <legend className="cart-sidebar__payment-title">Método de pago</legend>
              <div className="cart-sidebar__payment-options">
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method.id}
                    className={`cart-sidebar__payment-option${
                      paymentMethod === method.id ? ' cart-sidebar__payment-option--active' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(event) => setPaymentMethod(event.target.value)}
                    />
                    <span className="cart-sidebar__payment-label">{method.label}</span>
                    <span className="cart-sidebar__payment-description">{method.description}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className="cart-sidebar__row">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="cart-sidebar__row cart-sidebar__row--total">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        <button
          type="button"
          className="cart-sidebar__checkout"
          disabled={!hasItems || !restaurantOpen || loading}
          onClick={handleCheckout}
        >
          {loading
            ? paymentMethod === 'mercadopago'
              ? 'REDIRIGIENDO A MERCADO PAGO...'
              : 'CONFIRMANDO PEDIDO EN EFECTIVO...'
            : paymentMethod === 'mercadopago'
              ? 'PAGAR CON MERCADO PAGO'
              : 'CONFIRMAR PEDIDO EN EFECTIVO'}
        </button>
      </section>
    </aside>
  )
}
