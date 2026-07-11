import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPopularRestaurants } from '../api/orders'
import { buildRestaurantPath } from '../api/restaurant'
import { OrdersNavbar } from '../components/OrdersNavbar'
import { useToast } from '../context/ToastContext'
import { Pagination } from '../components/Pagination'
import './Locales.css'
import './Orders.css'
import './Panel.css'

function RestaurantLogo({ name, logo }) {
  if (logo) {
    return (
      <img
        src={logo}
        alt=""
        className="locales-list__logo locales-list__logo--image"
        aria-hidden="true"
      />
    )
  }

  return (
    <span className="locales-list__logo locales-list__logo--fallback" aria-hidden="true">
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

export function Locales() {
  const navigate = useNavigate()
  const [restaurants, setRestaurants] = useState([])
  const [search, setSearch] = useState('')
  const [openOnly, setOpenOnly] = useState(false)
  const [minRating, setMinRating] = useState('')
  const [sort, setSort] = useState('name')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const toast = useToast()

  useEffect(() => {
    setPage(0)
  }, [search, openOnly, minRating, sort])

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const { items, totalPages: tp } = await getPopularRestaurants({
          search: search || undefined,
          openOnly,
          minRating: minRating || undefined,
          sort,
          page,
        })
        if (!cancelled) {
          setRestaurants(items)
          setTotalPages(tp)
        }
      } catch {
        if (!cancelled) toast.error('No pudimos cargar los locales.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [search, openOnly, minRating, sort, page])

  return (
    <div className="orders-page">
      <OrdersNavbar />
      <main className="panel-page__main contenedor" style={{ paddingTop: '5.5rem' }}>
        <h1 className="panel-page__title">Locales</h1>

        <section className="panel-card" style={{ marginBottom: '1rem' }}>
          <div className="panel-form panel-form--grid">
            <label className="panel-field">
              <span className="panel-field__label">Buscar</span>
              <input className="panel-field__input" placeholder="Nombre" value={search} onChange={(e) => setSearch(e.target.value)} />
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
            <label className="panel-field locales-filter__toggle-field">
              <span className="panel-field__label">Disponibilidad</span>
              <span className="locales-filter__toggle">
                <input
                  type="checkbox"
                  className="locales-filter__toggle-input"
                  checked={openOnly}
                  onChange={(e) => setOpenOnly(e.target.checked)}
                />
                <span className="locales-filter__toggle-track" aria-hidden="true">
                  <span className="locales-filter__toggle-thumb" />
                </span>
                <span className="locales-filter__toggle-text">Solo abiertos</span>
              </span>
            </label>
          </div>
        </section>

        <section className="panel-card">
          {loading && <p className="panel-empty">Cargando locales...</p>}
          {!loading && restaurants.length === 0 && (
            <p className="panel-empty">No se encontraron locales que coincidan con su búsqueda.</p>
          )}
          {!loading && restaurants.length > 0 && (
            <div className="locales-list">
              {restaurants.map((restaurant) => (
                <article key={restaurant.id} className="locales-list__item">
                  <div className="locales-list__summary">
                    <div className="locales-list__brand">
                      <RestaurantLogo name={restaurant.name} logo={restaurant.logo} />
                      <div className="locales-list__meta">
                        <strong>{restaurant.name}</strong>
                        <p>
                          <span className={`panel-badge ${restaurant.isOpen ? 'panel-badge--open' : 'panel-badge--closed'}`}>
                            {restaurant.isOpen ? 'Abierto' : 'Cerrado'}
                          </span>
                          {' · '}{restaurant.rating?.toFixed(1) ?? '—'} {'\u2605'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="panel-btn panel-btn--primary"
                    onClick={() => navigate(buildRestaurantPath(restaurant.id))}
                  >
                    Ver menú
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </main>
    </div>
  )
}