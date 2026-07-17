import { useEffect, useState, useMemo } from 'react'
import { confirmOrder, getLocalOrders, rejectOrder } from '../../api/localPanel'
import { usePolling } from '../../hooks/usePolling'
import { formatPrice } from '../../lib/cart'
import { formatDateTime } from '../../lib/format'
import { ORDER_STATUS_LABELS } from '../../lib/roles'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../context/ConfirmContext'
import { Pagination } from '../../components/Pagination'
import '../Panel.css'

const REJECTION_REASONS = [
  'Falta de stock',
  'Cierre anticipado',
  'Demasiados pedidos',
  'Otro',
]
const CUSTOM_REJECTION_REASON = 'Otro'

function ConfirmOrderForm({ orderId, onConfirm, onCancel, isSubmitting }) {
  const [deliveryMinutes, setDeliveryMinutes] = useState('')

  const resetDraft = () => {
    setDeliveryMinutes('')
  }

  const handleCancel = () => {
    resetDraft()
    onCancel()
  }

  const handleSubmit = () => {
    onConfirm({
      orderId,
      deliveryMinutes,
      resetDraft,
    })
  }

  return (
    <>
      <input
        type="number"
        min="1"
        placeholder="Minutos de entrega"
        className="panel-field__input"
        style={{ maxWidth: '160px' }}
        value={deliveryMinutes}
        onChange={(e) => setDeliveryMinutes(e.target.value)}
        disabled={isSubmitting}
      />
      <button
        type="button"
        className="panel-btn panel-btn--primary"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Confirmando...' : 'Confirmar'}
      </button>
      <button
        type="button"
        className="panel-btn panel-btn--outline"
        onClick={handleCancel}
        disabled={isSubmitting}
      >
        Cancelar
      </button>
    </>
  )
}

function RejectOrderForm({ orderId, onReject, onCancel, isSubmitting }) {
  const [rejectReason, setRejectReason] = useState('')
  const [customRejectReason, setCustomRejectReason] = useState('')

  const resetDraft = () => {
    setRejectReason('')
    setCustomRejectReason('')
  }

  const getEffectiveRejectReason = () => {
    if (rejectReason === CUSTOM_REJECTION_REASON) {
      return customRejectReason.trim()
    }

    return rejectReason.trim()
  }

  const handleCancel = () => {
    resetDraft()
    onCancel()
  }

  const handleRejectReasonChange = (value) => {
    setRejectReason(value)

    if (value !== CUSTOM_REJECTION_REASON) {
      setCustomRejectReason('')
    }
  }

  const handleSubmit = () => {
    onReject({
      orderId,
      reason: getEffectiveRejectReason(),
      resetDraft,
    })
  }

  return (
    <>
      <select
        className="panel-field__select"
        value={rejectReason}
        onChange={(e) => handleRejectReasonChange(e.target.value)}
        disabled={isSubmitting}
      >
        <option value="">Seleccionar motivo</option>
        {REJECTION_REASONS.map((reason) => (
          <option key={reason} value={reason}>{reason}</option>
        ))}
      </select>
      {rejectReason === CUSTOM_REJECTION_REASON && (
        <textarea
          className="panel-field__textarea"
          rows="3"
          placeholder="Escriba el motivo del rechazo"
          value={customRejectReason}
          onChange={(e) => setCustomRejectReason(e.target.value)}
          disabled={isSubmitting}
        />
      )}
      <button
        type="button"
        className="panel-btn panel-btn--danger"
        disabled={!getEffectiveRejectReason() || isSubmitting}
        onClick={handleSubmit}
      >
        {isSubmitting ? 'Rechazando...' : 'Rechazar'}
      </button>
      <button
        type="button"
        className="panel-btn panel-btn--outline"
        onClick={handleCancel}
        disabled={isSubmitting}
      >
        Cancelar
      </button>
    </>
  )
}

function getOrderBadgeVariant(status) {
  if (status === 'pending') return 'pending'
  if (status === 'confirmed') return 'confirmed'
  if (status === 'delivered') return 'delivered'
  return 'closed'
}

