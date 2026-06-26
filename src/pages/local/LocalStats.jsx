import { useEffect, useState } from 'react'
import { getLocalStats } from '../../api/localPanel'
import { formatPrice } from '../../lib/cart'
import '../Panel.css'

export function LocalStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getLocalStats()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="panel-empty">Cargando estadísticas...</p>

  return (
    <>
      {error && <p className="panel-page__error" role="alert">{error}</p>}

      <section className="panel-card">
        {stats && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#f8f9fa', borderRadius: '0.75rem', padding: '1rem' }}>
                <p className="panel-field__label">Ventas del período</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gris-oscuro)' }}>
                  {formatPrice(stats.monthlyRevenue ?? 0)}
                </p>
              </div>
              <div style={{ background: '#f8f9fa', borderRadius: '0.75rem', padding: '1rem' }}>
                <p className="panel-field__label">Platos destacados</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gris-oscuro)' }}>
                  {stats.topDishes?.length ?? 0}
                </p>
              </div>
            </div>

            <h2 style={{ marginBottom: '1rem', color: 'var(--gris-oscuro)' }}>Platos más pedidos</h2>
            {stats.topDishes?.length === 0 ? (
              <p className="panel-empty">No hay información disponible para el período seleccionado.</p>
            ) : (
              <ul style={{ display: 'grid', gap: '0.5rem', padding: 0, listStyle: 'none' }}>
                {stats.topDishes.map((dish, index) => (
                  <li key={dish.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                    <span>{index + 1}. {dish.name}</span>
                    <span>{formatPrice(dish.price)}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </>
  )
}
