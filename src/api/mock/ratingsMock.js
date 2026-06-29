import { getDb, nextId, updateDb } from './db'
import { mockDelay, MockApiError } from './helpers'
import { ensureMockDb } from './seed'
import { mockGetUserFromToken } from './authMock'

function requireUser(token) {
  const user = mockGetUserFromToken(token)
  if (!user) throw new MockApiError(401, 'Sesión inválida')
  return user
}

function buildRatingSummary(ratings) {
  if (!ratings.length) {
    return { average: 0, total: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
  }

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let sum = 0
  ratings.forEach((r) => {
    sum += r.score
    breakdown[r.score] = (breakdown[r.score] ?? 0) + 1
  })

  return {
    average: Math.round((sum / ratings.length) * 10) / 10,
    total: ratings.length,
    breakdown,
  }
}

export function mockRateLocal(token, payload) {
  ensureMockDb()
  const user = requireUser(token)
  if (user.role !== 'cliente') throw new MockApiError(403, 'Solo clientes pueden calificar locales.')
  if (!payload.score || payload.score < 1 || payload.score > 5) {
    throw new MockApiError(400, 'La calificación debe estar entre 1 y 5.')
  }

  const result = updateDb((db) => {
    const hasOrder = db.orders.some(
      (o) =>
        o.clientId === user.id &&
        o.restaurantId === Number(payload.localId) &&
        o.status === 'confirmed',
    )
    if (!hasOrder) {
      throw new MockApiError(400, 'Solo puede calificar locales en los que haya realizado al menos un pedido.')
    }

    const existing = db.ratings.find(
      (r) => r.type === 'cliente_to_local' && r.clientId === user.id && r.localId === Number(payload.localId),
    )
    if (existing) {
      existing.score = Number(payload.score)
      existing.comment = payload.comment?.trim() ?? ''
      existing.createdAt = new Date().toISOString()
      return existing
    }

    const rating = {
      id: nextId(db, 'rating'),
      type: 'cliente_to_local',
      clientId: user.id,
      localId: Number(payload.localId),
      score: Number(payload.score),
      comment: payload.comment?.trim() ?? '',
      createdAt: new Date().toISOString(),
    }
    db.ratings.push(rating)
    return rating
  })

  return mockDelay(result)
}

export function mockRateClient(token, payload) {
  ensureMockDb()
  const user = requireUser(token)
  if (user.role !== 'local' || !user.restaurantId) {
    throw new MockApiError(403, 'Acceso denegado')
  }
  if (!payload.score || payload.score < 1 || payload.score > 5) {
    throw new MockApiError(400, 'La calificación debe estar entre 1 y 5.')
  }

  const result = updateDb((db) => {
    const hasOrder = db.orders.some(
      (o) =>
        o.clientId === Number(payload.clientId) &&
        o.restaurantId === user.restaurantId &&
        o.status === 'confirmed',
    )
    if (!hasOrder) {
      throw new MockApiError(400, 'Solo puede calificar clientes que hayan pedido en su local.')
    }

    const existing = db.ratings.find(
      (r) =>
        r.type === 'local_to_cliente' &&
        r.clientId === Number(payload.clientId) &&
        r.localId === user.restaurantId,
    )
    if (existing) {
      throw new MockApiError(400, 'Ya ha calificado a este cliente.')
    }

    const rating = {
      id: nextId(db, 'rating'),
      type: 'local_to_cliente',
      clientId: Number(payload.clientId),
      localId: user.restaurantId,
      score: Number(payload.score),
      comment: payload.comment?.trim() ?? '',
      createdAt: new Date().toISOString(),
    }
    db.ratings.push(rating)
    return rating
  })

  return mockDelay(result)
}

export function mockGetClientRatingSummary(token) {
  ensureMockDb()
  const user = requireUser(token)
  const db = getDb()
  const ratings = db.ratings.filter((r) => r.type === 'local_to_cliente' && r.clientId === user.id)
  return mockDelay(buildRatingSummary(ratings))
}

export function mockGetLocalRatingSummary(token) {
  ensureMockDb()
  const user = requireUser(token)
  if (user.role !== 'local' || !user.restaurantId) {
    throw new MockApiError(403, 'Acceso denegado')
  }

  const db = getDb()
  const ratings = db.ratings.filter(
    (r) => r.type === 'cliente_to_local' && r.localId === user.restaurantId,
  )
  return mockDelay(buildRatingSummary(ratings))
}

export function mockGetLocalClients(token, filters = {}) {
  ensureMockDb()
  const user = requireUser(token)
  if (user.role !== 'local' || !user.restaurantId) {
    throw new MockApiError(403, 'Acceso denegado')
  }

  const db = getDb()
  const clientIds = new Set(
    db.orders
      .filter((o) => o.restaurantId === user.restaurantId && o.status === 'confirmed')
      .map((o) => o.clientId),
  )

  let clients = [...clientIds].map((clientId) => {
    const clientUser = db.users.find((u) => u.id === clientId)
    const clientRatings = db.ratings.filter(
      (r) => r.type === 'local_to_cliente' && r.clientId === clientId,
    )
    const alreadyRated = db.ratings.some(
      (r) =>
        r.type === 'local_to_cliente' &&
        r.clientId === clientId &&
        r.localId === user.restaurantId,
    )
    const summary = buildRatingSummary(clientRatings)

    return {
      id: clientId,
      name: clientUser?.name ?? `Cliente #${clientId}`,
      rating: summary.average,
      totalRatings: summary.total,
      alreadyRated,
    }
  })

  if (filters.search) {
    const q = filters.search.toLowerCase()
    clients = clients.filter((c) => c.name.toLowerCase().includes(q))
  }

  if (filters.minRating) {
    clients = clients.filter((c) => c.rating >= Number(filters.minRating))
  }

  return mockDelay(clients)
}

export function mockGetMyLocalRating(token, localId) {
  ensureMockDb()
  const user = requireUser(token)
  const db = getDb()
  const rating = db.ratings.find(
    (r) => r.type === 'cliente_to_local' && r.clientId === user.id && r.localId === Number(localId),
  )

  if (!rating) {
    return mockDelay(null)
  }

  return mockDelay({
    id: rating.id,
    puntaje: rating.score,
    comentario: rating.comment ?? '',
    fecha: rating.createdAt,
  })
}

export function mockHasRatedLocal(token, localId) {
  ensureMockDb()
  const user = requireUser(token)
  const db = getDb()
  const rated = db.ratings.some(
    (r) => r.type === 'cliente_to_local' && r.clientId === user.id && r.localId === Number(localId),
  )
  return mockDelay(rated)
}
