import { getSessionToken } from '../lib/auth'
import { apiFetch, isApiConfigured } from './client'
import { buildAdminUserFilterBody } from './backend/helpers'
import { mapPendingLocalRequest, mapUserListItem } from './backend/mappers'
import {
  mockGetPendingLocalRequests,
  mockResolveLocalRequest,
} from './mock/localMock'
import { mockGetUsers, mockSetUserBlocked } from './mock/adminMock'

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

export async function getUsers(filters = {}) {
  if (isApiConfigured()) {
    const data = await apiFetch('/admins/usuarios', {
      method: 'POST',
      body: JSON.stringify(buildAdminUserFilterBody(filters)),
    })
    return (data ?? []).map(mapUserListItem)
  }

  return mockGetUsers(getSessionToken(), filters)
}

export async function setUserBlocked(userId, blocked) {
  if (isApiConfigured()) {
    await apiFetch('/admins/cuentas-usuario/resolver', {
      method: 'POST',
      body: JSON.stringify({ id: Number(userId), activo: !blocked }),
    })
    return { id: Number(userId), status: blocked ? 'blocked' : 'active' }
  }

  return mockSetUserBlocked(getSessionToken(), userId, blocked)
}
