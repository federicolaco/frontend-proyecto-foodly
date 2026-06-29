import { useEffect, useState } from 'react'
import { deletePromotion, getLocalDishes, getLocalPromotions, savePromotion } from '../../api/localPanel'
import '../Panel.css'

const EMPTY_FORM = {
  id: null,
  dishId: '',
  title: '',
  discountPercent: '',
  startDate: '',
  endDate: '',
}

export function LocalPromotions() {
  const [promotions, setPromotions] = useState([])
  const [dishes, setDishes] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [promos, dishList] = await Promise.all([getLocalPromotions(), getLocalDishes()])
      setPromotions(promos.filter((p) => p.active !== false))
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
        <h2 style={{ marginBottom: '1rem', color: 'var(--gris-oscuro)' }}>Promociones activas</h2>
        {loading && <p className="panel-empty">Cargando...</p>}
        {!loading && promotions.length === 0 && <p className="panel-empty">No hay promociones registradas.</p>}
        {!loading && promotions.length > 0 && (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {promotions.map((promo) => (
              <article key={promo.id} style={{ border: '1px solid #eee', borderRadius: '0.75rem', padding: '1rem' }}>
                <strong>{promo.title}</strong>
                <p>Descuento: {promo.discountPercent}% · Plato #{promo.dishId}</p>
                <p>Vigencia: {promo.startDate} — {promo.endDate}</p>
                <div className="panel-actions" style={{ marginTop: '0.5rem' }}>
                  <button type="button" className="panel-btn panel-btn--outline" onClick={() => setForm({ ...promo, dishId: String(promo.dishId) })}>Editar</button>
                  <button type="button" className="panel-btn panel-btn--danger" onClick={() => handleDelete(promo.id)}>Eliminar</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
