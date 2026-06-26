import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getClaimForOrder, submitClaim } from '../api/claims'
import { cancelOrder, getMyOrders } from '../api/orders'
import { hasRatedLocal, rateLocal } from '../api/ratings'
import { StarRating } from '../components/StarRating'
import { formatPrice } from '../lib/cart'
import { ORDER_STATUS_LABELS } from '../lib/roles'
import { OrdersNavbar } from '../components/OrdersNavbar'
import './Panel.css'

const COMPENSATION_TYPES = [
  { id: 'reintegro', label: 'Reintegro del monto' },
  { id: 'compensacion', label: 'Otra compensación' },
]

export function MyOrders() {
  const [orders, setOrders] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [claimingId, setClaimingId] = useState(null)
  const [claimReason, setClaimReason] = useState('')
  const [claimCompensation, setClaimCompensation] = useState(COMPENSATION_TYPES[0].id)
  const [ratingOrderId, setRatingOrderId] = useState(null)
  const [ratingScore, setRatingScore] = useState(5)
  const [ratingComment, setRatingComment] = useState('')
  const [orderMeta, setOrderMeta] = useState({})

  const loadOrders = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getMyOrders(statusFilter ? { status: statusFilter } : {})
      setOrders(data)

      const meta = {}
      await Promise.all(
        data
          .filter((o) => o.status === 'confirmed')
          .map(async (order) => {
            const [claim, rated] = await Promise.all([
              getClaimForOrder(order.id).catch(() => null),
              hasRatedLocal(order.restaurantId).catch(() => false),
            ])
            meta[order.id] = { claim, rated }
          }),
      )
      setOrderMeta(meta)
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

  const handleClaim = async (orderId) => {
    if (!claimReason.trim()) {
      setError('Debe describir el motivo del reclamo antes de enviarlo.')
      return
    }
    setError(null)
    setMessage(null)
    try {
      await submitClaim({ orderId, reason: claimReason, compensationType: claimCompensation })
      setMessage('Reclamo registrado. El local fue notificado.')
      setClaimingId(null)
      setClaimReason('')
      await loadOrders()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRate = async (order) => {
    setError(null)
    setMessage(null)
    try {
      await rateLocal({ localId: order.restaurantId, score: ratingScore, comment: ratingComment })
      setMessage('Calificación registrada.')
      setRatingOrderId(null)
      setRatingComment('')
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

        {error && <p className="panel-page__error" role="alert">{error}</p>}
        {message && <p className="panel-page__success">{message}</p>}

        <section className="panel-card">
          <label className="panel-field" style={{ maxWidth: '220px', marginBottom: '1rem' }}>
            <span className="panel-field__label">Filtrar por estado</span>
            <select className="panel-field__select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
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
              <Link to="/pedidos" style={{ color: 'var(--celeste)', fontWeight: 700 }}>¡Explore los locales disponibles!</Link>
            </p>
          )}

          {!loading && orders.length > 0 && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {orders.map((order) => {
                const meta = orderMeta[order.id] ?? {}
                return (
                  <article key={order.id} style={{ border: '1px solid #eee', borderRadius: '0.75rem', padding: '1rem' }}>
                    <div className="panel-actions" style={{ justifyContent: 'space-between' }}>
                      <strong>#{order.id} — {order.restaurantName}</strong>
                      <span className={`panel-badge panel-badge--${order.status === 'pending' ? 'pending' : order.status === 'confirmed' ? 'confirmed' : 'closed'}`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <p>Total: {formatPrice(order.total)}</p>
                    <p>{new Date(order.createdAt).toLocaleString('es-AR')}</p>

                    {order.status === 'pending' && (
                      <button type="button" className="panel-btn panel-btn--danger" style={{ marginTop: '0.5rem' }} onClick={() => handleCancel(order.id)}>
                        Cancelar pedido
                      </button>
                    )}

                    {order.status === 'confirmed' && (
                      <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.5rem' }}>
                        {meta.claim ? (
                          <p style={{ color: 'var(--gris-intermedio)' }}>Reclamo presentado ({meta.claim.status === 'resolved' ? 'atendido' : 'pendiente'})</p>
                        ) : claimingId === order.id ? (
                          <>
                            <textarea className="panel-field__textarea" rows={3} placeholder="Motivo del reclamo" value={claimReason} onChange={(e) => setClaimReason(e.target.value)} />
                            <select className="panel-field__select" value={claimCompensation} onChange={(e) => setClaimCompensation(e.target.value)}>
                              {COMPENSATION_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                            </select>
                            <div className="panel-actions">
                              <button type="button" className="panel-btn panel-btn--primary" onClick={() => handleClaim(order.id)}>Enviar reclamo</button>
                              <button type="button" className="panel-btn panel-btn--outline" onClick={() => setClaimingId(null)}>Cancelar</button>
                            </div>
                          </>
                        ) : (
                          <button type="button" className="panel-btn panel-btn--outline" onClick={() => setClaimingId(order.id)}>Realizar reclamo</button>
                        )}

                        {meta.rated ? (
                          <p style={{ color: 'var(--gris-intermedio)' }}>Ya calificó a este local.</p>
                        ) : ratingOrderId === order.id ? (
                          <>
                            <StarRating value={ratingScore} onChange={setRatingScore} />
                            <textarea className="panel-field__textarea" rows={2} placeholder="Comentario (opcional)" value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} />
                            <div className="panel-actions">
                              <button type="button" className="panel-btn panel-btn--primary" onClick={() => handleRate(order)}>Calificar local</button>
                              <button type="button" className="panel-btn panel-btn--outline" onClick={() => setRatingOrderId(null)}>Cancelar</button>
                            </div>
                          </>
                        ) : (
                          <button type="button" className="panel-btn panel-btn--outline" onClick={() => setRatingOrderId(order.id)}>Calificar local</button>
                        )}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
