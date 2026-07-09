import { useEffect, useMemo, useState } from 'react'
import { getUsers, setUserBlocked } from '../../api/admin'
import { OrdersNavbar } from '../../components/OrdersNavbar'
import { useToast } from '../../context/ToastContext'
import '../Panel.css'

const ROLE_LABELS = { cliente: 'Cliente', local: 'Local' }
const STATUS_LABELS = { active: 'Activo', blocked: 'Bloqueado', pending: 'Pendiente' }

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Nombre: A-Z' },
  { value: 'name-desc', label: 'Nombre: Z-A' },
  { value: 'rating-asc', label: 'Calificación: menor a mayor' },
  { value: 'rating-desc', label: 'Calificación: mayor a menor' },
]

export function AdminUsers() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [sort, setSort] = useState('name-asc')
  const toast = useToast()

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await getUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      })
      setUsers(data)
    } catch (err) {
      toast.error(err.message ?? 'No pudimos cargar los usuarios.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadUsers, 300)
    return () => clearTimeout(timer)
  }, [search, roleFilter, statusFilter])

  const sortedUsers = useMemo(() => {
    const list = [...users]
    const [field, dir] = sort.split('-')
    const dirMultiplier = dir === 'asc' ? 1 : -1

    list.sort((a, b) => {
      if (field === 'rating') {
        // Usuarios sin calificación quedan siempre al final, sin importar la dirección
        const aHasRating = typeof a.rating === 'number'
        const bHasRating = typeof b.rating === 'number'
        if (!aHasRating && !bHasRating) return 0
        if (!aHasRating) return 1
        if (!bHasRating) return -1
        return (a.rating - b.rating) * dirMultiplier
      }

      // Orden alfabético por nombre, insensible a mayúsculas/acentos
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }) * dirMultiplier
    })

    return list
  }, [users, sort])

  const handleToggleBlock = async (user) => {
    const block = user.status !== 'blocked'
    const label = block ? 'bloquear' : 'desbloquear'
    if (!window.confirm(`¿Confirma que desea ${label} a ${user.name}?`)) return

    setProcessingId(user.id)
    try {
      await setUserBlocked(user.id, block)
      toast.success(`Usuario ${block ? 'bloqueado' : 'desbloqueado'} correctamente.`)
      await loadUsers()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="panel-page">
      <OrdersNavbar />
      <main className="panel-page__main contenedor">
        <h1 className="panel-page__title">Gestión de usuarios</h1>

        <section className="panel-card">
          <div className="panel-form panel-form--grid" style={{ marginBottom: '1rem' }}>
            <label className="panel-field">
              <span className="panel-field__label">Buscar</span>
              <input className="panel-field__input" placeholder="Nombre o correo" value={search} onChange={(e) => setSearch(e.target.value)} />
            </label>
            <label className="panel-field">
              <span className="panel-field__label">Tipo</span>
              <select className="panel-field__select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="">Todos</option>
                <option value="cliente">Cliente</option>
                <option value="local">Local</option>
              </select>
            </label>
            <label className="panel-field">
              <span className="panel-field__label">Estado</span>
              <select className="panel-field__select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">Todos</option>
                <option value="active">Activo</option>
                <option value="blocked">Bloqueado</option>
              </select>
            </label>
            <label className="panel-field">
              <span className="panel-field__label">Ordenar por</span>
              <select
                className="panel-field__select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>
          </div>

          {loading && <p className="panel-empty">Cargando usuarios...</p>}
          {!loading && sortedUsers.length === 0 && (
            <p className="panel-empty">No se encontraron usuarios que coincidan con los criterios seleccionados.</p>
          )}

          {!loading && sortedUsers.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table className="panel-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Calificación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{ROLE_LABELS[user.role] ?? user.role}</td>
                      <td>{STATUS_LABELS[user.status] ?? user.status}</td>
                      <td>{user.rating ? user.rating.toFixed(1) : '—'}</td>
                      <td>
                        <button
                          type="button"
                          className={`panel-btn ${user.status === 'blocked' ? 'panel-btn--primary' : 'panel-btn--danger'}`}
                          disabled={processingId === user.id}
                          onClick={() => handleToggleBlock(user)}
                        >
                          {user.status === 'blocked' ? 'Desbloquear' : 'Bloquear'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}