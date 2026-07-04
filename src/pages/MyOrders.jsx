import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getClaimForOrder, submitClaim } from '../api/claims'
import { cancelOrder, getMyOrders } from '../api/orders'
import { hasRatedLocal } from '../api/ratings'
import { OrdersNavbar } from '../components/OrdersNavbar'
import { formatPrice } from '../lib/cart'
import { ORDER_STATUS_LABELS } from '../lib/roles'
import './Panel.css'

const COMPENSATION_TYPES = [
  { id: 'reintegro', label: 'Reintegro del monto' },
  { id: 'compensacion', label: 'Otra compensación' },
]

const SORT_OPTIONS = [
  { id: 'date_desc', label: 'Fecha (más reciente primero)' },
  { id: 'date_asc', label: 'Fecha (más antigua primero)' },
  { id: 'price_desc', label: 'Precio (mayor a menor)' },
  { id: 'price_asc', label: 'Precio (menor a mayor)' },
  { id: 'restaurant_asc', label: 'Restaurante (A-Z)' },
  { id: 'restaurant_desc', label: 'Restaurante (Z-A)' },
]

function getOrderBadgeVariant(status) {
  if (status === 'pending') return 'pending'
  if (status === 'confirmed') return 'confirmed'
  if (status === 'delivered') return 'delivered'
  return 'closed'
}

function sortOrders(orders, sortBy) {
  const sorted = [...orders]

  switch (sortBy) {
    case 'date_asc':
      sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      break
    case 'date_desc':
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      break
    case 'price_asc':
      sorted.sort((a, b) => a.total - b.total)
      break
    case 'price_desc':
      sorted.sort((a, b) => b.total - a.total)
      break
    case 'restaurant_asc':
      sorted.sort((a, b) =>
        (a.restaurantName ?? '').localeCompare(b.restaurantName ?? '', 'es', { sensitivity: 'base' }),
      )
      break
    case 'restaurant_desc':
      sorted.sort((a, b) =>
        (b.restaurantName ?? '').localeCompare(a.restaurantName ?? '', 'es', { sensitivity: 'base' }),
      )
      break
    default:
      break
  }

  return sorted
}

