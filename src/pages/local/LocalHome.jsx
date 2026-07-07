import { useEffect, useState } from 'react'
import { closeLocal, getMyLocal, openLocal } from '../../api/localPanel'
import { getLocalRatingDetails, getLocalRatingSummary } from '../../api/ratings'
import { formatDate } from '../../lib/format'
import '../Account.css'
import '../Panel.css'

export function LocalHome() {
  const [restaurant, setRestaurant] = useState(null)
  const [rating, setRating] = useState(null)
  const [ratingDetails, setRatingDetails] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)

    try {
      const [data, ratingData, ratingDetailsData] = await Promise.all([
        getMyLocal(),
        getLocalRatingSummary(),
        getLocalRatingDetails().catch(() => []),
      ])
      setRestaurant(data)
      setRating(ratingData)
      setRatingDetails(ratingDetailsData)
    } catch (err) {
      setError(err.message ?? 'No pudimos cargar la información del local.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleOpen = async () => {
    if (!window.confirm('¿Confirma que desea abrir el local?')) return
    setBusy(true)
    setMessage(null)
    setError(null)

    try {
      const data = await openLocal()
      setRestaurant(data)
      setMessage('El local está abierto y visible para recibir pedidos.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleClose = async () => {
    const pending = restaurant?.pendingOrdersOnClose
    const warning =
      pending > 0
        ? `Tiene ${pending} pedido(s) pendiente(s) de confirmación. ¿Desea cerrar el local de todas formas?`
        : '¿Confirma que desea cerrar el local?'

    if (!window.confirm(warning)) return

    setBusy(true)
    setMessage(null)
    setError(null)

    try {
      const data = await closeLocal()
      setRestaurant(data)
      setMessage('El local fue cerrado. No aceptará nuevos pedidos.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p className="panel-empty">Cargando...</p>

  return (
    <section className="panel-card">
      {error && (
        <p className="panel-page__error" role="alert">
          {error}
        </p>
      )}
      {message && <p className="panel-page__success">{message}</p>}

      {restaurant && (
        <>
          <div className="panel-home-grid">
            <div className="panel-home-box">
              <h2 style={{ marginBottom: '0.5rem', color: 'var(--gris-oscuro)' }}>{restaurant.name}</h2>
              <p style={{ marginBottom: '1rem' }}>
                Estado:{' '}
                <span className={`panel-badge ${restaurant.isOpen ? 'panel-badge--open' : 'panel-badge--closed'}`}>
                  {restaurant.isOpen ? 'Abierto' : 'Cerrado'}
                </span>
              </p>

              <div className="panel-actions">
                <button
                  type="button"
                  className="panel-btn panel-btn--primary"
                  disabled={busy || restaurant.isOpen}
                  onClick={handleOpen}
                >
                  Abrir local
                </button>
                <button
                  type="button"
                  className="panel-btn panel-btn--danger"
                  disabled={busy || !restaurant.isOpen}
                  onClick={handleClose}
                >
                  Cerrar local
                </button>
              </div>
            </div>

            <div className="panel-home-box">
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--gris-oscuro)' }}>Mi calificación</h3>
              {rating?.total === 0 ? (
                <p className="panel-empty" style={{ padding: 0 }}>Su local todavía no ha recibido calificaciones de los clientes.</p>
              ) : (
                <>
                  <p><strong>{rating.average}</strong> / 5 · {rating.total} valoraciones</p>
                  <div className="rating-summary">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <div key={star} className="rating-summary__row">
                        <span>{star}★</span>
                        <div className="rating-summary__bar">
                          <div
                            className="rating-summary__fill"
                            style={{ width: `${rating.total ? (rating.breakdown[star] / rating.total) * 100 : 0}%` }}
                          />
                        </div>
                        <span>{rating.breakdown[star] ?? 0}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {ratingDetails.length > 0 && (
            <div className="rating-comments" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
              <h3 className="panel-page__subtitle">Comentarios de los clientes</h3>
              <div className="rating-comments__list">
                {ratingDetails.map((r, i) => (
                  <article key={`${r.clientId}-${i}`} className="rating-comments__item">
                    <div className="panel-actions">
                      <strong>{r.clientName}</strong>
                      <span className="panel-badge">{r.score} ★</span>
                    </div>
                    {r.comment && <p className="rating-comments__text">{r.comment}</p>}
                    {r.createdAt && (
                      <p className="rating-comments__date">
                        {formatDate(r.createdAt)}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
