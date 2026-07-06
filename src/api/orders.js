import burgerCardImg from '../../img/burger-card.png'
import pizzaCardImg from '../../img/pizza-card.png'
import pastaCardImg from '../../img/pasta-card.png'
import sushiCardImg from '../../img/sushi-card.png'
import milanesaCardImg from '../../img/milanesa-card.png'
import iceCreamCardImg from '../../img/ice-cream-card.png'
import { getSessionToken, getStoredUser } from '../lib/auth'
import { apiFetch, apiFetchSafe, isApiConfigured } from './client'
import { buildLocalListBody, buildOrderListParams, buildSearchFilter, getUserDeliveryAddress } from './backend/helpers'
import {
  buildOrderPayload,
  mapLocalListItem,
  mapOrderListItem,
  mapSearchResults,
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
    const data = await apiFetchSafe('/clientes/listar_locales', {
      method: 'POST',
      body: JSON.stringify(buildLocalListBody(filters)),
    })
    if (!data) return []
    return data.map((local) => mapLocalListItem(local))
  }

  return mockGetEnabledRestaurants(filters)
}

export async function getMostOrderedDishes(limit = 4) {
  if (isApiConfigured()) {
    const results = await searchDishes('', {})
    return results.slice(0, limit)
  }

  return mockGetMostOrdered(limit)
}

export async function searchDishes(query = '', options = {}) {
  if (isApiConfigured()) {
    const response = await apiFetch('/clientes/busqueda', {
      method: 'POST',
      body: JSON.stringify(buildSearchFilter(query, options)),
    })
    return mapSearchResults(response, options)
  }

  return mockSearchDishesAndPromotions(query, options)
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
    return (data ?? []).map(mapOrderListItem)
  }

  return mockGetClientOrders(getSessionToken(), filters)
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

