import { getSessionToken } from '../lib/auth'
import { apiFetch, isApiConfigured } from './client'
import { mapPendingLocalRequest } from './backend/mappers'
import {
  mockGetPendingLocalRequests,
  mockResolveLocalRequest,
} from './mock/localMock'

export async function getPendingLocalRequests() {
  if (isApiConfigured()) {
    const data = await apiFetch('/admins/solicitudes-locales/pendientes')
    return (data ?? []).map(mapPendingLocalRequest)
  }

  return mockGetPendingLocalRequests(getSessionToken())
}

export async function approveLocalRequest(requestId) {
  if (isApiConfigured()) {
    await apiFetch('/admins/solicitudes-locales/resolver_solicitud', {
      method: 'PUT',
      body: JSON.stringify({
        idLocal: Number(requestId),
        estadoObjetivo: 'Habilitado',
      }),
    })
    return { id: Number(requestId), status: 'approved' }
  }

  return mockResolveLocalRequest(getSessionToken(), requestId, 'approve')
}

export async function rejectLocalRequest(requestId) {
  if (isApiConfigured()) {
    await apiFetch('/admins/solicitudes-locales/resolver_solicitud', {
      method: 'PUT',
      body: JSON.stringify({
        idLocal: Number(requestId),
        estadoObjetivo: 'Rechazado',
      }),
    })
    return { id: Number(requestId), status: 'rejected' }
  }

  return mockResolveLocalRequest(getSessionToken(), requestId, 'reject')
}
