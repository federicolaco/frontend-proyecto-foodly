import { apiFetch, isApiConfigured } from './client'
import { mapLocalListItem, mapRestaurantDetail } from './backend/mappers'
import { mockGetRestaurantById } from './mock/ordersMock'

async function fetchLocalSummary(restaurantId) {
  const locales = await apiFetch('/clientes')
  return (locales ?? []).find((local) => local.id === Number(restaurantId)) ?? null
}

async function fetchLocalDishes(restaurantId) {
  const response = await apiFetch('/clientes/busqueda', {
    method: 'POST',
    body: JSON.stringify({ dtLocal: { id: Number(restaurantId) } }),
  })
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

export function getRestaurantProduct(restaurant, productId) {
  return restaurant.products.find((product) => product.id === Number(productId)) ?? null
}

export function buildRestaurantPath(restaurantId, dishId) {
  const path = `/local/${restaurantId}`
  return dishId ? `${path}?plato=${dishId}` : path
}

export function isRestaurantOpen(restaurant) {
  return Boolean(restaurant?.isOpen)
}
