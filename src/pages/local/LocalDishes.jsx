import { useEffect, useState } from 'react'
import { deleteDish, getLocalDishes, saveDish } from '../../api/localPanel'
import '../Panel.css'

const EMPTY_FORM = {
  id: null,
  name: '',
  description: '',
  price: '',
  categoryId: 'general',
}

export function LocalDishes() {
  const [dishes, setDishes] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)

  const loadDishes = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getLocalDishes()
      setDishes(data.filter((dish) => dish.active))
    } catch (err) {
      setError(err.message ?? 'No pudimos cargar los platos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDishes()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      await saveDish(form)
      setForm(EMPTY_FORM)
      setMessage(form.id ? 'Plato actualizado.' : 'Plato agregado al catálogo.')
      await loadDishes()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (dish) => {
    setForm({
      id: dish.id,
      name: dish.name,
      description: dish.description ?? '',
      price: String(dish.price),
      categoryId: dish.categoryId ?? 'general',
    })
  }

  const handleDelete = async (dishId) => {
    if (!window.confirm('¿Desea eliminar este plato del catálogo?')) return

    setError(null)
    setMessage(null)

    try {
      await deleteDish(dishId)
      setMessage('Plato eliminado.')
      await loadDishes()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      {error && (
        <p className="panel-page__error" role="alert">
          {error}
        </p>
      )}
      {message && <p className="panel-page__success">{message}</p>}

      <section className="panel-card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--gris-oscuro)' }}>
          {form.id ? 'Editar plato' : 'Agregar plato'}
        </h2>

        <form className="panel-form panel-form--grid" onSubmit={handleSubmit}>
          <label className="panel-field">
            <span className="panel-field__label">Nombre</span>
            <input
              className="panel-field__input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>

          <label className="panel-field">
            <span className="panel-field__label">Precio</span>
            <input
              type="number"
              min="1"
              className="panel-field__input"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </label>

          <label className="panel-field" style={{ gridColumn: '1 / -1' }}>
            <span className="panel-field__label">Descripción</span>
            <textarea
              rows={3}
              className="panel-field__textarea"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>

          <label className="panel-field">
            <span className="panel-field__label">Categoría</span>
            <input
              className="panel-field__input"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            />
          </label>

          <div className="panel-actions" style={{ alignItems: 'end' }}>
            <button type="submit" className="panel-btn panel-btn--primary" disabled={saving}>
              {form.id ? 'Guardar cambios' : 'Agregar plato'}
            </button>
            {form.id && (
              <button
                type="button"
                className="panel-btn panel-btn--outline"
                onClick={() => setForm(EMPTY_FORM)}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="panel-card">
        <h2 style={{ marginBottom: '1rem', color: 'var(--gris-oscuro)' }}>Catálogo</h2>

        {loading && <p className="panel-empty">Cargando platos...</p>}

        {!loading && dishes.length === 0 && (
          <p className="panel-empty">Aún no hay platos en el catálogo.</p>
        )}

        {!loading && dishes.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="panel-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Categoría</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {dishes.map((dish) => (
                  <tr key={dish.id}>
                    <td>{dish.name}</td>
                    <td>${dish.price.toLocaleString('es-AR')}</td>
                    <td>{dish.categoryId}</td>
                    <td>
                      <div className="panel-actions">
                        <button
                          type="button"
                          className="panel-btn panel-btn--outline"
                          onClick={() => handleEdit(dish)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="panel-btn panel-btn--danger"
                          onClick={() => handleDelete(dish.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