export function MyOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('date_desc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [claimingId, setClaimingId] = useState(null)
  const [claimReason, setClaimReason] = useState('')
  const [claimCompensation, setClaimCompensation] = useState(COMPENSATION_TYPES[0].id)
  const [orderMeta, setOrderMeta] = useState({})
  const [hasAnyOrders, setHasAnyOrders] = useState(true)

  const loadOrders = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getMyOrders(statusFilter ? { status: statusFilter } : {})
      setOrders(data)

      // Solo cuando no hay filtro activo sabemos con certeza si el usuario
      // tiene pedidos en total o no.
      if (!statusFilter) {
        setHasAnyOrders(data.length > 0)
      }

      const meta = {}
      await Promise.all(
        data
          .filter((order) => ['confirmed', 'delivered'].includes(order.status))
          .map(async (order) => {
            if (!order.restaurantId) {
              meta[order.id] = { claim: null, rated: false }
              return
            }

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

  const sortedOrders = useMemo(() => sortOrders(orders, sortBy), [orders, sortBy])

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

  const handleOpenRating = (order) => {
    if (!order.restaurantId) {
      setError('No pudimos identificar el local asociado a este pedido.')
      return
    }

    navigate(`/local/${order.restaurantId}`, {
      state: { openRating: true },
    })
  }

  const emptyMessage = statusFilter
    ? 'No se encontraron pedidos que coincidan con los criterios seleccionados.'
    : 'Aún no ha realizado ningún pedido.'

  return (
    <div className="panel-page">
      <OrdersNavbar />

      <main className="panel-page__main contenedor">
        <h1 className="panel-page__title">Mis Pedidos</h1>

        {error && <p className="panel-page__error" role="alert">{error}</p>}
        {message && <p className="panel-page__success">{message}</p>}

        <section className="panel-card">
          <div
            className="panel-actions"
            style={{ gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', justifyContent: 'space-between' }}
          >
            <label className="panel-field" style={{ maxWidth: '220px' }}>
              <span className="panel-field__label">Filtrar por estado</span>
              <select
                className="panel-field__select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmado</option>
                <option value="delivered">Entregado</option>
                <option value="rejected">Rechazado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </label>

            <label className="panel-field" style={{ maxWidth: '260px', marginLeft: 'auto' }}>
              <span className="panel-field__label">Ordenar por</span>
              <select
                className="panel-field__select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loading && <p className="panel-empty">Cargando pedidos...</p>}

          {!loading && sortedOrders.length === 0 && (
            <p className="panel-empty">
              {emptyMessage}
              {!hasAnyOrders && (
                <>
                  {` `}
                  <Link to="/pedidos" style={{ color: 'var(--celeste)', fontWeight: 700 }}>
                    ¡Explore los locales disponibles!
                  </Link>
                </>
              )}
            </p>
          )}

          {!loading && sortedOrders.length > 0 && (
            <div className="my-orders__list">
              {sortedOrders.map((order) => {
                const meta = orderMeta[order.id] ?? {}
                const motivoRechazo = order.motivoRechazo ?? order.rejectionReason

                return (
                  <article key={order.id} className="my-orders__card">
                    <div className="panel-actions my-orders__header">
                      <strong>#{order.id} — {order.restaurantName}</strong>
                      <span
                        className={`panel-badge panel-badge--${getOrderBadgeVariant(order.status)}`}
                      >
                        {ORDER_STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </div>

                    <div className="my-orders__content">
                      <div className="my-orders__details">
                        <p>Total: {formatPrice(order.total)}</p>
                        <p>{new Date(order.createdAt).toLocaleString('es-AR')}</p>
                      </div>

                      {order.status === 'rejected' && motivoRechazo && (
                        <div className="my-orders__rejection">
                          <p className="my-orders__rejection-title">Motivo del rechazo</p>
                          <p className="my-orders__rejection-text">{motivoRechazo}</p>
                        </div>
                      )}

                      {order.status === 'pending' && (
                        <button
                          type="button"
                          className="panel-btn panel-btn--danger my-orders__action-btn"
                          onClick={() => handleCancel(order.id)}
                        >
                          Cancelar pedido
                        </button>
                      )}

                      {['confirmed', 'delivered'].includes(order.status) && (
                        <div className="my-orders__actions">
                          {meta.claim ? (
                            <p className="my-orders__claim-status">
                              Reclamo presentado ({meta.claim.status === 'resolved' ? 'atendido' : 'pendiente'})
                            </p>
                          ) : (
                            <button
                              type="button"
                              className="panel-btn panel-btn--outline my-orders__action-btn"
                              onClick={() => setClaimingId(order.id)}
                            >
                              Realizar reclamo
                            </button>
                          )}

                          <button
                            type="button"
                            className="panel-btn panel-btn--outline my-orders__action-btn"
                            onClick={() => handleOpenRating(order)}
                          >
                            {meta.rated ? 'Editar calificación del local' : 'Calificar local'}
                          </button>
                        </div>
                      )}
                    </div>

                    {['confirmed', 'delivered'].includes(order.status) && claimingId === order.id && !meta.claim && (
                      <div className="my-orders__claim-form">
                        <textarea
                          className="panel-field__textarea"
                          rows={3}
                          placeholder="Motivo del reclamo"
                          value={claimReason}
                          onChange={(e) => setClaimReason(e.target.value)}
                        />
                        <select
                          className="panel-field__select"
                          value={claimCompensation}
                          onChange={(e) => setClaimCompensation(e.target.value)}
                        >
                          {COMPENSATION_TYPES.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                        <div className="panel-actions">
                          <button
                            type="button"
                            className="panel-btn panel-btn--primary"
                            onClick={() => handleClaim(order.id)}
                          >
                            Enviar reclamo
                          </button>
                          <button
                            type="button"
                            className="panel-btn panel-btn--outline"
                            onClick={() => setClaimingId(null)}
                          >
                            Cancelar
                          </button>
                        </div>
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