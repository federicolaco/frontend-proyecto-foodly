import { getSessionToken, getStoredUser, setStoredUser } from '../lib/auth'
import { apiFetch, apiFetchMultipart, apiFetchSafe, isApiConfigured } from './client'
import {
  mapPagedResponse ,
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
  mockCreateLocalCategory,
  mockDeleteDish,
  mockDeletePromotion,
  mockGetLocalCategories,
  mockGetLocalDishes,
  mockGetLocalOrders,
  mockGetLocalPromotions,
  mockGetLocalRestaurant,
  mockGetLocalStats,
  mockRejectOrder,
  mockSaveDish,
  mockSavePromotion,
  mockSetLocalOpenState,
  mockSubmitLocalRequest,
} from './mock/localMock'

const DEFAULT_LOCAL_STATS_PRESET = 'MES_ACTUAL'

function createEmptyPromotionGroups() {
  return {
    vigentes: [],
    vencidas: [],
    proximas: [],
  }
}

function normalizePromotionItem(promo) {
  const mappedPromotion = mapLocalPromotion(promo)

  return {
    ...mappedPromotion,
    dishId: mappedPromotion.dishId ?? promo.dishId,
    title: mappedPromotion.title === 'Promoción' && promo.title ? promo.title : mappedPromotion.title,
    discountPercent: mappedPromotion.discountPercent || promo.discountPercent || 0,
    startDate: mappedPromotion.startDate ?? promo.startDate,
    endDate: mappedPromotion.endDate ?? promo.endDate,
  }
}

function getPromotionSortTimestamp(dateValue) {
  const normalizedDate = typeof dateValue === 'string' ? dateValue.split('T')[0] : ''
  const timestamp = Date.parse(normalizedDate)
  return Number.isFinite(timestamp) ? timestamp : null
}

function sortPromotionGroup(promotions, groupKey) {
  const direction = groupKey === 'vencidas' ? -1 : 1

  return [...promotions].sort((left, right) => {
    const leftDateField = groupKey === 'proximas' ? left.startDate : left.endDate
    const rightDateField = groupKey === 'proximas' ? right.startDate : right.endDate
    const leftTimestamp = getPromotionSortTimestamp(leftDateField)
    const rightTimestamp = getPromotionSortTimestamp(rightDateField)

    if (leftTimestamp == null && rightTimestamp == null) {
      return Number(left.id ?? 0) - Number(right.id ?? 0)
    }

    if (leftTimestamp == null) return 1
    if (rightTimestamp == null) return -1

    if (leftTimestamp === rightTimestamp) {
      return Number(left.id ?? 0) - Number(right.id ?? 0)
    }

    return (leftTimestamp - rightTimestamp) * direction
  })
}

function normalizePromotionGroups(response) {
  if (response == null) {
    return createEmptyPromotionGroups()
  }

  if (Array.isArray(response)) {
    throw new Error('El endpoint de promociones devolvió una lista plana y el frontend espera grupos por vigencia.')
  }

  if (typeof response !== 'object') {
    throw new Error('El endpoint de promociones devolvió un formato inválido.')
  }

  const groups = createEmptyPromotionGroups()

  for (const groupKey of Object.keys(groups)) {
    const rawGroup = Array.isArray(response[groupKey]) ? response[groupKey] : []
    groups[groupKey] = sortPromotionGroup(rawGroup.map(normalizePromotionItem), groupKey)
  }

  return groups
}

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

export async function getLocalCategories() {
  if (isApiConfigured()) {
    const localId = getLocalId()
    const response = await apiFetchSafe(`/locales/${localId}/categorias`)
    return (response ?? []).map((category) => ({
      id: category.id,
      name: category.nombre,
    }))
  }

  return mockGetLocalCategories(getSessionToken())
}

export async function createLocalCategory(nombre) {
  if (isApiConfigured()) {
    const localId = getLocalId()
    const response = await apiFetch('/locales/categorias', {
      method: 'POST',
      body: JSON.stringify({ nombre, idLocal: Number(localId) }),
    })

    return {
      id: response.id,
      name: response.nombre,
    }
  }

  return mockCreateLocalCategory(getSessionToken(), nombre)
}

export async function saveDish(payload) {
  if (isApiConfigured()) {
    const localId = getLocalId()
    const datos = buildDishPayload(localId, payload)
    const formData = new FormData()
    formData.append('datos', new Blob([JSON.stringify(datos)], { type: 'application/json' }))

    if (payload.imageFile) {
      formData.append('imagen', payload.imageFile)
    } else if (!payload.id) {
      
      formData.append('imagen', createPlaceholderImage('plato.png'))
    }
  

    const response = payload.id
      ? await apiFetchMultipart(`/locales/platos/${payload.id}`, formData, { method: 'PUT' })
      : await apiFetchMultipart('/locales/platos', formData)

    return mapLocalDish(response)
  }

  return mockSaveDish(getSessionToken(), payload)
}

export async function deleteDish(dishId) {
  if (isApiConfigured()) {
    await apiFetch(`/locales//platos/elimina/${dishId}`, { method: 'DELETE' })
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
    if (!data) return { items: [], page: 0, totalPages: 1, totalElements: 0 }
    return mapPagedResponse(data, mapOrderListItem)
  }
  const mockItems = await mockGetLocalOrders(getSessionToken(), filters)
  return { items: mockItems, page: 0, totalPages: 1, totalElements: mockItems.length }
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
    return normalizePromotionGroups(response)
  }

  return normalizePromotionGroups(await mockGetLocalPromotions(getSessionToken()))
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
    return normalizePromotionItem(response)
  }

  return normalizePromotionItem(await mockSavePromotion(getSessionToken(), payload))
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
      ventasMensuales: [],
      ventasConfirmadas: 0,
    })
  }

  return mockGetLocalStats(getSessionToken(), filters)
}
