import { useEffect, useState, useMemo } from 'react'
import { confirmOrder, getLocalOrders, rejectOrder } from '../../api/localPanel'
import { formatPrice } from '../../lib/cart'
import { ORDER_STATUS_LABELS } from '../../lib/roles'
import '../Panel.css'

const REJECTION_REASONS = [
  'Falta de stock',
  'Cierre anticipado',
  'Demasiados pedidos',
  'Otro',
]

export function LocalOrdersPage() {
  const [orders, setOrders] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [sort, setSort] = useState('date-desc')   // 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [confirmingId, setConfirmingId] = useState(null)
  const [deliveryMinutes, setDeliveryMinutes] = useState('')
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState(REJECTION_REASONS[0])

  const loadOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getLocalOrders(statusFilter ? { status: statusFilter } : {})
      setOrders(data)
    } catch (err) {
      setError(err.message ?? 'No pudimos cargar los pedidos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [statusFilter])

  const sortedOrders = useMemo(() => {
    const [field, dir] = sort.split('-')
    return [...orders].sort((a, b) => {
      const aVal = field === 'date' ? new Date(a.createdAt).getTime() : a.total
      const bVal = field === 'date' ? new Date(b.createdAt).getTime() : b.total
      return dir === 'asc' ? aVal - bVal : bVal - aVal
    })
  }, [orders, sort])

  const handleConfirm = async (orderId) => {
    if (!deliveryMinutes || Number(deliveryMinutes) <= 0) {
      setError('Debe ingresar el tiempo estimado de entrega para confirmar el pedido.')
      return
    }
    if (!window.confirm('¿Confirma el pedido? Se simulará el pago y se generará la factura.')) return
    setError(null)
    setMessage(null)
    try {
      await confirmOrder(orderId, deliveryMinutes)
      setMessage('Pedido confirmado. Factura generada y cliente notificado (simulado).')
      setConfirmingId(null)
      setDeliveryMinutes('')
      await loadOrders()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleReject = async (orderId) => {
    if (!rejectReason.trim()) {
      setError('Debe seleccionar o escribir un motivo de rechazo antes de continuar.')
      return
    }
    if (!window.confirm('¿Confirma el rechazo del pedido?')) return
    setError(null)
    setMessage(null)
    try {
      await rejectOrder(orderId, rejectReason)
      setMessage('Pedido rechazado. Cliente notificado (simulado).')
      setRejectingId(null)
      await loadOrders()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      {error && (
        <p className="panel-page__error" role="alert">
          {error}
        </p>
      )}
      {message && <p className="panel-page__success">{message}</p>}

      <section className="panel-card">
        <div
          className="panel-actions"
          style={{ marginBottom: '1rem', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}
        >
          {/* Izquierda: filtro por estado */}
          <label className="panel-field" style={{ minWidth: '180px' }}>
            <span className="panel-field__label">Estado</span>
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

          {/* Derecha: ordenamiento */}
          <label className="panel-field" style={{ minWidth: '200px' }}>
            <span className="panel-field__label">Ordenar</span>
            <select
              className="panel-field__select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="date-desc">Fecha: mayor a menor</option>
              <option value="date-asc">Fecha: menor a mayor</option>
              <option value="amount-desc">Precio: mayor a menor</option>
              <option value="amount-asc">Precio: menor a mayor</option>
            </select>
          </label>
        </div>

        {loading && <p className="panel-empty">Cargando pedidos...</p>}

        {!loading && sortedOrders.length === 0 && (
          <p className="panel-empty">No se encontraron pedidos con los criterios seleccionados.</p>
        )}

        {!loading && sortedOrders.length > 0 && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {sortedOrders.map((order) => (
              <article
                key={order.id}
                style={{ border: '1px solid #eee', borderRadius: '0.75rem', padding: '1rem' }}
              >
                <div className="panel-actions" style={{ justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>Pedido #{order.id}</strong>
                  <span className={`panel-badge panel-badge--${order.status === 'pending' ? 'pending' : order.status === 'confirmed' ? 'confirmed' : 'closed'}`}>
                    {ORDER_STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>

                <p>Cliente: {order.clientName}</p>
                <p>Total: {formatPrice(order.total)}</p>
                <p>Fecha: {new Date(order.createdAt).toLocaleString('es-AR')}</p>

                <ul style={{ margin: '0.5rem 0', paddingLeft: '1.25rem' }}>
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.quantity}x {item.name} — {formatPrice(item.price * item.quantity)}
                    </li>
                  ))}
                </ul>

                {order.status === 'pending' && (
                  <div className="panel-actions" style={{ marginTop: '0.75rem' }}>
                    {confirmingId === order.id ? (
                      <>
                        <input
                          type="number"
                          min="1"
                          placeholder="Minutos de entrega"
                          className="panel-field__input"
                          style={{ maxWidth: '160px' }}
                          value={deliveryMinutes}
                          onChange={(e) => setDeliveryMinutes(e.target.value)}
                        />
                        <button type="button" className="panel-btn panel-btn--primary" onClick={() => handleConfirm(order.id)}>
                          Confirmar
                        </button>
                        <button type="button" className="panel-btn panel-btn--outline" onClick={() => setConfirmingId(null)}>
                          Cancelar
                        </button>
                      </>
                    ) : rejectingId === order.id ? (
                      <>
                        <select
                          className="panel-field__select"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        >
                          {REJECTION_REASONS.map((reason) => (
                            <option key={reason} value={reason}>{reason}</option>
                          ))}
                        </select>
                        <button type="button" className="panel-btn panel-btn--danger" onClick={() => handleReject(order.id)}>
                          Rechazar
                        </button>
                        <button type="button" className="panel-btn panel-btn--outline" onClick={() => setRejectingId(null)}>
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="panel-btn panel-btn--primary"
                          onClick={() => { setConfirmingId(order.id); setRejectingId(null) }}
                        >
                          Confirmar pedido
                        </button>
                        <button
                          type="button"
                          className="panel-btn panel-btn--danger"
                          onClick={() => { setRejectingId(order.id); setConfirmingId(null) }}
                        >
                          Rechazar pedido
                        </button>
                      </>
                    )}
                  </div>
                )}

                {order.status === 'confirmed' && order.deliveryMinutes && (
                  <p>Entrega estimada: {order.deliveryMinutes} minutos</p>
                )}
                {order.status === 'rejected' && order.rejectionReason && (
                  <p>Motivo: {order.rejectionReason}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  )
}