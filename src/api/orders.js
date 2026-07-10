import burgerCardImg from '../../img/burger-card.png'
import pizzaCardImg from '../../img/pizza-card.png'
import pastaCardImg from '../../img/pasta-card.png'
import sushiCardImg from '../../img/sushi-card.png'
import milanesaCardImg from '../../img/milanesa-card.png'
import iceCreamCardImg from '../../img/ice-cream-card.png'
import { getSessionToken, getStoredUser } from '../lib/auth'
import { apiFetch, apiFetchSafe, isApiConfigured } from './client'
import { buildLocalListParams, buildOrderListParams, buildSearchParams, mapPagedResponse, getUserDeliveryAddress } from './backend/helpers'
import {
  buildOrderPayload,
  mapLocalListItem,
  mapOrderListItem,
  mapSearchResults,
  mapPlatoListItem,
} from './backend/mappers'
import {
  mockCancelClientOrder,
  mockCreateOrder,
  mockGetClientOrders,
  mockGetEnabledRestaurants,
  mockGetMostOrdered,
  mockRetryClientOrderPayment,
  mockSearchDishesAndPromotions,
} from './mock/ordersMock'

const MOCK_IMAGES = [
  burgerCardImg,
  pizzaCardImg,
  pastaCardImg,
  sushiCardImg,
  milanesaCardImg,
  iceCreamCardImg,
]

export function getPlaceholderImage(index = 0) {
  return MOCK_IMAGES[index % MOCK_IMAGES.length]
}

export async function getPopularRestaurants(filters = {}) {
  if (isApiConfigured()) {
    const params = buildLocalListParams(filters)
    const qs = params.toString()
    const data = await apiFetchSafe(`/clientes/listar_locales${qs ? `?${qs}` : ''}`)
    if (!data) return { items: [], page: 0, totalPages: 1, totalElements: 0 }
    return mapPagedResponse(data, mapLocalListItem)
  }

  const mockItems = await mockGetEnabledRestaurants(filters)
  return { items: mockItems, page: 0, totalPages: 1, totalElements: mockItems.length }
}

export async function getPopularRestaurantsSidebar(limit = 4) {
  if (isApiConfigured()) {
    const params = new URLSearchParams({ limite: String(limit) })
    const data = await apiFetchSafe(`/clientes/locales-populares?${params.toString()}`)
    return (data ?? []).map(mapLocalListItem)
  }

  const mockItems = await mockGetEnabledRestaurants({})
  return mockItems.slice(0, limit)
}

export async function getMostOrderedDishes(limit = 4) {
  if (isApiConfigured()) {
    const params = new URLSearchParams({ limite: String(limit) })
    const data = await apiFetch(`/clientes/platos-mas-pedidos?${params.toString()}`)
    return (data ?? [])
      .filter((plato) => plato.disponible !== false)
      .map((plato, index) => mapPlatoListItem(plato, index))
  }

  return mockGetMostOrdered(limit)
}

export async function searchDishes(query = '', options = {}) {
  if (isApiConfigured()) {
    const params = buildSearchParams(query, options)
    const qs = params.toString()
    try {
      const response = await apiFetch(`/clientes/busqueda${qs ? `?${qs}` : ''}`)
      const items = mapSearchResults(response, options)
      return {
        items,
        page: response?.paginaActual ?? 0,
        totalPages: response?.totalPaginas ?? 1,
        totalElements: response?.totalElementos ?? items.length,
      }
    } catch (err) {
      // El backend responde 400 cuando la búsqueda no encuentra ningún plato
      // ni promoción; para el usuario eso es simplemente "sin resultados",
      // no una falla real.
      if (err.status === 400) {
        return { items: [], page: 0, totalPages: 1, totalElements: 0 }
      }
      throw err
    }
  }

  const mockItems = await mockSearchDishesAndPromotions(query, options)
  return { items: mockItems, page: 0, totalPages: 1, totalElements: mockItems.length }
}
export async function createOrder(payload) {
  const paymentMethod = payload.paymentMethod ?? 'mercadopago'

  if (isApiConfigured()) {
    const user = getStoredUser()
    const deliveryAddress =
      payload.deliveryAddress ?? getUserDeliveryAddress(user)
    const response = await apiFetch('/pedidos', {
      method: 'POST',
      body: JSON.stringify(
        buildOrderPayload(user.id, { ...payload, paymentMethod, deliveryAddress }),
      ),
    })
    return {
      id: response.id,
      status: 'pending',
      total: response.total ?? payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      restaurantId: payload.restaurantId,
      paymentMethod,
      mpInitPoint: response.mpInitPoint ?? null,
    }
  }

  return mockCreateOrder(getSessionToken(), { ...payload, paymentMethod })
}

export async function getMyOrders(filters = {}) {
  if (isApiConfigured()) {
    const params = buildOrderListParams(filters)
    const qs = params.toString()
    const data = await apiFetchSafe(`/pedidos/mi-historial${qs ? `?${qs}` : ''}`)
    if (!data) return { items: [], page: 0, totalPages: 1, totalElements: 0 }
    return mapPagedResponse(data, mapOrderListItem)
  }

  const mockItems = await mockGetClientOrders(getSessionToken(), filters)
  return { items: mockItems, page: 0, totalPages: 1, totalElements: mockItems.length }
}

export async function cancelOrder(orderId) {
  if (isApiConfigured()) {
    await apiFetch(`/pedidos/${orderId}/cancelar`, { method: 'POST' })
    return { id: Number(orderId), status: 'cancelled' }
  }

  return mockCancelClientOrder(getSessionToken(), orderId)
}

export async function retryOrderPayment(orderId) {
  if (isApiConfigured()) {
    const response = await apiFetch(`/pedidos/${orderId}/reintentar-pago`, { method: 'POST' })
    return mapOrderListItem(response)
  }

  return mockRetryClientOrderPayment(getSessionToken(), orderId)
}