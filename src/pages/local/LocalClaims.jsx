import { useEffect, useState } from 'react'
import { getLocalClaims, resolveClaim } from '../../api/claims'
import { formatPrice } from '../../lib/cart'
import { getStoredUser } from '../../lib/auth'
import '../Panel.css'

const RESOLUTION_TYPES = [
  { id: 'reintegro', label: 'Reintegro del monto' },
  { id: 'compensacion', label: 'Compensación alternativa' },
]

export function LocalClaims() {
  const [claims, setClaims] = useState([])
  const [statusFilter, setStatusFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [resolvingId, setResolvingId] = useState(null)
  const [resolutionType, setResolutionType] = useState(RESOLUTION_TYPES[0].id)
  const [resolutionNote, setResolutionNote] = useState('')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const user = getStoredUser()
      const data = await getLocalClaims({
        status: statusFilter || undefined,   
        localId: user?.localId ?? user?.restaurantId ?? user?.id
      })
      setClaims(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [statusFilter])

  const handleResolve = async (claimId) => {
    if (!resolutionType) {
      setError('Debe seleccionar el tipo de resolución antes de confirmar.')
      return
    }
    if (!window.confirm('¿Confirma la resolución del reclamo?')) return

    setError(null)
    setMessage(null)
    try {
      await resolveClaim(claimId, { type: resolutionType, note: resolutionNote })
      setMessage('Reclamo atendido. Cliente notificado.')
      setResolvingId(null)
      setResolutionNote('')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      {error && <p className="panel-page__error" role="alert">{error}</p>}
      {message && <p className="panel-page__success">{message}</p>}

      <section className="panel-card">
        <label className="panel-field" style={{ maxWidth: '220px', marginBottom: '1rem' }}>
          <span className="panel-field__label">Estado</span>
          <select className="panel-field__select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="pending">Pendiente</option>
            <option value="resolved">Atendido</option>
            <option value="">Todos</option>
          </select>
        </label>

        {loading && <p className="panel-empty">Cargando reclamos...</p>}
        {!loading && claims.length === 0 && (
          <p className="panel-empty">No se encontraron reclamos que coincidan con los criterios seleccionados.</p>
        )}

        {!loading && claims.length > 0 && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {claims.map((claim) => (
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
          </div>
        )}
      </section>
    </>
  )
}
