import { useEffect, useMemo, useState } from 'react'
import { getLocalClaims, resolveClaim } from '../../api/claims'
import { formatPrice } from '../../lib/cart'
import { getStoredUser } from '../../lib/auth'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../context/ConfirmContext'
import { Pagination } from '../../components/Pagination'
import '../Panel.css'

const COMPENSATION_TYPES = [
  { id: 'reintegro', label: 'Reintegro del monto' },
  { id: 'compensacion', label: 'Compensación alternativa' },
]

const RESOLUTION_STATUS_OPTIONS = [
  { id: 'attended', label: 'Atendido' },
  { id: 'rejected', label: 'Rechazado' },
]

function getClaimStatusLabel(status) {
  if (status === 'attended') return 'Atendido'
  if (status === 'rejected') return 'Rechazado'
  return 'Pendiente'
}

function getClaimBadgeVariant(status) {
  if (status === 'attended') return 'confirmed'
  if (status === 'rejected') return 'closed'
  return 'pending'
}

function ResolveClaimForm({
  claimId,
  onResolve,
  onCancel,
  isSubmitting,
  initialStatus = 'attended',
}) {
  const [resolutionStatus, setResolutionStatus] = useState(initialStatus)
  const [compensationType, setCompensationType] = useState(COMPENSATION_TYPES[0].id)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    setResolutionStatus(initialStatus)
  }, [initialStatus])

  const resetDraft = () => {
    setResolutionStatus(initialStatus)
    setCompensationType(COMPENSATION_TYPES[0].id)
    setRejectionReason('')
  }

  const handleCancel = () => {
    resetDraft()
    onCancel()
  }

  const handleSubmit = () => {
    onResolve({
      claimId,
      resolutionStatus,
      compensationType,
      rejectionReason,
      resetDraft,
    })
  }

  return (
    <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.5rem' }}>
      <select
        className="panel-field__select"
        value={resolutionStatus}
        onChange={(e) => setResolutionStatus(e.target.value)}
        disabled={isSubmitting}
      >
        {RESOLUTION_STATUS_OPTIONS.map((status) => (
          <option key={status.id} value={status.id}>{status.label}</option>
        ))}
      </select>

      {resolutionStatus === 'attended' && (
        <select
          className="panel-field__select"
          value={compensationType}
          onChange={(e) => setCompensationType(e.target.value)}
          disabled={isSubmitting}
        >
          {COMPENSATION_TYPES.map((type) => (
            <option key={type.id} value={type.id}>{type.label}</option>
          ))}
        </select>
      )}

      {resolutionStatus === 'rejected' && (
        <textarea
          className="panel-field__textarea"
          rows={3}
          placeholder="Motivo del rechazo"
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          disabled={isSubmitting}
        />
      )}

      <div className="panel-actions">
        <button
          type="button"
          className="panel-btn panel-btn--primary"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Confirmando...' : 'Confirmar resolución'}
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

export function LocalClaims() {
  const [claims, setClaims] = useState([])
  const [statusFilter, setStatusFilter] = useState('pending')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [sort, setSort] = useState('id-asc')
  const [loading, setLoading] = useState(true)
  const [resolvingClaim, setResolvingClaim] = useState(null)
  const [submittingResolutionId, setSubmittingResolutionId] = useState(null)
  const toast = useToast()
  const confirm = useConfirm()

  const load = async () => {
    setLoading(true)
    try {
      const user = getStoredUser()
      const { items, totalPages: tp } = await getLocalClaims({
        status: statusFilter || undefined,
        localId: user?.localId ?? user?.restaurantId ?? user?.id,
        page,
      })
      setClaims(items)
      setTotalPages(tp)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(0)
  }, [statusFilter])

  useEffect(() => {
    load()
  }, [statusFilter, page])

  const sortedClaims = useMemo(() => {
    const [field, dir] = sort.split('-')
    return [...claims].sort((a, b) => {
      if (field === 'id') {
        const cmp = Number(a.id) - Number(b.id)
        return dir === 'asc' ? cmp : -cmp
      }
      if (field === 'name') {
        const cmp = (a.clientName ?? '').localeCompare(b.clientName ?? '')
        return dir === 'asc' ? cmp : -cmp
      }
      const aVal = a.amount
      const bVal = b.amount
      return dir === 'asc' ? aVal - bVal : bVal - aVal
    })
  }, [claims, sort])

  const handleResolve = async ({
    claimId,
    resolutionStatus,
    compensationType,
    rejectionReason,
    resetDraft,
  }) => {
    if (resolutionStatus === 'attended' && !compensationType) {
      toast.error('Debe seleccionar el tipo de compensación antes de confirmar.')
      return
    }

    if (resolutionStatus === 'rejected' && !rejectionReason.trim()) {
      toast.error('Debe ingresar un motivo de rechazo.')
      return
    }

    const confirmed = await confirm({
      title: resolutionStatus === 'attended' ? 'Atender reclamo' : 'Rechazar reclamo',
      message:
        resolutionStatus === 'attended'
          ? '¿Confirma que desea atender este reclamo?'
          : '¿Confirma que desea rechazar este reclamo?',
      confirmText: 'Confirmar',
    })
    if (!confirmed) return

    setSubmittingResolutionId(claimId)

    try {
      await resolveClaim(claimId, {
        status: resolutionStatus,
        compensationType,
        rejectionReason,
      })
      toast.success(
        resolutionStatus === 'attended'
          ? 'Reclamo atendido. Cliente notificado.'
          : 'Reclamo rechazado. Cliente notificado.',
      )
      resetDraft()
      setResolvingClaim(null)
      await load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmittingResolutionId(null)
    }
  }

  return (
    <>
      <section className="panel-card">
        <div className="panel-actions" style={{ marginBottom: '1rem', justifyContent: 'space-between' }}>
          <label className="panel-field" style={{ maxWidth: '220px' }}>
            <span className="panel-field__label">Estado</span>
            <select className="panel-field__select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="pending">Pendiente</option>
              <option value="attended">Atendido</option>
              <option value="rejected">Rechazado</option>
              <option value="">Todos</option>
            </select>
          </label>

          <label className="panel-field" style={{ minWidth: '220px' }}>
            <span className="panel-field__label">Ordenar por</span>
            <select className="panel-field__select" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="id-asc">ID: menor a mayor</option>
              <option value="id-desc">ID: mayor a menor</option>
              <option value="name-asc">Nombre: A-Z</option>
              <option value="name-desc">Nombre: Z-A</option>
              <option value="amount-asc">Monto: menor a mayor</option>
              <option value="amount-desc">Monto: mayor a menor</option>
            </select>
          </label>
        </div>

        {loading && <p className="panel-empty">Cargando reclamos...</p>}
        {!loading && sortedClaims.length === 0 && (
          <p className="panel-empty">No se encontraron reclamos que coincidan con los criterios seleccionados.</p>
        )}

        {!loading && sortedClaims.length > 0 && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {sortedClaims.map((claim) => (
              <article key={claim.id} style={{ border: '1px solid #eee', borderRadius: '0.75rem', padding: '1rem' }}>
                <div className="panel-actions" style={{ justifyContent: 'space-between' }}>
                  <strong>Reclamo (ID {claim.id}) — Pedido (ID {claim.orderId})</strong>
                  <span className={`panel-badge panel-badge--${getClaimBadgeVariant(claim.status)}`}>
                    {getClaimStatusLabel(claim.status)}
                  </span>
                </div>
                <p>Cliente: {claim.clientName}</p>
                <p>Motivo: {claim.reason}</p>
                <p>Compensación solicitada: {claim.compensationType ?? 'No especificada'}</p>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <p style={{ margin: 0 }}>Monto: {formatPrice(claim.amount)}</p>

                  {claim.status === 'pending' && resolvingClaim?.claimId !== claim.id && (
                    <div className="panel-actions">
                      <button
                        type="button"
                        className="panel-btn panel-btn--primary"
                        onClick={() => setResolvingClaim({ claimId: claim.id, initialStatus: 'attended' })}
                        disabled={submittingResolutionId !== null}
                      >
                        Atender reclamo
                      </button>
                      <button
                        type="button"
                        className="panel-btn panel-btn--outline"
                        onClick={() => setResolvingClaim({ claimId: claim.id, initialStatus: 'rejected' })}
                        disabled={submittingResolutionId !== null}
                      >
                        Rechazar reclamo
                      </button>
                    </div>
                  )}
                </div>

                {claim.status === 'pending' && resolvingClaim?.claimId === claim.id && (
                  <ResolveClaimForm
                    key={`${claim.id}-${resolvingClaim.initialStatus}`}
                    claimId={claim.id}
                    onResolve={handleResolve}
                    onCancel={() => setResolvingClaim(null)}
                    isSubmitting={submittingResolutionId === claim.id}
                    initialStatus={resolvingClaim.initialStatus}
                  />
                )}

                {claim.status === 'attended' && claim.resolutionType && (
                  <p>Compensación aplicada: {claim.resolutionType}</p>
                )}

                {claim.status === 'rejected' && claim.rejectionReason && (
                  <p>Motivo del rechazo: {claim.rejectionReason}</p>
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
