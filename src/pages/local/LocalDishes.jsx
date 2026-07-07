import { useEffect, useRef, useState } from 'react'
import {
  createLocalCategory,
  deleteDish,
  getLocalCategories,
  getLocalDishes,
  saveDish,
} from '../../api/localPanel'
import { formatPrice } from '../../lib/cart'
import '../Panel.css'

const EMPTY_FORM = {
  id: null,
  name: '',
  description: '',
  price: '',
  categoryId: '',
  imageFile: null,
  imagePreview: null,
}

export function LocalDishes() {
  const [dishes, setDishes] = useState([])
  const [categories, setCategories] = useState([])
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)
  const imageInputRef = useRef(null)

  const loadCategories = async () => {
    try {
      const data = await getLocalCategories()
      setCategories(data)
    } catch {
      setCategories([])
    }
  }

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
    loadCategories()
  }, [])

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setForm((prev) => ({
      ...prev,
      imageFile: file,
      imagePreview: URL.createObjectURL(file),
    }))
  }

  const handleCategoryChange = (event) => {
    const { value } = event.target

    if (value === '__new__') {
      setCreatingCategory(true)
      return
    }

    setForm((prev) => ({ ...prev, categoryId: value }))
  }

  const handleCancelCategoryCreation = () => {
    setCreatingCategory(false)
    setNewCategoryName('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.id && !form.imageFile) {
      setError('Debe seleccionar una imagen para el plato.')
      return
    }

    if (creatingCategory && !newCategoryName.trim()) {
      setError('Ingrese un nombre para la nueva categoria o cancele su creacion.')
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      let categoryId = form.categoryId
      let nuevaCategoriaNombre = null

      if (creatingCategory) {
        const created = await createLocalCategory(newCategoryName.trim())
        setCategories((prev) => [...prev, created])
        categoryId = String(created.id)
        nuevaCategoriaNombre = created.name
      }

      await saveDish({ ...form, categoryId })
      setForm(EMPTY_FORM)
      setCreatingCategory(false)
      setNewCategoryName('')
      if (imageInputRef.current) imageInputRef.current.value = ''
      setMessage(
        nuevaCategoriaNombre
          ? `Plato agregado con la nueva categoria "${nuevaCategoriaNombre}".`
          : form.id
            ? 'Plato actualizado.'
            : 'Plato agregado al catalogo.',
      )
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
      categoryId: String(dish.categoryId ?? ''),
      imageFile: null,
      imagePreview: dish.image ?? null,
    })
    setCreatingCategory(false)
    setNewCategoryName('')
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const handleCancel = () => {
    setForm(EMPTY_FORM)
    setCreatingCategory(false)
    setNewCategoryName('')
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const handleDelete = async (dishId) => {
    if (!window.confirm('Desea eliminar este plato del catalogo?')) return

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
            <span className="panel-field__label">Descripcion</span>
            <textarea
              rows={3}
              className="panel-field__textarea"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>

          <label className="panel-field">
            <span className="panel-field__label">Categoria</span>
            {!creatingCategory ? (
              <select
                className="panel-field__input"
                value={form.categoryId}
                onChange={handleCategoryChange}
              >
                <option value="">Seleccionar categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
                <option value="__new__">+ Crear nueva categoria</option>
              </select>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  className="panel-field__input"
                  placeholder="Nombre de la categoria"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  className="panel-btn panel-btn--outline panel-btn--sm"
                  onClick={handleCancelCategoryCreation}
                  disabled={saving}
                >
                  Usar categoria existente
                </button>
              </div>
            )}
            {creatingCategory && (
              <span className="panel-field__hint">
                La categoria se creara automaticamente al guardar el plato.
              </span>
            )}
          </label>

          <label className="panel-field">
            <span className="panel-field__label">
              Imagen del plato{form.id ? ' (opcional, deje vacio para mantener la actual)' : ''}
            </span>
            <div className="dish-photo">
              <button
                type="button"
                className="panel-btn panel-btn--outline panel-btn--sm"
                onClick={() => imageInputRef.current?.click()}
              >
                {form.imagePreview ? 'Cambiar imagen' : 'Agregar imagen'}
              </button>
              {form.imagePreview && (
                <img
                  src={form.imagePreview}
                  alt="Vista previa del plato"
                  className="dish-photo__preview"
                />
              )}
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="dish-photo__file-input"
              onChange={handleImageChange}
            />
          </label>

          <div className="panel-actions panel-actions--center">
            <button type="submit" className="panel-btn panel-btn--primary" disabled={saving}>
              {form.id ? 'Guardar cambios' : 'Agregar plato'}
            </button>
            {form.id && (
              <button
                type="button"
                className="panel-btn panel-btn--outline"
                onClick={handleCancel}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="panel-card">
        <h2 style={{ marginBottom: '1rem', color: 'var(--gris-oscuro)' }}>Catalogo</h2>

        {loading && <p className="panel-empty">Cargando platos...</p>}

        {!loading && dishes.length === 0 && (
          <p className="panel-empty">Aun no hay platos en el catalogo.</p>
        )}

        {!loading && dishes.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="panel-table">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Categoria</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {dishes.map((dish) => (
                  <tr key={dish.id}>
                    <td>
                      {dish.image && (
                        <img
                          src={dish.image}
                          alt=""
                          style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }}
                        />
                      )}
                    </td>
                    <td>{dish.name}</td>
                    <td>{formatPrice(dish.price)}</td>
                    <td>{dish.categoryName ?? 'Sin categoria'}</td>
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
