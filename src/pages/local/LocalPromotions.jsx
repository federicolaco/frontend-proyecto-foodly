import { useEffect, useState } from 'react'
import { deletePromotion, getLocalDishes, getLocalPromotions, savePromotion } from '../../api/localPanel'
import { formatPrice } from '../../lib/cart'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../context/ConfirmContext'
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

const STATUS_OPTIONS = [
  { key: 'todas', label: 'Todos los estados' },
  { key: 'vigentes', label: 'Vigentes' },
  { key: 'proximas', label: 'Próximas' },
  { key: 'vencidas', label: 'Vencidas' },
]

const STATUS_LABELS = {
  vigentes: 'Vigente',
  proximas: 'Próxima',
  vencidas: 'Vencida',
}

const SORT_OPTIONS = [
  { key: 'nombre-asc', label: 'Nombre (A-Z)' },
  { key: 'nombre-desc', label: 'Nombre (Z-A)' },
  { key: 'descuento-desc', label: 'Mayor descuento' },
  { key: 'descuento-asc', label: 'Menor descuento' },
  { key: 'inicio-asc', label: 'Fecha de inicio (más próxima)' },
  { key: 'inicio-desc', label: 'Fecha de inicio (más lejana)' },
]

export function LocalPromotions() {
  const [promotionGroups, setPromotionGroups] = useState(EMPTY_PROMOTION_GROUPS)
  const [dishes, setDishes] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todas')
  const [sortBy, setSortBy] = useState('nombre-asc')
  const toast = useToast()
  const confirm = useConfirm()

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

  const allPromotions = STATUS_OPTIONS
    .filter((option) => option.key !== 'todas')
    .flatMap((option) => (promotionGroups[option.key] ?? []).map((promo) => ({ ...promo, status: option.key })))

  const normalizedSearch = searchTerm.trim().toLowerCase()

  const filteredPromotions = allPromotions
    .filter((promo) => statusFilter === 'todas' || promo.status === statusFilter)
    .filter((promo) => {
      if (!normalizedSearch) return true
      const dishName = getPromotionPricing(promo).dishName
      return (
        promo.title.toLowerCase().includes(normalizedSearch) ||
        dishName.toLowerCase().includes(normalizedSearch)
      )
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'nombre-desc':
          return b.title.localeCompare(a.title)
        case 'descuento-desc':
          return Number(b.discountPercent) - Number(a.discountPercent)
        case 'descuento-asc':
          return Number(a.discountPercent) - Number(b.discountPercent)
        case 'inicio-asc':
          return a.startDate.localeCompare(b.startDate)
        case 'inicio-desc':
          return b.startDate.localeCompare(a.startDate)
        case 'nombre-asc':
        default:
          return a.title.localeCompare(b.title)
      }
    })

  const load = async () => {
    setLoading(true)
    try {
      const [promos, dishList] = await Promise.all([getLocalPromotions(), getLocalDishes()])
      setPromotionGroups(promos)
      setDishes(dishList.filter((d) => d.active))
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const discount = Number(form.discountPercent)
    if (discount < 1 || discount > 100) {
      toast.error('El porcentaje de descuento debe estar entre 1% y 100%.')
      return
    }
    if (!form.dishId) {
      toast.error('Debe seleccionar al menos un plato para aplicar la promoción.')
      return
    }
    if (form.endDate && form.startDate && form.endDate < form.startDate) {
      toast.error('La fecha de fin debe ser posterior a la fecha de inicio.')
      return
    }

    setSaving(true)
    try {
      await savePromotion(form)
      setForm(EMPTY_FORM)
      toast.success(form.id ? 'Promoción actualizada.' : 'Promoción creada.')
      await load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: 'Eliminar promoción',
      message: '¿Desea eliminar esta promoción?',
      confirmText: 'Eliminar',
      variant: 'danger',
    })
    if (!confirmed) return
    try {
      await deletePromotion(id)
      toast.success('Promoción eliminada.')
      await load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const renderPromotionCard = (promo) => {
    const pricing = getPromotionPricing(promo)

    return (
      <article key={promo.id} style={{ border: '1px solid #eee', borderRadius: '0.75rem', padding: '1rem' }}>
        <div className="panel-actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>{promo.title}</strong>
          {promo.status && (
            <span
              className={`panel-badge ${
                promo.status === 'vigentes'
                  ? 'panel-badge--open'
                  : promo.status === 'proximas'
                  ? 'panel-badge--pending'
                  : 'panel-badge--closed'
              }`}
            >
              {STATUS_LABELS[promo.status]}
            </span>
          )}
        </div>
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
        <div
          style={{
            marginTop: '0.35rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <p style={{ margin: 0 }}>Vigencia: {promo.startDate} — {promo.endDate}</p>
          <div className="panel-actions" style={{ justifyContent: 'flex-end' }}>
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
        </div>
      </article>
    )
  }

  return (
    <>
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
        <h2 style={{ marginBottom: '1rem', color: 'var(--gris-oscuro)' }}>Buscar promoción</h2>

        <div className="panel-promo-filters">
          <label className="panel-field">
            <span className="panel-field__label">Nombre</span>
            <input
              className="panel-field__input"
              placeholder="Buscar por nombre de promoción o plato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>
          <label className="panel-field">
            <span className="panel-field__label">Estado</span>
            <select
              className="panel-sort-select"
              style={{ width: '100%', height: '2.85rem', boxSizing: 'border-box' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="panel-field">
            <span className="panel-field__label">Ordenar por</span>
            <select
              className="panel-sort-select"
              style={{ width: '100%', height: '2.85rem', boxSizing: 'border-box' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        {loading && <p className="panel-empty">Cargando...</p>}
        {!loading && filteredPromotions.length === 0 && (
          <p className="panel-empty">No se encontraron promociones con esos filtros.</p>
        )}
        {!loading && filteredPromotions.length > 0 && (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {filteredPromotions.map(renderPromotionCard)}
          </div>
        )}
      </section>
    </>
  )
}