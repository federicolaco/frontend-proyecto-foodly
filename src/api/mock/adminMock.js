import { getDb, updateDb } from './db'
import { mockDelay, MockApiError } from './helpers'
import { ensureMockDb } from './seed'
import { mockGetUserFromToken } from './authMock'

function requireAdmin(token) {
  const user = mockGetUserFromToken(token)
  if (!user || user.role !== 'admin') throw new MockApiError(403, 'Acceso denegado')
  return user
}

export function mockGetUsers(token, filters = {}) {
  ensureMockDb()
  requireAdmin(token)

  const db = getDb()
  let users = db.users
    .filter((u) => u.role !== 'admin')
    .map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      name: u.name,
      status: u.blocked ? 'blocked' : 'active',
      rating: u.rating ?? 0,
    }))

  if (filters.search) {
    const q = filters.search.toLowerCase()
    users = users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q),
    )
  }

  if (filters.role) {
    users = users.filter((u) => u.role === filters.role)
  }

  if (filters.status === 'blocked') {
    users = users.filter((u) => u.status === 'blocked')
  } else if (filters.status === 'active') {
    users = users.filter((u) => u.status === 'active')
  }

  return mockDelay(users)
}

export function mockSetUserBlocked(token, userId, blocked) {
  ensureMockDb()
  requireAdmin(token)

  const result = updateDb((db) => {
    const index = db.users.findIndex((u) => u.id === Number(userId))
    if (index < 0) throw new MockApiError(404, 'Usuario no encontrado')
    if (db.users[index].role === 'admin') {
      throw new MockApiError(400, 'No puede bloquear a un administrador.')
    }

    db.users[index].blocked = blocked
    return {
      id: db.users[index].id,
      status: blocked ? 'blocked' : 'active',
    }
  })

  return mockDelay(result)
}
