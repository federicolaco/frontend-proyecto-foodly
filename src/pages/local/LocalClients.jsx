import { useEffect, useState } from 'react'
import { getLocalClients, rateClient } from '../../api/ratings'
import { StarRating } from '../../components/StarRating'
import { useToast } from '../../context/ToastContext'
import '../Panel.css'

export function LocalClients() {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [minRating, setMinRating] = useState(0)
  const [sortBy, setSortBy] = useState('name-asc')
  const [loading, setLoading] = useState(true)
  const [ratingClientId, setRatingClientId] = useState(null)
  const toast = useToast()
  const [score, setScore] = useState(5)
  const [comment, setComment] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await getLocalClients(search ? { search } : {})
      setClients(data)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(load, 300)
    return () => clearTimeout(timer)
  }, [search])


  const hasExistingRating = (client) =>
    Boolean(client.alreadyRated) || client.myScore != null || (client.myComment && client.myComment.length > 0)

  const handleOpenRating = (client) => {
    setScore(client.myScore ?? 5)
    setComment(client.myComment ?? '')
    setRatingClientId(client.id)
  }

  const handleRate = async (clientId) => {
    try {
      await rateClient({ clientId, score, comment })
      toast.success('Calificación registrada.')
      setRatingClientId(null)
      setComment('')
      setScore(5)
      await load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const visibleClients = clients
    .filter((client) => (client.rating ?? 0) >= minRating)
    .sort((a, b) => {
      switch (sortBy) {
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'rating-desc':
          return (b.rating ?? 0) - (a.rating ?? 0)
        case 'rating-asc':
          return (a.rating ?? 0) - (b.rating ?? 0)
        case 'name-asc':
        default:
          return a.name.localeCompare(b.name)
      }
    })

  return (
    <>
      <section className="panel-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: '1rem',
            marginBottom: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <label className="panel-field" style={{ maxWidth: '280px', margin: 0 }}>
            <span className="panel-field__label">Buscar cliente</span>
            <input
              className="panel-field__input"
              placeholder="Nombre"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              marginLeft: 'auto',
            }}
          >
            <label className="panel-field" style={{ maxWidth: '180px', margin: 0 }}>
              <span className="panel-field__label">Calificación mínima</span>
              <select
                className="panel-field__input"
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
              >
                <option value={0}>Todas</option>
                <option value={4}>4+ estrellas</option>
                <option value={3}>3+ estrellas</option>
                <option value={2}>2+ estrellas</option>
                <option value={1}>1+ estrella</option>
              </select>
            </label>

            <label className="panel-field" style={{ maxWidth: '200px', margin: 0 }}>
              <span className="panel-field__label">Ordenar por</span>
              <select
                className="panel-field__input"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name-asc">Nombre (A-Z)</option>
                <option value="name-desc">Nombre (Z-A)</option>
                <option value="rating-desc">Calificación (mayor a menor)</option>
                <option value="rating-asc">Calificación (menor a mayor)</option>
              </select>
            </label>
          </div>
        </div>

        {loading && <p className="panel-empty">Cargando clientes...</p>}
        {!loading && clients.length === 0 && (
          <p className="panel-empty">Aún no tiene clientes registrados. Aparecerán aquí una vez que realicen su primer pedido.</p>
        )}
        {!loading && clients.length > 0 && visibleClients.length === 0 && (
          <p className="panel-empty">Ningún cliente coincide con los filtros seleccionados.</p>
        )}
        {!loading && visibleClients.length > 0 && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {visibleClients.map((client) => {
              const alreadyRated = hasExistingRating(client)
              return (
                <article key={client.id} style={{ border: '1px solid #eee', borderRadius: '0.75rem', padding: '1rem' }}>
                  <div className="panel-actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{client.name}</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span>Calificación global: {client.rating ? client.rating.toFixed(1) : '—'}</span>
                      {ratingClientId !== client.id && (
                        <button
                          type="button"
                          className="panel-btn panel-btn--outline"
                          onClick={() => handleOpenRating(client)}
                        >
                          {alreadyRated ? 'Editar calificación' : 'Calificar cliente'}
                        </button>
                      )}
                    </div>
                  </div>
                  {ratingClientId === client.id && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <StarRating value={score} onChange={setScore} />
                      <textarea
                        className="panel-field__textarea"
                        rows={2}
                        placeholder="Comentario (opcional)"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        style={{ marginTop: '0.5rem' }}
                      />
                      <div className="panel-actions panel-actions--center" style={{ marginTop: '0.5rem' }}>
                        <button type="button" className="panel-btn panel-btn--primary" onClick={() => handleRate(client.id)}>
                          Enviar calificación
                        </button>
                        <button type="button" className="panel-btn panel-btn--outline" onClick={() => setRatingClientId(null)}>
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
    </>
  )
}