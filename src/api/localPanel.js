import { getSessionToken, getStoredUser, setStoredUser } from '../lib/auth'
import { apiFetch, apiFetchMultipart, apiFetchSafe, isApiConfigured } from './client'
import {
  createPlaceholderImage,
  normalizeAddress,
  buildOrderListParams,
} from './backend/helpers'
import {
  buildDishPayload,
  buildPromotionPayload,
  mapLocalDish,
  mapLocalListItem,
  mapLocalPanelRestaurant,
  mapLocalPromotion,
  mapLocalRegistrationPayload,
  mapLocalStats,
  mapOrderListItem,
} from './backend/mappers'
import {
  mockConfirmOrder,
  mockDeleteDish,
  mockGetLocalDishes,
  mockGetLocalOrders,
  mockGetLocalPromotions,
  mockGetLocalRestaurant,
  mockRejectOrder,
  mockSaveDish,
  mockSavePromotion,
  mockDeletePromotion,
  mockGetLocalStats,
  mockSetLocalOpenState,
  mockSubmitLocalRequest,
} from './mock/localMock'

function getLocalId() {
  const user = getStoredUser()
  return user.restaurantId ?? user.localId ?? user.id
}

async function fetchOwnLocalSummary() {
  const localId = getLocalId()
  const user = getStoredUser()

  return {
    local: {
      id: localId,
      nombre: user.name ?? 'Mi local',
      estaAbierto: Boolean(user.isOpen),
      calificacionGlobal: 0,
    },
    enabled: user.localEnabled !== false,
  }
}

export async function submitLocalRegistration(payload) {
  if (isApiConfigured()) {
    if (!payload.password) {
      throw new Error('Debe indicar una contraseña para la cuenta del local.')
    }

    const formData = new FormData()
    const datos = mapLocalRegistrationPayload({
      ...payload,
      addressParsed: normalizeAddress(payload.address),
    })

    formData.append(
      'datos',
      new Blob([JSON.stringify(datos)], { type: 'application/json' }),
    )

    const images = payload.images?.length ? payload.images : [createPlaceholderImage('local.png')]
    images.forEach((file) => formData.append('imagenes', file))

    await apiFetchMultipart('/locales/solicitudes-habilitacion', formData)
    return { status: 'pending' }
  }

  return mockSubmitLocalRequest(getSessionToken(), payload)
}

export async function getMyLocal() {
  if (isApiConfigured()) {
    const { local, enabled } = await fetchOwnLocalSummary()
    let pendingOrdersOnClose = 0

    if (enabled) {
      const pedidos = await apiFetchSafe(
        `/pedidos/listar-pedido-local/${local.id}?estado=Pendiente`,
      )
      pendingOrdersOnClose = pedidos?.length ?? 0
    }

    return mapLocalPanelRestaurant(local, { enabled, pendingOrdersOnClose })
  }

  return mockGetLocalRestaurant(getSessionToken())
}

export async function openLocal() {
  if (isApiConfigured()) {
    const localId = getLocalId()
    await apiFetch(`/locales/${localId}/apertura`, { method: 'PUT' })
    const user = getStoredUser()
    setStoredUser({ ...user, isOpen: true })
    return getMyLocal()
  }

  return mockSetLocalOpenState(getSessionToken(), true)
}

export async function closeLocal() {
  if (isApiConfigured()) {
    const localId = getLocalId()
    await apiFetch(`/locales/${localId}/cierre`, { method: 'PUT' })
    const user = getStoredUser()
    setStoredUser({ ...user, isOpen: false })
    return getMyLocal()
  }

  return mockSetLocalOpenState(getSessionToken(), false)
}

export async function getLocalDishes() {
  if (isApiConfigured()) {
    const localId = getLocalId()
    const response = await apiFetchSafe('/busqueda_plato_local/${localId}', {
      method: 'GET',
      body: JSON.stringify({ dtLocal: { id: localId } }),
    })
    return (response?.platos ?? []).map(mapLocalDish)
  }

  return mockGetLocalDishes(getSessionToken())
}

export async function saveDish(payload) {
  if (isApiConfigured()) {
    const localId = getLocalId()
    const datos = buildDishPayload(localId, payload)
    const formData = new FormData()
    formData.append('datos', new Blob([JSON.stringify(datos)], { type: 'application/json' }))

    const image = payload.imageFile ?? createPlaceholderImage('plato.png')
    formData.append('imagenes', image)

    const response = payload.id
      ? await apiFetchMultipart(`/locales/platos/${payload.id}`, formData, { method: 'PUT' })
      : await apiFetchMultipart('/locales/platos', formData)

    return mapLocalDish(response)
  }

  return mockSaveDish(getSessionToken(), payload)
}

export async function deleteDish(dishId) {
  if (isApiConfigured()) {
    await apiFetch(`/locales/platos/${dishId}`, { method: 'DELETE' })
    return { id: Number(dishId) }
  }

  return mockDeleteDish(getSessionToken(), dishId)
}

export async function getLocalOrders(filters = {}) {
  if (isApiConfigured()) {
    const localId = getLocalId()
    const params = buildOrderListParams(filters)
    const qs = params.toString()
    const data = await apiFetch(`/pedidos/listar-pedido-local/${localId}${qs ? `?${qs}` : ''}`)
    return (data ?? []).map(mapOrderListItem)
  }

  return mockGetLocalOrders(getSessionToken(), filters)
}

export async function confirmOrder(orderId, deliveryMinutes) {
  if (isApiConfigured()) {
    await apiFetch(`/pedidos/${orderId}/confirmar`, {
      method: 'POST',
      body: JSON.stringify({ tiempoEstimadoEntregaMinutos: Number(deliveryMinutes) }),
    })
    return { id: Number(orderId), status: 'confirmed' }
  }

  return mockConfirmOrder(getSessionToken(), orderId, deliveryMinutes)
}

export async function rejectOrder(orderId, reason) {
  if (isApiConfigured()) {
    await apiFetch(`/pedidos/${orderId}/rechazar`, {
      method: 'POST',
      body: JSON.stringify({ motivo: reason }),
    })
    return { id: Number(orderId), status: 'rejected' }
  }

  return mockRejectOrder(getSessionToken(), orderId, reason)
}

export async function getLocalPromotions() {
  if (isApiConfigured()) {
    const localId = getLocalId()
    const response = await apiFetchSafe('/busqueda_promocion_local/${localId}', {
      method: 'GET',
      body: JSON.stringify({ dtLocal: { id: localId }, promocionActiva: true }),
    })
    return (response?.promociones ?? []).map(mapLocalPromotion)
  }

  return mockGetLocalPromotions(getSessionToken())
}

export async function savePromotion(payload) {
  if (isApiConfigured()) {
    const body = buildPromotionPayload(payload)
    const response = payload.id
      ? await apiFetch(`/locales/promociones/${payload.id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        })
      : await apiFetch('/locales/promociones', {
          method: 'POST',
          body: JSON.stringify(body),
        })
    return mapLocalPromotion(response)
  }

  return mockSavePromotion(getSessionToken(), payload)
}

export async function deletePromotion(promotionId) {
  if (isApiConfigured()) {
    throw new Error('El backend no expone baja de promociones. Edite la vigencia para desactivarla.')
  }

  return mockDeletePromotion(getSessionToken(), promotionId)
}

export async function getLocalStats() {
  if (isApiConfigured()) {
    const localId = getLocalId()
    const data = await apiFetchSafe(`/locales/estadisticas/${localId}`)
    return mapLocalStats(data ?? { platosMasPedido: [], gananciasMensuales: 0 })
  }

  return mockGetLocalStats(getSessionToken())
}
