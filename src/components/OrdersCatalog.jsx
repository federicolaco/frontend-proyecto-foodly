import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildRestaurantPath } from '../api/restaurant'
import { searchDishes } from '../api/orders'
import { DishCard } from './DishCard'
import { Pagination } from './Pagination'
import './OrdersCatalog.css'

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function OrdersCatalog() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [view, setView] = useState('all')
  const [sort, setSort] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [dishes, setDishes] = useState([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState(null)

  const [page, setPage] = useState(0)

  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setPage(0)
  }, [query, view, sort, maxPrice])

  useEffect(() => {

    let cancelled = false

    const timer = setTimeout(async () => {

      setLoading(true)

      setError(null)



      try {

        const options = { page }

        if (view === 'promotions') options.promotionsOnly = true

        if (sort) options.sort = sort

        if (maxPrice) options.maxPrice = maxPrice



        const { items, totalPages: tp } = await searchDishes(query, options)

        if (!cancelled) {
          setDishes(items)
          setTotalPages(tp)
        }

      } catch {

        if (!cancelled) {

          setError('No pudimos cargar los platos. Intentá de nuevo.')

          setDishes([])

        }

      } finally {

        if (!cancelled) setLoading(false)

      }

    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, view, sort, maxPrice, category, page])

  useEffect(() => {
    if (category && !categories.includes(category)) {
      setCategory('')
    }
  }, [categories, category])

  return (
    <section className="orders-catalog">
      <div className="orders-catalog__toolbar">
        <div className="orders-catalog__search-wrap">
          <input
            type="search"
            className="orders-catalog__search"
            placeholder="Buscar plato o promoción..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Buscar plato"
          />
          <span className="orders-catalog__search-icon">
            <SearchIcon />
          </span>
        </div>

        <div className="orders-catalog__filters">
          <div className="orders-catalog__tabs">
            <button
              type="button"
              className={`orders-catalog__tab${view === 'all' ? ' orders-catalog__tab--active' : ''}`}
              onClick={() => setView('all')}
            >
              Platos
            </button>
            <button
              type="button"
              className={`orders-catalog__tab${view === 'promotions' ? ' orders-catalog__tab--active' : ''}`}
              onClick={() => setView('promotions')}
            >
              Promociones
            </button>
          </div>

          <div className="orders-catalog__actions">
            <select
              className="orders-catalog__select"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Filtrar por categoría"
              disabled={categories.length === 0}
            >
              <option value="">Todas las categorías</option>
              {categories.map((categoryName) => (
                <option key={categoryName} value={categoryName}>
                  {categoryName}
                </option>
              ))}
            </select>

            <select
              className="orders-catalog__select"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              aria-label="Ordenar resultados"
            >
              <option value="">Ordenar</option>
              <option value="name">Nombre</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
            </select>

            <input
              type="number"
              min="0"
              placeholder="Precio máx."
              className="orders-catalog__price-filter"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              aria-label="Precio máximo"
            />
          </div>
        </div>
      </div>

      <div className="orders-catalog__grid-wrap">
        {error && <p className="orders-catalog__message orders-catalog__message--error">{error}</p>}

        {!error && loading && (
          <div className="orders-catalog__grid" aria-busy="true" aria-label="Cargando platos">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={`dish-skeleton-${index}`} className="orders-catalog__skeleton" />
            ))}
          </div>
        )}

        {!error && !loading && dishes.length === 0 && (
          <p className="orders-catalog__message">
            No se encontraron platos o promociones que coincidan con su búsqueda.
          </p>
        )}

        {!error && !loading && dishes.length > 0 && (
          <div className="orders-catalog__grid">
            {dishes.map((dish, index) => (
              <DishCard
                key={dish.id}
                dish={dish}
                index={index}
                onSelect={(selectedDish) =>
                  navigate(buildRestaurantPath(selectedDish.restaurantId))
                }
              />
            ))}
          </div>
        )}
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </section>
  )
}