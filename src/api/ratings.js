import { getSessionToken, getStoredUser } from '../lib/auth'
import { apiFetch, apiFetchSafe, isApiConfigured } from './client'
import { buildLocalClientFilterBody } from './backend/helpers'
import { mapLocalClient, mapRatingSummary } from './backend/mappers'
import {
  mockGetLocalClients,
  mockGetLocalRatingDetails,
  mockGetLocalRatingSummary,
  mockGetMyLocalRating,
  mockHasRatedLocal,
  mockRateClient,
  mockRateLocal,
} from './mock/ratingsMock'

function mapMyLocalRating(data) {
  if (!data) return null

  return {
    id: data.id,
    score: Number(data.puntaje ?? data.score ?? 0),
    comment: data.comentario ?? data.comment ?? '',
    createdAt: data.fecha ?? data.createdAt ?? null,
  }
}

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
    const data = await apiFetchSafe('/calificaciones/local/mi-calificacion')
    return mapRatingSummary(data)
  }

  return mockGetLocalRatingSummary(getSessionToken())
}

export async function getLocalRatingDetails() {
  if (isApiConfigured()) {
    const data = await apiFetchSafe('/calificaciones/local/mi-calificacion/detalle')
    return (data ?? []).map((d) => ({
      clientId: d.idCliente,
      clientName: d.nombreCliente,
      score: d.puntaje,
      comment: d.comentario ?? '',
      createdAt: d.fecha,
    }))
  }

  return mockGetLocalRatingDetails(getSessionToken())
}

export async function getLocalClients(filters = {}) {
  if (isApiConfigured()) {
    const user = getStoredUser()
    const localId = user.restaurantId ?? user.localId ?? user.id
    const data = await apiFetch(`/locales/${localId}/clientes`, {
      method: 'POST',
      body: JSON.stringify(buildLocalClientFilterBody(filters)),
    })
    console.log('RAW clientes del backend:', data) // 👈 temporal
    return (data ?? []).map(mapLocalClient)
  }
  return mockGetLocalClients(getSessionToken(), filters)
}

export async function getMyLocalRating(localId) {
  if (isApiConfigured()) {
    const data = await apiFetch(`/calificaciones/locales/${Number(localId)}/mi-calificacion`)
    return mapMyLocalRating(data)
  }

  return mockGetMyLocalRating(getSessionToken(), localId)
}

export async function hasRatedLocal(localId) {
  if (isApiConfigured()) {
    return Boolean(await getMyLocalRating(localId))
  }

  return mockHasRatedLocal(getSessionToken(), localId)
}