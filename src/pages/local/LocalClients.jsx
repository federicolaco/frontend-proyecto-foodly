import { useEffect, useState } from 'react'
import { getLocalClients, rateClient } from '../../api/ratings'
import { StarRating } from '../../components/StarRating'
import '../Panel.css'

export function LocalClients() {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [ratingClientId, setRatingClientId] = useState(null)
  const [score, setScore] = useState(5)
  const [comment, setComment] = useState('')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getLocalClients(search ? { search } : {})
      setClients(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(load, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleOpenRating = (client) => {
    setError(null)
    setMessage(null)
    setScore(client.myScore ?? 5)
    setComment(client.myComment ?? '')
    setRatingClientId(client.id)
  }

  const handleRate = async (clientId) => {
    setError(null)
    setMessage(null)
    try {
      await rateClient({ clientId, score, comment })
      setMessage('Calificación registrada.')
      setRatingClientId(null)
      setComment('')
      setScore(5)
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
        <label className="panel-field" style={{ maxWidth: '280px', marginBottom: '1rem' }}>
          <span className="panel-field__label">Buscar cliente</span>
          <input className="panel-field__input" placeholder="Nombre" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>

        {loading && <p className="panel-empty">Cargando clientes...</p>}
        {!loading && clients.length === 0 && (
          <p className="panel-empty">Aún no tiene clientes registrados. Aparecerán aquí una vez que realicen su primer pedido.</p>
        )}

        {!loading && clients.length > 0 && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {clients.map((client) => (
              <article key={client.id} style={{ border: '1px solid #eee', borderRadius: '0.75rem', padding: '1rem' }}>
                <div className="panel-actions" style={{ justifyContent: 'space-between' }}>
                  <strong>{client.name}</strong>
                  <span>Calificación global: {client.rating ? client.rating.toFixed(1) : '—'}</span>
                </div>

                {ratingClientId === client.id ? (
                  <div style={{ marginTop: '0.75rem' }}>
                    <StarRating value={score} onChange={setScore} />
                    <textarea className="panel-field__textarea" rows={2} placeholder="Comentario (opcional)" value={comment} onChange={(e) => setComment(e.target.value)} style={{ marginTop: '0.5rem' }} />
                    <div className="panel-actions" style={{ marginTop: '0.5rem' }}>
                      <button type="button" className="panel-btn panel-btn--primary" onClick={() => handleRate(client.id)}>Enviar calificación</button>
                      <button type="button" className="panel-btn panel-btn--outline" onClick={() => setRatingClientId(null)}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" className="panel-btn panel-btn--outline" style={{ marginTop: '0.5rem' }} onClick={() => handleOpenRating(client)}>
                    {client.alreadyRated ? 'Editar calificación' : 'Calificar cliente'}
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
