import { useEffect, useMemo, useState } from 'react'
import { usePolling } from '../hooks/usePolling'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { getClaimForOrder, submitClaim } from '../api/claims'
import { cancelOrder, getMyOrders, retryOrderPayment } from '../api/orders'
import { hasRatedLocal } from '../api/ratings'
import { OrdersNavbar } from '../components/OrdersNavbar'
import { clearSessionToken } from '../lib/auth'
import { formatPrice } from '../lib/cart'
import { formatDateTime } from '../lib/format'
import { ORDER_STATUS_LABELS } from '../lib/roles'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import { Pagination } from '../components/Pagination'
import './Panel.css'

const COMPENSATION_TYPES = [
  { id: 'reintegro', label: 'Reintegro del monto' },
  { id: 'compensacion', label: 'Otra compensacion' },
]

const SORT_OPTIONS = [
  { id: 'date_desc', label: 'Fecha (mas reciente primero)' },
  { id: 'date_asc', label: 'Fecha (mas antigua primero)' },
  { id: 'price_desc', label: 'Precio (mayor a menor)' },
  { id: 'price_asc', label: 'Precio (menor a mayor)' },
  { id: 'restaurant_asc', label: 'Restaurante (A-Z)' },
  { id: 'restaurant_desc', label: 'Restaurante (Z-A)' },
]

