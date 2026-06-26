import { getDb, nextId, updateDb } from './db'
import { mockDelay, MockApiError } from './helpers'
import { ensureMockDb } from './seed'
import { mockGetUserFromToken } from './authMock'

function requireUser(token) {
  const user = mockGetUserFromToken(token)
  if (!user) throw new MockApiError(401, 'Sesión inválida')
  return user
}

export function mockSubmitClaim(token, payload) {
  ensureMockDb()
  const user = requireUser(token)
  if (user.role !== 'cliente') throw new MockApiError(403, 'Solo clientes pueden realizar reclamos.')
  if (!payload.reason?.trim()) {
    throw new MockApiError(400, 'Debe describir el motivo del reclamo antes de enviarlo.')
  }

  const result = updateDb((db) => {
    const order = db.orders.find((o) => o.id === Number(payload.orderId) && o.clientId === user.id)
    if (!order) throw new MockApiError(404, 'Pedido no encontrado')
    if (order.status !== 'confirmed') {
      throw new MockApiError(400, 'Solo puede reclamar pedidos confirmados.')
    }

    const existing = db.claims.find((c) => c.orderId === order.id)
    if (existing) {
      throw new MockApiError(400, 'Ya ha presentado un reclamo para este pedido.')
    }

    const claim = {
      id: nextId(db, 'claim'),
      orderId: order.id,
      clientId: user.id,
      clientName: user.name,
      restaurantId: order.restaurantId,
      restaurantName: order.restaurantName,
      reason: payload.reason.trim(),
      compensationType: payload.compensationType ?? 'reintegro',
      status: 'pending',
      createdAt: new Date().toISOString(),
      amount: order.total,
    }

    db.claims.push(claim)
    return claim
  })

  return mockDelay(result)
}

export function mockGetLocalClaims(token, filters = {}) {
  ensureMockDb()
  const user = requireUser(token)
  if (user.role !== 'local' || !user.restaurantId) {
    throw new MockApiError(403, 'Acceso denegado')
  }

  const db = getDb()
  let claims = db.claims.filter((c) => c.restaurantId === user.restaurantId)

  if (filters.status) {
    claims = claims.filter((c) => c.status === filters.status)
  }

  claims.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  return mockDelay(claims)
}

export function mockResolveClaim(token, claimId, resolution) {
  ensureMockDb()
  const user = requireUser(token)
  if (user.role !== 'local' || !user.restaurantId) {
    throw new MockApiError(403, 'Acceso denegado')
  }
  if (!resolution?.type) {
    throw new MockApiError(400, 'Debe seleccionar el tipo de resolución antes de confirmar.')
  }

  const result = updateDb((db) => {
    const claim = db.claims.find(
      (c) => c.id === Number(claimId) && c.restaurantId === user.restaurantId,
    )
    if (!claim) throw new MockApiError(404, 'Reclamo no encontrado')
    if (claim.status !== 'pending') {
      throw new MockApiError(400, 'El reclamo ya fue atendido.')
    }

    claim.status = 'resolved'
    claim.resolutionType = resolution.type
    claim.resolutionNote = resolution.note?.trim() ?? ''
    claim.resolvedAt = new Date().toISOString()
    return claim
  })

  return mockDelay(result)
}

export function mockGetClientClaimsForOrder(token, orderId) {
  ensureMockDb()
  const user = requireUser(token)
  const db = getDb()
  const claim = db.claims.find((c) => c.orderId === Number(orderId) && c.clientId === user.id)
  return mockDelay(claim ?? null)
}
