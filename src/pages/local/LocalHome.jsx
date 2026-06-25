import { useEffect, useState } from 'react'
import { closeLocal, getMyLocal, openLocal } from '../../api/localPanel'
import '../Panel.css'

export function LocalHome() {
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getMyLocal()
      setRestaurant(data)
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
        </>
      )}
    </section>
  )
}
