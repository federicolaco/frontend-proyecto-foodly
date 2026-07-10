import { useEffect, useMemo, useState } from 'react'
import { getLocalClaims, resolveClaim } from '../../api/claims'
import { formatPrice } from '../../lib/cart'
import { getStoredUser } from '../../lib/auth'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../context/ConfirmContext'
import { Pagination } from '../../components/Pagination'
import '../Panel.css'

const RESOLUTION_TYPES = [
  { id: 'reintegro', label: 'Reintegro del monto' },
  { id: 'compensacion', label: 'Compensación alternativa' },
]

export function LocalClaims() {
 const [claims, setClaims] = useState([])
  const [statusFilter, setStatusFilter] = useState('pending')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [sort, setSort] = useState('name-asc')
  const [loading, setLoading] = useState(true)
  const [resolvingId, setResolvingId] = useState(null)
  const toast = useToast()
  const confirm = useConfirm()
  const [resolutionType, setResolutionType] = useState(RESOLUTION_TYPES[0].id)
  const [resolutionNote, setResolutionNote] = useState('')

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

  useEffect(() => { load() }, [statusFilter, page])

  const sortedClaims = useMemo(() => {
    const [field, dir] = sort.split('-')
    return [...claims].sort((a, b) => {
      if (field === 'name') {
        const cmp = (a.clientName ?? '').localeCompare(b.clientName ?? '')
        return dir === 'asc' ? cmp : -cmp
      }
      const aVal = a.amount
      const bVal = b.amount
      return dir === 'asc' ? aVal - bVal : bVal - aVal
    })
  }, [claims, sort])

  const handleResolve = async (claimId) => {
    if (!resolutionType) {
      toast.error('Debe seleccionar el tipo de resolución antes de confirmar.')
      return
    }
    const confirmed = await confirm({
      title: 'Resolver reclamo',
      message: '¿Confirma la resolución del reclamo?',
      confirmText: 'Confirmar',
    })
    if (!confirmed) return

    try {
      await resolveClaim(claimId, { type: resolutionType, note: resolutionNote })
      toast.success('Reclamo atendido. Cliente notificado.')
      setResolvingId(null)
      setResolutionNote('')
      await load()
    } catch (err) {
      toast.error(err.message)
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
              <option value="resolved">Atendido</option>
              <option value="">Todos</option>
            </select>
          </label>

          <label className="panel-field" style={{ minWidth: '220px' }}>
            <span className="panel-field__label">Ordenar por</span>
            <select className="panel-field__select" value={sort} onChange={(e) => setSort(e.target.value)}>
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
                  <span className={`panel-badge panel-badge--${claim.status === 'pending' ? 'pending' : 'confirmed'}`}>
                    {claim.status === 'pending' ? 'Pendiente' : 'Atendido'}
                  </span>
                </div>
                <p>Cliente: {claim.clientName}</p>
                <p>Motivo: {claim.reason}</p>
                <p>Compensación solicitada: {claim.compensationType}</p>
                <p>Monto: {formatPrice(claim.amount)}</p>

                {claim.status === 'pending' && (
                  resolvingId === claim.id ? (
                    <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.5rem' }}>
                      <select className="panel-field__select" value={resolutionType} onChange={(e) => setResolutionType(e.target.value)}>
                        {RESOLUTION_TYPES.map((t) => (
                          <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                      </select>
                      <textarea className="panel-field__textarea" rows={2} placeholder="Nota (opcional)" value={resolutionNote} onChange={(e) => setResolutionNote(e.target.value)} />
                      <div className="panel-actions">
                        <button type="button" className="panel-btn panel-btn--primary" onClick={() => handleResolve(claim.id)}>Confirmar resolución</button>
                        <button type="button" className="panel-btn panel-btn--outline" onClick={() => setResolvingId(null)}>Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" className="panel-btn panel-btn--primary" style={{ marginTop: '0.5rem' }} onClick={() => setResolvingId(claim.id)}>
                      Atender reclamo
                    </button>
                  )
                )}

                {claim.status === 'resolved' && claim.resolutionType && (
                  <p>Resolución: {claim.resolutionType} {claim.resolutionNote && `— ${claim.resolutionNote}`}</p>
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
