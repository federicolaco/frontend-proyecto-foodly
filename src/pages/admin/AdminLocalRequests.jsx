import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { approveLocalRequest, getPendingLocalRequests, rejectLocalRequest } from '../../api/admin'
import { OrdersNavbar } from '../../components/OrdersNavbar'
import { formatDate } from '../../lib/format'
import '../Panel.css'

export function AdminLocalRequests() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [processingId, setProcessingId] = useState(null)

  const loadRequests = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getPendingLocalRequests()
      setRequests(data)
    } catch (err) {
      setError(err.message ?? 'No pudimos cargar las solicitudes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const handleResolve = async (requestId, action) => {
    const label = action === 'approve' ? 'aprobar' : 'rechazar'
    if (!window.confirm(`¿Confirma que desea ${label} esta solicitud?`)) return

    setProcessingId(requestId)
    setMessage(null)
    setError(null)

    try {
      if (action === 'approve') {
        await approveLocalRequest(requestId)
        setMessage('Solicitud aprobada. El local fue habilitado.')
      } else {
        await rejectLocalRequest(requestId)
        setMessage('Solicitud rechazada.')
      }
      await loadRequests()
    } catch (err) {
      setError(err.message ?? 'No se pudo resolver la solicitud.')
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

        <nav className="panel-nav">
          <Link to="/admin/solicitudes" className="panel-nav__link panel-nav__link--active">
            Solicitudes pendientes
          </Link>
        </nav>

        {error && (
          <p className="panel-page__error" role="alert">
            {error}
          </p>
        )}
        {message && <p className="panel-page__success">{message}</p>}

        <section className="panel-card">
          {loading && <p className="panel-empty">Cargando solicitudes...</p>}

          {!loading && requests.length === 0 && (
            <p className="panel-empty">No hay solicitudes pendientes de revisión.</p>
          )}

          {!loading && requests.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table className="panel-table">
                <thead>
                  <tr>
                    <th>Local</th>
                    <th>Correo</th>
                    <th>Dirección</th>
                    <th>Descripción</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td>{request.name}</td>
                      <td>{request.email}</td>
                      <td>{request.address}</td>
                      <td>{request.description.slice(0, 80)}...</td>
                      <td>{formatDate(request.createdAt)}</td>
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

        <p style={{ marginTop: '1rem' }}>
          <button type="button" className="panel-btn panel-btn--outline" onClick={() => navigate(-1)}>
            Volver
          </button>
        </p>
      </main>
    </div>
  )
}
