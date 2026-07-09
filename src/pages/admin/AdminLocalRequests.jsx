import { useEffect, useMemo, useState } from 'react'
import { approveLocalRequest, getPendingLocalRequests, rejectLocalRequest } from '../../api/admin'
import { OrdersNavbar } from '../../components/OrdersNavbar'
import { useToast } from '../../context/ToastContext'
import '../Panel.css'

export function AdminLocalRequests() {
  const [requests, setRequests] = useState([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('name-asc')
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const toast = useToast()

  const loadRequests = async () => {
    setLoading(true)

    try {
      const data = await getPendingLocalRequests()
      setRequests(data)
    } catch (err) {
      toast.error(err.message ?? 'No pudimos cargar las solicitudes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const filteredRequests = useMemo(() => {
    const term = search.trim().toLowerCase()
    const filtered = term
      ? requests.filter(
          (r) =>
            r.name?.toLowerCase().includes(term) ||
            r.email?.toLowerCase().includes(term),
        )
      : requests

    const [, dir] = sort.split('-')
    return [...filtered].sort((a, b) => {
      const cmp = (a.name ?? '').localeCompare(b.name ?? '')
      return dir === 'asc' ? cmp : -cmp
    })
  }, [requests, search, sort])

  const handleResolve = async (requestId, action) => {
    const label = action === 'approve' ? 'aprobar' : 'rechazar'
    if (!window.confirm(`¿Confirma que desea ${label} esta solicitud?`)) return

    setProcessingId(requestId)

    try {
      if (action === 'approve') {
        await approveLocalRequest(requestId)
        toast.success('Solicitud aprobada. El local fue habilitado.')
      } else {
        await rejectLocalRequest(requestId)
        toast.success('Solicitud rechazada.')
      }
      await loadRequests()
    } catch (err) {
      toast.error(err.message ?? 'No se pudo resolver la solicitud.')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="panel-page">
      <OrdersNavbar />

      <main className="panel-page__main contenedor">
        <h1 className="panel-page__title">Solicitudes de Locales</h1>
        <p className="panel-page__subtitle">
          Revisá y resolvé las solicitudes de habilitación pendientes.
        </p>

        <div className="panel-actions" style={{ marginBottom: '1rem', justifyContent: 'space-between' }}>
          <label className="panel-field" style={{ minWidth: '260px' }}>
            <span className="panel-field__label">Buscar por nombre o correo</span>
            <input
              type="text"
              className="panel-field__input"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <label className="panel-field" style={{ minWidth: '220px' }}>
            <span className="panel-field__label">Ordenar por</span>
            <select className="panel-field__select" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="name-asc">Nombre: A-Z</option>
              <option value="name-desc">Nombre: Z-A</option>
            </select>
          </label>
        </div>

        <section className="panel-card">
          {loading && <p className="panel-empty">Cargando solicitudes...</p>}

          {!loading && filteredRequests.length === 0 && (
            <p className="panel-empty">No hay solicitudes pendientes de revisión.</p>
          )}

          {!loading && filteredRequests.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table className="panel-table">
                <thead>
                  <tr>
                    <th>Local</th>
                    <th>Correo</th>
                    <th>Dirección</th>
                    <th>Descripción</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id}>
                      <td>{request.name}</td>
                      <td>{request.email}</td>
                      <td>{request.address}</td>
                      <td>{request.description.slice(0, 80)}...</td>
                      <td>
                        <div className="panel-actions">
                          <button
                            type="button"
                            className="panel-btn panel-btn--primary"
                            disabled={processingId === request.id}
                            onClick={() => handleResolve(request.id, 'approve')}
                          >
                            Aprobar
                          </button>
                          <button
                            type="button"
                            className="panel-btn panel-btn--danger"
                            disabled={processingId === request.id}
                            onClick={() => handleResolve(request.id, 'reject')}
                          >
                            Rechazar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