export function LocalOrdersPage() {
 const [orders, setOrders] = useState([])
  const [statusFilter, setStatusFilter] = useState('pending')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [sort, setSort] = useState('date-desc')
  const [loading, setLoading] = useState(true)
  const [confirmingId, setConfirmingId] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const [processingAction, setProcessingAction] = useState(null)
  const [processingOrderId, setProcessingOrderId] = useState(null)
  const toast = useToast()
  const confirmDialog = useConfirm()

const loadOrders = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const { items, totalPages: tp } = await getLocalOrders({
        ...(statusFilter ? { status: statusFilter } : {}),
        page,
      })
      setOrders(items)
      setTotalPages(tp)
    } catch (err) {
      if (!silent) toast.error(err.message ?? 'No pudimos cargar los pedidos.')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    setPage(0)
  }, [statusFilter])

  usePolling(loadOrders, 3000, [statusFilter, page])

  const sortedOrders = useMemo(() => {
    const [field, dir] = sort.split('-')
    return [...orders].sort((a, b) => {
      const aVal = field === 'date' ? new Date(a.createdAt).getTime() : a.total
      const bVal = field === 'date' ? new Date(b.createdAt).getTime() : b.total
      return dir === 'asc' ? aVal - bVal : bVal - aVal
    })
  }, [orders, sort])

  const resetRejectState = () => {
    setRejectingId(null)
  }

  const handleOpenReject = (orderId) => {
    setConfirmingId(null)
    setRejectingId(orderId)
  }

  const handleConfirm = async ({ orderId, deliveryMinutes, resetDraft }) => {
    if (!deliveryMinutes || Number(deliveryMinutes) <= 0) {
      toast.error('Debe ingresar el tiempo estimado de entrega para confirmar el pedido.')
      return
    }
    const confirmed = await confirmDialog({
      title: 'Confirmar pedido',
      message: 'Se simulará el pago y se generará la factura. ¿Confirma el pedido?',
      confirmText: 'Confirmar',
    })
    if (!confirmed) return

    setProcessingAction('confirm')
    setProcessingOrderId(orderId)

    try {
      await confirmOrder(orderId, deliveryMinutes)
      toast.success('Pedido confirmado. Factura generada y cliente notificado.')
      resetDraft()
      setConfirmingId(null)
      await loadOrders()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setProcessingAction(null)
      setProcessingOrderId(null)
    }
  }

  const handleReject = async ({ orderId, reason, resetDraft }) => {
    if (!reason) {
      toast.error('Debe seleccionar o escribir un motivo de rechazo antes de continuar.')
      return
    }
    const confirmedReject = await confirmDialog({
      title: 'Rechazar pedido',
      message: '¿Confirma el rechazo del pedido?',
      confirmText: 'Rechazar',
      variant: 'danger',
    })
    if (!confirmedReject) return

    setProcessingAction('reject')
    setProcessingOrderId(orderId)

    try {
      await rejectOrder(orderId, reason)
      toast.success('Pedido rechazado. Cliente notificado.')
      resetDraft()
      resetRejectState()
      await loadOrders()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setProcessingAction(null)
      setProcessingOrderId(null)
    }
  }

  return (
    <>
      <section className="panel-card">
        <div className="panel-actions" style={{ marginBottom: '1rem', justifyContent: 'space-between' }}>

          {}
          <label className="panel-field" style={{ minWidth: '200px' }}>
            <span className="panel-field__label">Filtrar por estado</span>
            <select
              className="panel-field__select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="pending">Pendiente</option>
              <option value="">Todos</option>
              <option value="confirmed">Confirmado</option>
              <option value="delivered">Entregado</option>
              <option value="rejected">Rechazado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </label>

          {}
          <label className="panel-field" style={{ minWidth: '220px' }}>
            <span className="panel-field__label">Ordenar por</span>
            <select
              className="panel-field__select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Ordenar resultados"
            >
              <option value="date-desc">Fecha: más reciente primero</option>
              <option value="date-asc">Fecha: más antigua primero</option>
              <option value="amount-asc">Precio: menor a mayor</option>
              <option value="amount-desc">Precio: mayor a menor</option>
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
                  <strong>Pedido (ID {order.id})</strong>
                  <span className={`panel-badge panel-badge--${getOrderBadgeVariant(order.status)}`}>
                    {ORDER_STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>

                <p>Cliente: {order.clientName}</p>
                {order.clientPhone && <p>Teléfono: {order.clientPhone}</p>}
                <p>Total: {formatPrice(order.total)}</p>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <p style={{ margin: 0 }}>Fecha: {formatDateTime(order.createdAt)}</p>

                  {order.status === 'pending' && (
                    <div className="panel-actions" style={{ margin: 0, justifyContent: 'flex-end' }}>
                      {confirmingId === order.id ? (
                        <ConfirmOrderForm
                          key={`confirm-${order.id}`}
                          orderId={order.id}
                          onConfirm={handleConfirm}
                          onCancel={() => setConfirmingId(null)}
                          isSubmitting={processingAction === 'confirm' && processingOrderId === order.id}
                        />
                      ) : rejectingId === order.id ? (
                        <RejectOrderForm
                          key={`reject-${order.id}`}
                          orderId={order.id}
                          onReject={handleReject}
                          onCancel={resetRejectState}
                          isSubmitting={processingAction === 'reject' && processingOrderId === order.id}
                        />
                      ) : (
                        <>
                          <button
                            type="button"
                            className="panel-btn panel-btn--primary"
                            onClick={() => { setConfirmingId(order.id); setRejectingId(null) }}
                            disabled={processingOrderId !== null}
                          >
                            Confirmar pedido
                          </button>
                          <button
                            type="button"
                            className="panel-btn panel-btn--danger"
                            onClick={() => handleOpenReject(order.id)}
                            disabled={processingOrderId !== null}
                          >
                            Rechazar pedido
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <ul style={{ margin: '0.5rem 0', paddingLeft: '1.25rem' }}>
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.quantity}x {item.name} — {formatPrice(item.price * item.quantity)}
                    </li>
                  ))}
                </ul>

                {['confirmed', 'delivered'].includes(order.status) && order.deliveryMinutes && (
                  <p>Entrega estimada: {order.deliveryMinutes} minutos</p>
                )}
                {order.status === 'rejected' && order.rejectionReason && (
                  <p>Motivo: {order.rejectionReason}</p>
                )}
              </article>
            ))}
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </section>
    </>
  )
}
