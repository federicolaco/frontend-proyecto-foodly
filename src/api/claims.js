import { getSessionToken } from '../lib/auth'
import { apiFetch, apiFetchSafe, isApiConfigured } from './client'
import { buildClaimSearchBody } from './backend/helpers'
import { mapClaim } from './backend/mappers'
import {
  mockGetClientClaimsForOrder,
  mockGetLocalClaims,
  mockResolveClaim,
  mockSubmitClaim,
} from './mock/claimsMock'

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
    return { orderId: Number(payload.orderId), status: 'pending' }
  }

  return mockSubmitClaim(getSessionToken(), payload)
}

export async function getLocalClaims(filters = {}) {
  if (isApiConfigured()) {
    const body = buildClaimSearchBody({
      localId: filters.localId,
      claimStatus: filters.status,
      date: filters.date,
    })
    const data = await apiFetch('/reclamos/buscar_reclamo', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return (data ?? []).map(mapClaim)
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
    const data = await apiFetchSafe(`/reclamos/mi-reclamo/${Number(orderId)}`, {
      method: 'GET',
      acceptStatuses: [404],
    })
    return data ? mapClaim(data) : null
  }

  return mockGetClientClaimsForOrder(getSessionToken(), orderId)
}
