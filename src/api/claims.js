import { getSessionToken } from '../lib/auth'
import { apiFetch, apiFetchSafe, isApiConfigured } from './client'
import { mapPagedResponse, buildClaimSearchParams } from './backend/helpers'
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
    const params = buildClaimSearchParams(
      {
        localId: filters.localId,
        claimStatus: filters.status,
        date: filters.date,
      },
      { page: filters.page, pageSize: filters.pageSize },
    )
    const qs = params.toString()
    const data = await apiFetch(`/reclamos/buscar_reclamo${qs ? `?${qs}` : ''}`)
    return mapPagedResponse(data, mapClaim)
  }
  const mockItems = await mockGetLocalClaims(getSessionToken(), filters)
  return { items: mockItems, page: 0, totalPages: 1, totalElements: mockItems.length }
}

export async function resolveClaim(claimId, resolution) {
  if (isApiConfigured()) {
    const isAttended = resolution.status === 'attended'

    await apiFetch('/reclamos/resolver_reclamo', {
      method: 'POST',
      disableSessionExpiredOn403: true,
      body: JSON.stringify({
        id: Number(claimId),
        estado: isAttended ? 'Atendido' : 'Rechazado',
        ...(isAttended
          ? { tipoCompensacion: resolution.compensationType }
          : { motivoRechazo: resolution.rejectionReason?.trim() ?? '' }),
      }),
    })
    return { id: Number(claimId), status: resolution.status }
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
