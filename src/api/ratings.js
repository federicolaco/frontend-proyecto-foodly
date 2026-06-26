import { getSessionToken, getStoredUser } from '../lib/auth'
import { apiFetch, isApiConfigured } from './client'
import { buildLocalClientFilterBody } from './backend/helpers'
import { mapLocalClient, mapRatingSummary } from './backend/mappers'
import {
  mockGetLocalClients,
  mockGetLocalRatingSummary,
  mockHasRatedLocal,
  mockRateClient,
  mockRateLocal,
} from './mock/ratingsMock'

export async function rateLocal(payload) {
  if (isApiConfigured()) {
    await apiFetch('/calificaciones/calificar', {
      method: 'POST',
      body: JSON.stringify({
        puntaje: Number(payload.score),
        comentario: payload.comment ?? '',
        dtLocal: { id: Number(payload.localId) },
      }),
    })
    return { localId: Number(payload.localId), score: Number(payload.score) }
  }

  return mockRateLocal(getSessionToken(), payload)
}

export async function rateClient(payload) {
  if (isApiConfigured()) {
    await apiFetch('/calificaciones/calificar', {
      method: 'POST',
      body: JSON.stringify({
        puntaje: Number(payload.score),
        comentario: payload.comment ?? '',
        dtCliente: { id: Number(payload.clientId) },
      }),
    })
    return { clientId: Number(payload.clientId), score: Number(payload.score) }
  }

  return mockRateClient(getSessionToken(), payload)
}

export async function getLocalRatingSummary() {
  if (isApiConfigured()) {
    const data = await apiFetch('/calificaciones/local/mi-calificacion')
    return mapRatingSummary(data)
  }

  return mockGetLocalRatingSummary(getSessionToken())
}

export async function getLocalClients(filters = {}) {
  if (isApiConfigured()) {
    const user = getStoredUser()
    const localId = user.restaurantId ?? user.localId ?? user.id
    const data = await apiFetch(`/locales/${localId}/clientes`, {
      method: 'POST',
      body: JSON.stringify(buildLocalClientFilterBody(filters)),
    })
    return (data ?? []).map(mapLocalClient)
  }

  return mockGetLocalClients(getSessionToken(), filters)
}

export async function hasRatedLocal(localId) {
  if (isApiConfigured()) {
    return false
  }

  return mockHasRatedLocal(getSessionToken(), localId)
}
