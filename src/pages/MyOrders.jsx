import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cancelOrder, getMyOrders } from '../api/orders'
import { formatPrice } from '../lib/cart'
import { ORDER_STATUS_LABELS } from '../lib/roles'
import { OrdersNavbar } from '../components/OrdersNavbar'
import './Panel.css'

export function MyOrders() {
  const [orders, setOrders] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const loadOrders = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getMyOrders(statusFilter ? { status: statusFilter } : {})
      setOrders(data)
    } catch (err) {
      setError(err.message ?? 'No pudimos cargar tus pedidos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [statusFilter])

  const handleCancel = async (orderId) => {
    if (!window.confirm('¿Confirma la cancelación del pedido?')) return

    setMessage(null)
    setError(null)

    try {
      await cancelOrder(orderId)
      setMessage('Pedido cancelado.')
      await loadOrders()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="panel-page">
      <OrdersNavbar />

      <main className="panel-page__main contenedor">
        <h1 className="panel-page__title">Mis Pedidos</h1>

        {error && (
          <p className="panel-page__error" role="alert">
            {error}
          </p>
        )}
        {message && <p className="panel-page__success">{message}</p>}

        <section className="panel-card">
          <label className="panel-field" style={{ maxWidth: '220px', marginBottom: '1rem' }}>
            <span className="panel-field__label">Filtrar por estado</span>
            <select
              className="panel-field__select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmado</option>
              <option value="rejected">Rechazado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </label>

          {loading && <p className="panel-empty">Cargando pedidos...</p>}

          {!loading && orders.length === 0 && (
            <p className="panel-empty">
              Aún no ha realizado ningún pedido.{' '}
              <Link to="/pedidos" style={{ color: 'var(--celeste)', fontWeight: 700 }}>
                ¡Explore los locales disponibles!
              </Link>
            </p>
          )}

          {!loading && orders.length > 0 && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {orders.map((order) => (
                <article
                  key={order.id}
                  style={{ border: '1px solid #eee', borderRadius: '0.75rem', padding: '1rem' }}
                >
                  <div className="panel-actions" style={{ justifyContent: 'space-between' }}>
                    <strong>
                      #{order.id} — {order.restaurantName}
                    </strong>
                    <span className={`panel-badge panel-badge--${order.status === 'pending' ? 'pending' : order.status === 'confirmed' ? 'confirmed' : 'closed'}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <p>Total: {formatPrice(order.total)}</p>
                  <p>{new Date(order.createdAt).toLocaleString('es-AR')}</p>

                  {order.status === 'pending' && (
                    <button
                      type="button"
                      className="panel-btn panel-btn--danger"
                      style={{ marginTop: '0.5rem' }}
                      onClick={() => handleCancel(order.id)}
                    >
                      Cancelar pedido
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
