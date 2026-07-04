import { useEffect, useState } from 'react'
import { deletePromotion, getLocalDishes, getLocalPromotions, savePromotion } from '../../api/localPanel'
import { formatPrice } from '../../lib/cart'
import '../Panel.css'

const EMPTY_FORM = {
  id: null,
  dishId: '',
  title: '',
  discountPercent: '',
  startDate: '',
  endDate: '',
}

const EMPTY_PROMOTION_GROUPS = {
  vigentes: [],
  vencidas: [],
  proximas: [],
}

const PROMOTION_SECTIONS = [
  {
    key: 'vigentes',
    title: 'Promociones vigentes',
    emptyMessage: 'No hay promociones vigentes.',
  },
  {
    key: 'proximas',
    title: 'Próximas promociones',
    emptyMessage: 'No hay promociones próximas.',
  },
  {
    key: 'vencidas',
    title: 'Promociones vencidas',
    emptyMessage: 'No hay promociones vencidas.',
  },
]

export function LocalPromotions() {
  const [promotionGroups, setPromotionGroups] = useState(EMPTY_PROMOTION_GROUPS)
  const [dishes, setDishes] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)

  const selectedDish = dishes.find((dish) => String(dish.id) === String(form.dishId))
  const discount = Number(form.discountPercent)
  const hasValidDiscount = Number.isFinite(discount) && discount >= 1 && discount <= 100
  const discountedPrice = selectedDish && hasValidDiscount
    ? Math.round(selectedDish.price * (1 - discount / 100))
    : null
  const savings = selectedDish && discountedPrice != null
    ? selectedDish.price - discountedPrice
    : null

  const getPromotionPricing = (promo) => {
    const dish = dishes.find((item) => String(item.id) === String(promo.dishId))
    if (!dish) {
      return {
        dishName: `Plato #${promo.dishId}`,
        currentPrice: null,
        finalPrice: null,
      }
    }

    const promoDiscount = Number(promo.discountPercent)
    const currentPrice = Number(dish.price ?? 0)
    const finalPrice = Math.round(currentPrice * (1 - promoDiscount / 100))

    return {
      dishName: dish.name,
      currentPrice,
      finalPrice,
    }
  }

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [promos, dishList] = await Promise.all([getLocalPromotions(), getLocalDishes()])
      setPromotionGroups(promos)
      setDishes(dishList.filter((d) => d.active))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const discount = Number(form.discountPercent)
    if (discount < 1 || discount > 100) {
      setError('El porcentaje de descuento debe estar entre 1% y 100%.')
      return
    }
    if (!form.dishId) {
      setError('Debe seleccionar al menos un plato para aplicar la promoción.')
      return
    }
    if (form.endDate && form.startDate && form.endDate < form.startDate) {
      setError('La fecha de fin debe ser posterior a la fecha de inicio.')
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      await savePromotion(form)
      setForm(EMPTY_FORM)
      setMessage(form.id ? 'Promoción actualizada.' : 'Promoción creada.')
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Desea eliminar esta promoción?')) return
    setError(null)
    setMessage(null)
    try {
      await deletePromotion(id)
      setMessage('Promoción eliminada.')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const renderPromotionCard = (promo) => {
    const pricing = getPromotionPricing(promo)

    return (
      <article key={promo.id} style={{ border: '1px solid #eee', borderRadius: '0.75rem', padding: '1rem' }}>
        <strong>{promo.title}</strong>
        <p style={{ marginTop: '0.35rem' }}>
          Descuento: {promo.discountPercent}% · {pricing.dishName}
        </p>
        {pricing.currentPrice != null ? (
          <div style={{ display: 'grid', gap: '0.2rem', color: 'var(--gris-oscuro)' }}>
            <span>Precio actual: {formatPrice(pricing.currentPrice)}</span>
            <span>Precio promocional: {formatPrice(pricing.finalPrice)}</span>
          </div>
        ) : (
          <p style={{ color: 'var(--gris-intermedio)' }}>
            No se pudo resolver el precio actual del plato.
          </p>
        )}
        <p style={{ marginTop: '0.35rem' }}>Vigencia: {promo.startDate} — {promo.endDate}</p>
        <div className="panel-actions" style={{ marginTop: '0.5rem' }}>
          <button
            type="button"
            className="panel-btn panel-btn--outline"
            onClick={() => setForm({ ...promo, dishId: String(promo.dishId) })}
          >
            Editar
          </button>
          <button type="button" className="panel-btn panel-btn--danger" onClick={() => handleDelete(promo.id)}>
            Eliminar
          </button>
        </div>
      </article>
    )
  }

  return (
    <>
      {error && <p className="panel-page__error" role="alert">{error}</p>}
      {message && <p className="panel-page__success">{message}</p>}

      <section className="panel-card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--gris-oscuro)' }}>
          {form.id ? 'Editar promoción' : 'Nueva promoción'}
        </h2>
        <form className="panel-form panel-form--grid" onSubmit={handleSubmit}>
          <label className="panel-field">
            <span className="panel-field__label">Plato</span>
            <select className="panel-field__select" value={form.dishId} onChange={(e) => setForm({ ...form, dishId: e.target.value })} required>
              <option value="">Seleccionar plato</option>
              {dishes.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </label>
          <label className="panel-field">
            <span className="panel-field__label">Título</span>
            <input className="panel-field__input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </label>
          <label className="panel-field">
            <span className="panel-field__label">Descuento (%)</span>
            <input type="number" min="1" max="100" className="panel-field__input" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} required />
          </label>
          {selectedDish && (
            <div
              className="panel-field"
              style={{
                gridColumn: '1 / -1',
                padding: '1rem',
                border: '1px solid #dbeaf5',
                borderRadius: '0.75rem',
                background: '#f7fbff',
              }}
            >
              <span className="panel-field__label">Vista previa del precio</span>
              <div style={{ display: 'grid', gap: '0.35rem', color: 'var(--gris-oscuro)' }}>
                <strong>{selectedDish.name}</strong>
                <span>Precio actual: {formatPrice(selectedDish.price)}</span>
                {hasValidDiscount ? (
                  <>
                    <span>Precio con descuento: {formatPrice(discountedPrice)}</span>
                    <span>Ahorrás: {formatPrice(savings)}</span>
                  </>
                ) : (
                  <span style={{ color: 'var(--gris-intermedio)' }}>
                    Ingresá un descuento válido para calcular el precio final.
                  </span>
                )}
              </div>
            </div>
          )}
          <label className="panel-field">
            <span className="panel-field__label">Inicio</span>
            <input type="date" className="panel-field__input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
          </label>
          <label className="panel-field">
            <span className="panel-field__label">Fin</span>
            <input type="date" className="panel-field__input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
          </label>
          <div className="panel-actions" style={{ alignItems: 'end' }}>
            <button type="submit" className="panel-btn panel-btn--primary" disabled={saving}>
              {form.id ? 'Guardar' : 'Crear promoción'}
            </button>
            {form.id && (
              <button type="button" className="panel-btn panel-btn--outline" onClick={() => setForm(EMPTY_FORM)}>Cancelar</button>
            )}
          </div>
        </form>
      </section>

      <section className="panel-card">
        <h2 style={{ marginBottom: '1rem', color: 'var(--gris-oscuro)' }}>Promociones por estado</h2>
        {loading && <p className="panel-empty">Cargando...</p>}
        {!loading && PROMOTION_SECTIONS.map((section, index) => {
          const promotions = promotionGroups[section.key] ?? []

          return (
            <section key={section.key} style={{ marginTop: index === 0 ? 0 : '1.5rem' }}>
              <h3 style={{ marginBottom: '0.75rem', color: 'var(--gris-oscuro)' }}>{section.title}</h3>
              {promotions.length === 0 ? (
                <p className="panel-empty">{section.emptyMessage}</p>
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {promotions.map(renderPromotionCard)}
                </div>
              )}
            </section>
          )
        })}
      </section>
    </>
  )
}
