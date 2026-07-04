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

const DEFAULT_LOCAL_STATS_PRESET = 'MES_ACTUAL'

function getLocalId() {
  const user = getStoredUser()
  return user.restaurantId ?? user.localId ?? user.id
}

function buildLocalStatsQueryParams(filters = {}) {
  const params = new URLSearchParams()
  const preset = typeof filters.preset === 'string' ? filters.preset.trim() : ''
  const fechaDesde = typeof filters.fechaDesde === 'string' ? filters.fechaDesde.trim() : ''
  const fechaHasta = typeof filters.fechaHasta === 'string' ? filters.fechaHasta.trim() : ''
  const hasFreeRange = Boolean(fechaDesde || fechaHasta)

  if (preset && hasFreeRange) {
    throw new Error('Debe enviar un preset o un rango libre, pero no ambos.')
  }

  if (hasFreeRange) {
    if (!fechaDesde || !fechaHasta) {
      throw new Error('Para usar rango libre debe indicar fechaDesde y fechaHasta.')
    }

    params.set('fechaDesde', fechaDesde)
    params.set('fechaHasta', fechaHasta)
    return params
  }

  params.set('preset', preset || DEFAULT_LOCAL_STATS_PRESET)
  return params
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
    if (!payload.logo) {
      throw new Error('Debe indicar un logo para el local.')
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

    const logo = payload.logo ?? createPlaceholderImage('local.png')
    formData.append('logo', logo)

    const images = payload.images?.length ? payload.images : []
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
    const response = await apiFetchSafe(`/locales/busqueda_plato_local/${localId}`)
    return (response ?? []).map(mapLocalDish)
  }

  return mockGetLocalDishes(getSessionToken())
}

export async function saveDish(payload) {
  if (isApiConfigured()) {
    const localId = getLocalId()
    const datos = buildDishPayload(localId, payload)
    const formData = new FormData()
    formData.append('datos', new Blob([JSON.stringify(datos)], { type: 'application/json' }))

    if (payload.imageFile) {
      formData.append('imagenes', payload.imageFile)
    } else if (!payload.id) {
      // Solo en alta (POST) es obligatorio: si no hay archivo, mandamos placeholder
      formData.append('imagenes', createPlaceholderImage('plato.png'))
    }
    // En edición (PUT) sin archivo nuevo: no mandamos 'imagenes', el backend mantiene las URLs existentes

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
    console.log('RAW pedido del backend:', data) // 👈 temporal
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
    const response = await apiFetchSafe(`/locales/busqueda_promocion_local/${localId}`)
    return (response ?? []).map(mapLocalPromotion)
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
    await apiFetch(`/locales/promociones_baja/${promotionId}`, { method: 'DELETE' })
     return { id: Number(promotionId) }
  }

  return mockDeletePromotion(getSessionToken(), promotionId)
}


export async function getLocalStats(filters = {}) {
  if (isApiConfigured()) {
    const localId = getLocalId()
    const params = buildLocalStatsQueryParams(filters)
    const qs = params.toString()
    const data = await apiFetch(`/locales/estadisticas/${localId}?${qs}`)
    return mapLocalStats(data ?? {
      fechaDesde: null,
      fechaHasta: null,
      platosMasPedido: [],
      ventasPorPlato: [],
      ventasConfirmadas: 0,
    })
  }

  return mockGetLocalStats(getSessionToken(), filters)
}
