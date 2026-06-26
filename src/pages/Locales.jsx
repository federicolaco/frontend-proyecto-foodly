import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPopularRestaurants } from '../api/orders'
import { buildRestaurantPath } from '../api/restaurant'
import { OrdersNavbar } from '../components/OrdersNavbar'
import './Orders.css'
import './Panel.css'

export function Locales() {
  const navigate = useNavigate()
  const [restaurants, setRestaurants] = useState([])
  const [search, setSearch] = useState('')
  const [openOnly, setOpenOnly] = useState(false)
  const [minRating, setMinRating] = useState('')
  const [sort, setSort] = useState('name')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getPopularRestaurants({
          search: search || undefined,
          openOnly,
          minRating: minRating || undefined,
          sort,
        })
        if (!cancelled) setRestaurants(data)
      } catch {
        if (!cancelled) setError('No pudimos cargar los locales.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 300)

    return () => { cancelled = true; clearTimeout(timer) }
  }, [search, openOnly, minRating, sort])

  return (
    <div className="orders-page">
      <OrdersNavbar />
      <main className="panel-page__main contenedor" style={{ paddingTop: '5.5rem' }}>
        <h1 className="panel-page__title">Locales</h1>
        {error && <p className="panel-page__error" role="alert">{error}</p>}

        <section className="panel-card" style={{ marginBottom: '1rem' }}>
          <div className="panel-form panel-form--grid">
            <label className="panel-field">
              <span className="panel-field__label">Buscar</span>
              <input className="panel-field__input" placeholder="Nombre o tipo de comida" value={search} onChange={(e) => setSearch(e.target.value)} />
            </label>
            <label className="panel-field">
              <span className="panel-field__label">Calificación mínima</span>
              <input type="number" min="0" max="5" step="0.1" className="panel-field__input" value={minRating} onChange={(e) => setMinRating(e.target.value)} />
            </label>
            <label className="panel-field">
              <span className="panel-field__label">Ordenar</span>
              <select className="panel-field__select" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="name">Nombre</option>
                <option value="rating">Calificación</option>
              </select>
            </label>
            <label className="panel-field" style={{ alignSelf: 'end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} />
                Solo abiertos
              </label>
            </label>
          </div>
        </section>

        <section className="panel-card">
          {loading && <p className="panel-empty">Cargando locales...</p>}
          {!loading && restaurants.length === 0 && (
            <p className="panel-empty">No se encontraron locales que coincidan con su búsqueda.</p>
          )}
          {!loading && restaurants.length > 0 && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {restaurants.map((r) => (
                <article key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #eee', borderRadius: '0.75rem', padding: '1rem' }}>
                  <div>
                    <strong>{r.name}</strong>
                    <p style={{ margin: '0.25rem 0', color: 'var(--gris-intermedio)' }}>{r.foodType}</p>
                    <p>
                      <span className={`panel-badge ${r.isOpen ? 'panel-badge--open' : 'panel-badge--closed'}`}>
                        {r.isOpen ? 'Abierto' : 'Cerrado'}
                      </span>
                      {' '}· {r.rating?.toFixed(1) ?? '—'} ★
                    </p>
                  </div>
                  <button
                    type="button"
                    className="panel-btn panel-btn--primary"
                    disabled={!r.isOpen}
                    onClick={() => navigate(buildRestaurantPath(r.id))}
                  >
                    Ver menú
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
