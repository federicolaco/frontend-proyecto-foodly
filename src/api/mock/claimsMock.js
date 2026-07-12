import { getDb, nextId, updateDb } from './db'
import { mockDelay, MockApiError } from './helpers'
import { ensureMockDb } from './seed'
import { mockGetUserFromToken } from './authMock'

function requireUser(token) {
  const user = mockGetUserFromToken(token)
  if (!user) throw new MockApiError(401, 'Sesion invalida')
  return user
}

function normalizeClaimStatus(status) {
  if (status === 'resolved') return 'attended'
  return status
}

export function mockSubmitClaim(token, payload) {
  ensureMockDb()
  const user = requireUser(token)
  if (user.role !== 'cliente') throw new MockApiError(403, 'Solo clientes pueden realizar reclamos.')
  if (!payload.reason?.trim()) {
    throw new MockApiError(400, 'Debe ingresar un motivo.')
  }

  const result = updateDb((db) => {
    const order = db.orders.find((o) => o.id === Number(payload.orderId) && o.clientId === user.id)
    if (!order) throw new MockApiError(404, 'Pedido no encontrado')
    if (!['confirmed', 'delivered'].includes(order.status)) {
      throw new MockApiError(400, 'Solo se pueden realizar reclamos sobre pedidos confirmados o entregados.')
    }

    const existing = db.claims.find((c) => c.orderId === order.id)
    if (existing) {
      throw new MockApiError(409, 'Ya existe un reclamo para este pedido.')
    }

    const claim = {
      id: nextId(db, 'claim'),
      orderId: order.id,
      clientId: user.id,
      clientName: user.name,
      clientPhone: user.cellphone ?? null,
      restaurantId: order.restaurantId,
      restaurantName: order.restaurantName,
      reason: payload.reason.trim(),
      compensationType: payload.compensationType ?? 'reintegro',
      status: 'pending',
      createdAt: new Date().toISOString(),
      amount: order.total,
      resolutionType: null,
      resolutionNote: null,
      rejectionReason: null,
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
  let claims = db.claims
    .filter((c) => c.restaurantId === user.restaurantId)
    .map((claim) => ({
      ...claim,
      status: normalizeClaimStatus(claim.status),
    }))

  if (filters.status) {
    claims = claims.filter((c) => c.status === normalizeClaimStatus(filters.status))
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

  const normalizedStatus = normalizeClaimStatus(resolution?.status)

  if (!['attended', 'rejected'].includes(normalizedStatus)) {
    throw new MockApiError(400, 'Debe seleccionar el tipo de resolucion antes de confirmar.')
  }

  if (normalizedStatus === 'attended' && !resolution?.compensationType) {
    throw new MockApiError(400, 'Debe seleccionar el tipo de resolucion (reintegro o compensacion).')
  }

  if (normalizedStatus === 'rejected' && !resolution?.rejectionReason?.trim()) {
    throw new MockApiError(400, 'Debe ingresar un motivo de rechazo.')
  }

  const result = updateDb((db) => {
    const restaurant = db.restaurants.find((entry) => entry.id === user.restaurantId)
    if (!restaurant?.isOpen) {
      throw new MockApiError(400, 'El local debe estar abierto para poder resolver un reclamo')
    }

    const claim = db.claims.find(
      (c) => c.id === Number(claimId) && c.restaurantId === user.restaurantId,
    )

    if (!claim) throw new MockApiError(404, 'Reclamo no encontrado')

    if (normalizeClaimStatus(claim.status) !== 'pending') {
      throw new MockApiError(400, 'El reclamo debe estar en estado pendiente.')
    }

    claim.status = normalizedStatus
    claim.resolutionType =
      normalizedStatus === 'attended' ? resolution.compensationType : null
    claim.resolutionNote =
      normalizedStatus === 'attended'
        ? resolution?.resolutionNote?.trim() ?? ''
        : resolution.rejectionReason.trim()
    claim.rejectionReason =
      normalizedStatus === 'rejected' ? resolution.rejectionReason.trim() : null
    claim.resolvedAt = new Date().toISOString()
    return {
      ...claim,
      status: normalizedStatus,
    }
  })

  return mockDelay(result)
}

export function mockGetClientClaimsForOrder(token, orderId) {
  ensureMockDb()
  const user = requireUser(token)
  const db = getDb()
  const claim = db.claims.find((c) => c.orderId === Number(orderId) && c.clientId === user.id)

  if (!claim) return mockDelay(null)

  return mockDelay({
    ...claim,
    status: normalizeClaimStatus(claim.status),
  })
}
