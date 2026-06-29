import { getSessionToken } from '../lib/auth'
import { apiFetch, isApiConfigured } from './client'
import { buildClaimSearchBody } from './backend/helpers'
import { mapClaim } from './backend/mappers'
import {
  mockGetClientClaimsForOrder,
  mockGetLocalClaims,
  mockResolveClaim,
  mockSubmitClaim,
} from './mock/claimsMock'

const CLAIMED_ORDERS_KEY = 'foodly_claimed_orders'

function readClaimedOrders() {
  try {
    return JSON.parse(localStorage.getItem(CLAIMED_ORDERS_KEY) ?? '[]')
  } catch {
    return []
  }
}

function rememberClaimedOrder(orderId) {
  const id = Number(orderId)
  const claimed = readClaimedOrders()
  if (!claimed.includes(id)) {
    localStorage.setItem(CLAIMED_ORDERS_KEY, JSON.stringify([...claimed, id]))
  }
}

export async function submitClaim(payload) {
  if (isApiConfigured()) {
    await apiFetch('/reclamos/realizar_reclamo', {
      method: 'POST',
      body: JSON.stringify({
        motivo: payload.reason,
        tipoCompensacion: payload.compensationType ?? 'reintegro',
        dtPedido: { id: Number(payload.orderId) },
      }),
    })
    rememberClaimedOrder(payload.orderId)
    return { orderId: Number(payload.orderId), status: 'pending' }
  }

  return mockSubmitClaim(getSessionToken(), payload)
}

export async function getLocalClaims(filters = {}) {
  if (isApiConfigured()) {
    const body = buildClaimSearchBody({
      clientId: filters.clientId,
      localId: filters.localId,
      date: filters.date,
      orderStatus: filters.statusFilter,
    })
    const data = await apiFetch('/reclamos/buscar_reclamo', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    let claims = (data ?? []).map(mapClaim)
    if (filters.status === 'pending') {
      claims = claims.filter((claim) => claim.status === 'pending')
    } else if (filters.status === 'resolved') {
      claims = claims.filter((claim) => claim.status === 'resolved')
    }
    return claims
  }

  return mockGetLocalClaims(getSessionToken(), filters)
}

export async function resolveClaim(claimId, resolution) {
  if (isApiConfigured()) {
    await apiFetch('/reclamos/resolver_reclamo', {
      method: 'POST',
      body: JSON.stringify({
        id: Number(claimId),
        tipoCompensacion: resolution.type,
        motivo: resolution.note ?? '',
      }),
    })
    return { id: Number(claimId), status: 'resolved' }
  }

  return mockResolveClaim(getSessionToken(), claimId, resolution)
}

export async function getClaimForOrder(orderId) {
  if (isApiConfigured()) {
    if (readClaimedOrders().includes(Number(orderId))) {
      return { orderId: Number(orderId), status: 'pending' }
    }
    return null
  }

  return mockGetClientClaimsForOrder(getSessionToken(), orderId)
}
