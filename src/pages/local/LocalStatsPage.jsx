import { useState } from 'react'
import { getLocalStats } from '../../api/localPanel'
import { formatPrice } from '../../lib/cart'
import { formatDate } from '../../lib/format'
import '../Panel.css'

const DEFAULT_PRESET = 'MES_ACTUAL'
const EMPTY_RANGE = { fechaDesde: '', fechaHasta: '' }
const PRESET_OPTIONS = [
  { value: 'HOY', label: 'Hoy' },
  { value: 'ULTIMOS_7_DIAS', label: 'Últimos 7 días' },
  { value: 'ULTIMOS_30_DIAS', label: 'Últimos 30 días' },
  { value: 'MES_ACTUAL', label: 'Mes actual' },
  { value: 'MES_ANTERIOR', label: 'Mes anterior' },
]

function formatPeriodDate(value) {
  if (!value) return '—'
  return formatDate(value)
}

function formatUnits(value) {
  const quantity = Number(value ?? 0)
  return `${quantity} ${quantity === 1 ? 'unidad' : 'unidades'}`
}

function AnalyticDishRow({ dish, index }) {
  return (
    <li
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '0.75rem 0',
        borderBottom: '1px solid #eee',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
        <img
          src={dish.image}
          alt={dish.name}
          style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', objectFit: 'cover', flexShrink: 0 }}
        />
        <div style={{ minWidth: 0 }}>
          <strong style={{ color: 'var(--gris-oscuro)' }}>
            {index + 1}. {dish.name}
          </strong>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--gris-intermedio)' }}>
            {formatUnits(dish.soldQuantity)}
          </p>
        </div>
      </div>

      <strong style={{ color: 'var(--gris-oscuro)', whiteSpace: 'nowrap', alignSelf: 'center' }}>
        {formatPrice(dish.soldAmount)}
      </strong>
    </li>
  )
}

function AnalyticDishCard({ dish }) {
  return (
    <article
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.5fr) repeat(2, minmax(120px, 0.75fr))',
        gap: '1rem',
        alignItems: 'center',
        border: '1px solid #eee',
        borderRadius: '0.75rem',
        padding: '0.9rem 1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
        <img
          src={dish.image}
          alt={dish.name}
          style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', objectFit: 'cover', flexShrink: 0 }}
        />
        <div style={{ minWidth: 0 }}>
          <strong style={{ color: 'var(--gris-oscuro)' }}>{dish.name}</strong>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--gris-intermedio)' }}>
            Plato vendido en el período
          </p>
        </div>
      </div>

      <div>
        <p className="panel-field__label">Cantidad vendida</p>
        <strong style={{ color: 'var(--gris-oscuro)' }}>{formatUnits(dish.soldQuantity)}</strong>
      </div>

      <div>
        <p className="panel-field__label">Monto vendido</p>
        <strong style={{ color: 'var(--gris-oscuro)' }}>{formatPrice(dish.soldAmount)}</strong>
      </div>
    </article>
  )
}