function ClaimForm({ orderId, onSubmit, onCancel, isSubmitting }) {
  const [reason, setReason] = useState('')
  const [compensation, setCompensation] = useState(COMPENSATION_TYPES[0].id)

  const resetDraft = () => {
    setReason('')
    setCompensation(COMPENSATION_TYPES[0].id)
  }

  const handleCancel = () => {
    resetDraft()
    onCancel()
  }

  const handleSubmit = () => {
    onSubmit({
      orderId,
      reason,
      compensation,
      resetDraft,
    })
  }

  return (
    <div className="my-orders__claim-form">
      <textarea
        className="panel-field__textarea"
        rows={3}
        placeholder="Motivo del reclamo"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        disabled={isSubmitting}
      />
      <select
        className="panel-field__select"
        value={compensation}
        onChange={(e) => setCompensation(e.target.value)}
        disabled={isSubmitting}
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
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Enviando reclamo...' : 'Enviar reclamo'}
        </button>
        <button
          type="button"
          className="panel-btn panel-btn--outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

function getOrderBadgeVariant(status) {
  if (status === 'pending') return 'pending'
  if (status === 'confirmed') return 'confirmed'
  if (status === 'delivered') return 'delivered'
  return 'closed'
}

function getOrderStatusLabel(order) {
  return order.visibleStatus ?? order.estadoVisible ?? ORDER_STATUS_LABELS[order.status] ?? order.status
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

function getClaimLookupErrorMessage(error) {
  return error?.message ?? 'No pudimos verificar el estado del reclamo.'
}

function getErrorStatus(error) {
  if (typeof error?.status === 'number') return error.status
  if (error instanceof ApiError && typeof error.status === 'number') return error.status
  return null
}

export function MyOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState('date_desc')
  const [loading, setLoading] = useState(true)
  const [claimingId, setClaimingId] = useState(null)
  const [submittingClaimId, setSubmittingClaimId] = useState(null)
  const [orderMeta, setOrderMeta] = useState({})
  const [hasAnyOrders, setHasAnyOrders] = useState(true)
  const [retryingId, setRetryingId] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)
  const toast = useToast()
  const confirm = useConfirm()

  const redirectToLogin = () => {
    clearSessionToken()
    navigate('/iniciar-sesion', {
      replace: true,
      state: { message: 'Tu sesión expiró. Por favor iniciá sesión nuevamente.' },
    })
  }

 const loadOrders = async (silent = false) => {
    if (!silent) setLoading(true)

    try {
      const { items: data, totalPages: tp } = await getMyOrders({
        ...(statusFilter ? { status: statusFilter } : {}),
        page,
      })
      setOrders(data)
      setTotalPages(tp)

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

            const [claimResult, ratedResult] = await Promise.allSettled([
              getClaimForOrder(order.id),
              hasRatedLocal(order.restaurantId),
            ])

            meta[order.id] = {
              claim: claimResult.status === 'fulfilled' ? claimResult.value : null,
              claimLookupError:
                claimResult.status === 'rejected'
                  ? getClaimLookupErrorMessage(claimResult.reason)
                  : null,
              rated: ratedResult.status === 'fulfilled' ? ratedResult.value : false,
            }
          }),
      )

      setOrderMeta(meta)
    } catch (err) {
      if (!silent) toast.error(err.message ?? 'No pudimos cargar tus pedidos.')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    setPage(0)
  }, [statusFilter])

  usePolling(loadOrders, 3000, [statusFilter, page])

  const sortedOrders = useMemo(() => sortOrders(orders, sortBy), [orders, sortBy])

  const handleCancel = async (orderId) => {
    const confirmed = await confirm({
      title: 'Cancelar pedido',
      message: '¿Confirma la cancelación del pedido?',
      confirmText: 'Cancelar pedido',
      variant: 'danger',
    })
    if (!confirmed) return

    setCancellingId(orderId)

    try {
      await cancelOrder(orderId)
      toast.success('Pedido cancelado.')
      await loadOrders()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCancellingId(null)
    }
  }

  const handleRetryPayment = async (orderId) => {
    setRetryingId(orderId)

    try {
      const order = await retryOrderPayment(orderId)

      if (!order.mpInitPoint) {
        throw new Error('No pudimos generar el enlace para reintentar el pago.')
      }

      window.location.href = order.mpInitPoint
    } catch (err) {
      toast.error(err.message ?? 'No pudimos reintentar el pago.')
    } finally {
      setRetryingId(null)
    }
  }

  const handleClaim = async ({ orderId, reason, compensation, resetDraft }) => {
    if (!reason.trim()) {
      toast.error('Debe describir el motivo del reclamo antes de enviarlo.')
      return
    }

    setSubmittingClaimId(orderId)

    try {
      await submitClaim({ orderId, reason, compensationType: compensation })
      toast.success('Reclamo registrado. El local fue notificado.')
      resetDraft()
      setClaimingId(null)
      await loadOrders()
    } catch (err) {
      const status = getErrorStatus(err)

      if (status === 401) {
        redirectToLogin()
        return
      }

      if (status === 409) {
        toast.info(err.message ?? 'Ya existe un reclamo para este pedido.')
        resetDraft()
        setClaimingId(null)
        await loadOrders()
        return
      }

      if (status === 403) {
        toast.error(err.message ?? 'No puede realizar reclamos sobre pedidos que no le pertenecen.')
        return
      }

      toast.error(err.message ?? 'No pudimos registrar el reclamo.')
    } finally {
      setSubmittingClaimId(null)
    }
  }

  const handleOpenRating = (order) => {
    if (!order.restaurantId) {
      toast.error('No pudimos identificar el local asociado a este pedido.')
      return
    }

    navigate(`/local/${order.restaurantId}`, {
      state: { openRating: true },
    })
  }

  const emptyMessage = statusFilter
    ? 'No se encontraron pedidos que coincidan con los criterios seleccionados.'
    : 'Aun no ha realizado ningun pedido.'

  return (
    <div className="panel-page">
      <OrdersNavbar />

      <main className="panel-page__main contenedor">
        <h1 className="panel-page__title">Mis Pedidos</h1>

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
                  {' '}
                  <Link to="/pedidos" style={{ color: 'var(--celeste)', fontWeight: 700 }}>
                    Explore los locales disponibles.
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
                const isPaymentPending = order.paymentPending ?? order.pagoPendiente
                const canRetryPayment = order.canRetryPayment ?? order.permiteReintentarPago
                const isRetryingPayment = retryingId === order.id
                const isCancellingOrder = cancellingId === order.id

                return (
                  <article key={order.id} className="my-orders__card">
                    <div className="panel-actions my-orders__header">
                      <strong>Pedido (ID {order.id}) - {order.restaurantName}</strong>
                      <span
                        className={`panel-badge panel-badge--${getOrderBadgeVariant(order.status)}`}
                      >
                        {getOrderStatusLabel(order)}
                      </span>
                    </div>

                    <div className="my-orders__content">
                      <div className="my-orders__details">
                        <p>Total: {formatPrice(order.total)}</p>
                        <p>{formatDateTime(order.createdAt)}</p>
                      </div>

                      {order.status === 'rejected' && motivoRechazo && (
                        <div className="my-orders__rejection">
                          <p className="my-orders__rejection-title">Motivo del rechazo</p>
                          <p className="my-orders__rejection-text">{motivoRechazo}</p>
                        </div>
                      )}

                      {isPaymentPending && (
                        <div className="my-orders__payment-pending">
                          <p className="my-orders__payment-pending-title">Pago pendiente</p>
                          <p className="my-orders__payment-pending-text">
                            El pedido fue creado, pero el pago todavia no quedo acreditado.
                            Podes reintentarlo o cancelarlo.
                          </p>
                        </div>
                      )}

                      {order.status === 'pending' && (
                        <div className="my-orders__actions">
                          {canRetryPayment && (
                            <button
                              type="button"
                              className="panel-btn panel-btn--primary my-orders__action-btn"
                              onClick={() => handleRetryPayment(order.id)}
                              disabled={isRetryingPayment || isCancellingOrder}
                            >
                              {isRetryingPayment ? 'Redirigiendo...' : 'Reintentar pago'}
                            </button>
                          )}

                          <button
                            type="button"
                            className="panel-btn panel-btn--danger my-orders__action-btn"
                            onClick={() => handleCancel(order.id)}
                            disabled={isRetryingPayment || isCancellingOrder}
                          >
                            {isCancellingOrder ? 'Cancelando...' : 'Cancelar pedido'}
                          </button>
                        </div>
                      )}

                      {['confirmed', 'delivered'].includes(order.status) && (
                        <div className="my-orders__actions">
                          {meta.claim ? (
                            <p className="my-orders__claim-status">
                              Reclamo presentado ({meta.claim.status === 'resolved' ? 'atendido' : 'pendiente'})
                            </p>
                          ) : meta.claimLookupError ? (
                            <p
                              className="my-orders__claim-status my-orders__claim-status--warning"
                              role="status"
                            >
                              No pudimos verificar el estado del reclamo: {meta.claimLookupError}
                            </p>
                          ) : (
                            <button
                              type="button"
                              className="panel-btn panel-btn--outline my-orders__action-btn"
                              onClick={() => setClaimingId(order.id)}
                              disabled={submittingClaimId !== null}
                            >
                              Realizar reclamo
                            </button>
                          )}

                          <button
                            type="button"
                            className="panel-btn panel-btn--outline my-orders__action-btn"
                            onClick={() => handleOpenRating(order)}
                          >
                            {meta.rated ? 'Editar calificacion del local' : 'Calificar local'}
                          </button>
                        </div>
                      )}
                    </div>

                    {['confirmed', 'delivered'].includes(order.status) &&
                      claimingId === order.id &&
                      !meta.claim &&
                      !meta.claimLookupError && (
                        <ClaimForm
                          key={order.id}
                          orderId={order.id}
                          onSubmit={handleClaim}
                          onCancel={() => setClaimingId(null)}
                          isSubmitting={submittingClaimId === order.id}
                        />
                      )}
                  </article>
                )
              })}
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
