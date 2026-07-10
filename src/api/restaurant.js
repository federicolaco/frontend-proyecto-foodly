import { apiFetch, isApiConfigured } from './client'
import { mapRestaurantDetail } from './backend/mappers'
import { mockGetRestaurantById } from './mock/ordersMock'

async function fetchLocalSummary(restaurantId) {
  return apiFetch(`/locales/${Number(restaurantId)}/perfil`)
}

async function fetchLocalDishes(restaurantId) {
  const params = new URLSearchParams({ localId: String(Number(restaurantId)) })
  const response = await apiFetch(`/clientes/busqueda?${params.toString()}`)

  return response?.platos ?? []
}

export async function fetchRestaurant(restaurantId) {
  if (isApiConfigured()) {
    const local = await fetchLocalSummary(restaurantId)
    if (!local) {
      throw new Error('Restaurante no encontrado')
    }

    const platos = await fetchLocalDishes(restaurantId)
    return mapRestaurantDetail(local, platos)
  }

  return mockGetRestaurantById(restaurantId)
}

export function buildRestaurantPath(restaurantId) {
  return `/local/${restaurantId}`
}

export function isRestaurantOpen(restaurant) {
  return Boolean(restaurant?.isOpen)
}