export function LocalStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedPreset, setSelectedPreset] = useState(DEFAULT_PRESET)
  const [range, setRange] = useState(EMPTY_RANGE)
  const [hasSearched, setHasSearched] = useState(false)

  const loadStats = async (filters) => {
    setLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const data = await getLocalStats(filters)
      setStats(data)
    } catch (err) {
      setStats(null)
      setError(err.message ?? 'No pudimos cargar las estadísticas del local.')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyPreset = () => {
    loadStats({ preset: selectedPreset })
  }

  const handleApplyRange = () => {
    const { fechaDesde, fechaHasta } = range

    if (!fechaDesde || !fechaHasta) {
      setStats(null)
      setHasSearched(true)
      setError('Para usar rango libre debe indicar fechaDesde y fechaHasta.')
      return
    }

    if (fechaDesde > fechaHasta) {
      setStats(null)
      setHasSearched(true)
      setError('La fechaDesde no puede ser posterior a fechaHasta.')
      return
    }

    loadStats({ fechaDesde, fechaHasta })
  }

  const handleClearFilters = () => {
    setSelectedPreset(DEFAULT_PRESET)
    setRange(EMPTY_RANGE)
    setStats(null)
    setError(null)
    setHasSearched(false)
    setLoading(false)
  }

  const topDishes = stats?.topDishes ?? []
  const salesByDish = stats?.salesByDish ?? []
  const totalUnitsSold = salesByDish.reduce((sum, dish) => sum + Number(dish.soldQuantity ?? 0), 0)

  return (
    <>
      {error && <p className="panel-page__error" role="alert">{error}</p>}

      <section className="panel-card">
        <div className="panel-form" style={{ marginBottom: '1.5rem' }}>
          <div className="panel-form__row panel-form__row--2">
            <label className="panel-field">
              <span className="panel-field__label">Preset rápido</span>
              <select
                className="panel-field__select"
                value={selectedPreset}
                onChange={(e) => setSelectedPreset(e.target.value)}
                disabled={loading}
              >
                {PRESET_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="panel-field">
              <span className="panel-field__label">Aplicar preset</span>
              <button
                type="button"
                className="panel-btn panel-btn--primary"
                onClick={handleApplyPreset}
                disabled={loading}
              >
                {loading ? 'Actualizando...' : 'Aplicar preset'}
              </button>
            </div>
          </div>

          <div style={{ margin: '0.5rem 0 0.25rem', color: 'var(--gris-intermedio)', fontSize: '0.9rem' }}>
            O usar un rango libre:
          </div>

          <div className="panel-form__row panel-form__row--2">
            <label className="panel-field">
              <span className="panel-field__label">Fecha desde</span>
              <input
                type="date"
                className="panel-field__input"
                value={range.fechaDesde}
                onChange={(e) => setRange((current) => ({ ...current, fechaDesde: e.target.value }))}
                disabled={loading}
              />
            </label>

            <label className="panel-field">
              <span className="panel-field__label">Fecha hasta</span>
              <input
                type="date"
                className="panel-field__input"
                value={range.fechaHasta}
                onChange={(e) => setRange((current) => ({ ...current, fechaHasta: e.target.value }))}
                disabled={loading}
              />
            </label>
          </div>

          <div className="panel-actions">
            <button
              type="button"
              className="panel-btn panel-btn--outline"
              onClick={handleApplyRange}
              disabled={loading}
            >
              Aplicar rango
            </button>
            <button
              type="button"
              className="panel-btn panel-btn--outline"
              onClick={handleClearFilters}
              disabled={loading}
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {loading ? (
          <p className="panel-empty">Cargando estadísticas...</p>
        ) : !hasSearched ? (
          <p className="panel-empty">Selecciona un período y aplica la búsqueda para ver estadísticas.</p>
        ) : stats ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#f8f9fa', borderRadius: '0.75rem', padding: '1rem' }}>
                <p className="panel-field__label">Ventas del período</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gris-oscuro)' }}>
                  {formatPrice(stats.confirmedSales ?? 0)}
                </p>
              </div>
              <div style={{ background: '#f8f9fa', borderRadius: '0.75rem', padding: '1rem' }}>
                <p className="panel-field__label">Período aplicado</p>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gris-oscuro)' }}>
                  {formatPeriodDate(stats.fromDate)} - {formatPeriodDate(stats.untilDate)}
                </p>
              </div>
              <div style={{ background: '#f8f9fa', borderRadius: '0.75rem', padding: '1rem' }}>
                <p className="panel-field__label">Unidades vendidas</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gris-oscuro)' }}>
                  {totalUnitsSold}
                </p>
              </div>
              <div style={{ background: '#f8f9fa', borderRadius: '0.75rem', padding: '1rem' }}>
                <p className="panel-field__label">Platos con ventas</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gris-oscuro)' }}>
                  {salesByDish.length}
                </p>
              </div>
            </div>

            <p style={{ marginBottom: '1rem', color: 'var(--gris-intermedio)' }}>
              Estas métricas consideran únicamente pedidos en estado confirmado.
            </p>

            <h2 style={{ marginBottom: '1rem', color: 'var(--gris-oscuro)' }}>Platos más pedidos</h2>
            {topDishes.length === 0 ? (
              <p className="panel-empty">No hay información disponible para el período seleccionado.</p>
            ) : (
              <ul style={{ display: 'grid', gap: '0.75rem', padding: 0, listStyle: 'none', marginBottom: '1.5rem' }}>
                {topDishes.map((dish, index) => (
                  <AnalyticDishRow key={dish.id} dish={dish} index={index} />
                ))}
              </ul>
            )}

            <h2 style={{ marginBottom: '1rem', color: 'var(--gris-oscuro)' }}>Detalle de ventas por plato</h2>
            {salesByDish.length === 0 ? (
              <p className="panel-empty">No hay detalle disponible para el período seleccionado.</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {salesByDish.map((dish) => (
                  <AnalyticDishCard key={`detail-${dish.id}`} dish={dish} />
                ))}
              </div>
            )}
          </>
        ) : null}
      </section>
    </>
  )
}
