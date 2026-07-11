import { useEffect, useRef, useState } from 'react'
import {
  createLocalCategory,
  deleteDish,
  getLocalCategories,
  getLocalDishes,
  saveDish,
} from '../../api/localPanel'
import { usePolling } from '../../hooks/usePolling'
import { formatPrice } from '../../lib/cart'
import { onlyDigits, validateRequiredFields } from '../../lib/inputUtils'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../context/ConfirmContext'
import '../Panel.css'

const EMPTY_FORM = {
  id: null,
  name: '',
  description: '',
  price: '',
  categoryId: '',
  imageFile: null,
  imagePreview: null,
  active: true,
}

export function LocalDishes() {
  const [dishes, setDishes] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [categories, setCategories] = useState([])
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  const confirm = useConfirm()
  const imageInputRef = useRef(null)

  const loadCategories = async () => {
    try {
      const data = await getLocalCategories()
      setCategories(data)
    } catch {
      setCategories([])
    }
  }

const loadDishes = async (silent = false) => {
    if (silent && saving) return 

    if (!silent) setLoading(true)

    try {
      const data = await getLocalDishes()
      setDishes(data)
    } catch (err) {
      if (!silent) toast.error(err.message ?? 'No pudimos cargar los platos.')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  usePolling(loadDishes, 3000, [])

  useEffect(() => {
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
    if (!validateRequiredFields(event.currentTarget, toast)) return
    const normalizedPrice = onlyDigits(form.price)

    if (!normalizedPrice || Number(normalizedPrice) < 1) {
      toast.error('El precio debe ser un numero entero mayor a 0.')
      return
    }

    if (!form.id && !form.imageFile) {
      toast.error('Debe seleccionar una imagen para el plato.')
      return
    }

    if (creatingCategory && !newCategoryName.trim()) {
      toast.error('Ingrese un nombre para la nueva categoria o cancele su creacion.')
      return
    }

    setSaving(true)

    try {
      let categoryId = form.categoryId
      let nuevaCategoriaNombre = null

      if (creatingCategory) {
        const created = await createLocalCategory(newCategoryName.trim())
        setCategories((prev) => [...prev, created])
        categoryId = String(created.id)
        nuevaCategoriaNombre = created.name
      }

      await saveDish({ ...form, price: normalizedPrice, categoryId })
      setForm(EMPTY_FORM)
      setCreatingCategory(false)
      setNewCategoryName('')
      if (imageInputRef.current) imageInputRef.current.value = ''
      toast.success(
        nuevaCategoriaNombre
          ? `Plato agregado con la nueva categoria "${nuevaCategoriaNombre}".`
          : form.id
            ? 'Plato actualizado.'
            : 'Plato agregado al catalogo.',
      )
      await loadDishes()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (dish) => {
    setForm({
      id: dish.id,
      name: dish.name,
      description: dish.description ?? '',
      price: onlyDigits(String(dish.price ?? '')),
      categoryId: String(dish.categoryId ?? ''),
      imageFile: null,
      imagePreview: dish.image ?? null,
      active: dish.active,
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

  const handleToggleActive = async (dish, nextActive) => {
    try {
      await saveDish({
        id: dish.id,
        name: dish.name,
        description: dish.description,
        price: String(dish.price),
        categoryId: String(dish.categoryId ?? ''),
        imageFile: null,
        active: nextActive,
      })
      toast.success(nextActive ? 'Plato activado.' : 'Plato desactivado.')
      await loadDishes()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDelete = async (dishId) => {
    const confirmed = await confirm({
      title: 'Eliminar plato',
      message: '¿Desea eliminar este plato del catálogo? Va a dejar de estar disponible para los clientes.',
      confirmText: 'Eliminar',
      variant: 'danger',
    })
    if (!confirmed) return

    try {
      await deleteDish(dishId)
      toast.success('Plato eliminado.')
      await loadDishes()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const visibleDishes =
    statusFilter === 'all'
      ? dishes
      : dishes.filter((dish) => (statusFilter === 'available' ? dish.active : !dish.active))

  return (
    <>
      <section className="panel-card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--gris-oscuro)' }}>
          {form.id ? 'Editar plato' : 'Agregar plato'}
        </h2>

        <form className="panel-form panel-form--grid" onSubmit={handleSubmit} noValidate>
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
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="panel-field__input"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: onlyDigits(e.target.value) })}
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
              <div className="panel-category-inline">
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
        <div className="panel-actions" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ color: 'var(--gris-oscuro)', margin: 0 }}>Catalogo</h2>
          <label className="panel-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
            <span className="panel-field__label" style={{ margin: 0 }}>Estado</span>
            <select
              className="panel-field__select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="available">Disponible</option>
              <option value="unavailable">No disponible</option>
            </select>
          </label>
        </div>

        {loading && <p className="panel-empty">Cargando platos...</p>}

        {!loading && visibleDishes.length === 0 && (
          <p className="panel-empty">
            {dishes.length === 0
              ? 'Aun no hay platos en el catalogo.'
              : 'No hay platos que coincidan con el estado seleccionado.'}
          </p>
        )}

        {!loading && visibleDishes.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="panel-table">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Categoria</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibleDishes.map((dish) => (
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
                      <select
                        className="panel-field__input"
                        value={dish.active ? 'true' : 'false'}
                        onChange={(e) => handleToggleActive(dish, e.target.value === 'true')}
                      >
                        <option value="true">Disponible</option>
                        <option value="false">No disponible</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="panel-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="panel-btn panel-btn--outline"
                          onClick={() => handleEdit(dish)}
                        >
                          Editar
                        </button>
                        {dish.active ? (
                          <button
                            type="button"
                            className="panel-btn panel-btn--danger"
                            onClick={() => handleDelete(dish.id)}
                          >
                            Eliminar
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="panel-btn panel-btn--outline"
                            onClick={() => handleToggleActive(dish, true)}
                          >
                            Reactivar
                          </button>
                        )}
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
