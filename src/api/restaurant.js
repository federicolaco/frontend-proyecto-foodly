import { apiFetch, isApiConfigured } from './client'
import { buildLocalListBody } from './backend/helpers'
import { mapLocalListItem, mapRestaurantDetail } from './backend/mappers'
import { mockGetRestaurantById } from './mock/ordersMock'

async function fetchLocalSummary(restaurantId) {
  const data = await apiFetch('/clientes/listar_locales', {
    method: 'POST',
    body: JSON.stringify({}),
  })
  return (data ?? []).find((local) => local.id === Number(restaurantId)) ?? null
}

async function fetchLocalDishes(restaurantId) {
  const response = await apiFetch('/clientes/busqueda', {
    method: 'POST',
    body: JSON.stringify({ dtLocal: { id: Number(restaurantId) } }),
  })

  const platos = response?.platos ?? []
  const promociones = response?.promociones ?? []

  const ahora = new Date()
  const promoPorPlato = new Map(
    promociones
      .filter(p =>
        new Date(p.fechaInicio) <= ahora &&
        new Date(p.fechaFin) >= ahora
      )
      .map(p => [p.dtPlato.id, p])
  )

  return platos.map(plato => {
    const promo = promoPorPlato.get(plato.id)
    return {
      ...plato,
      precioFinal: promo
        ? plato.precio * (1 - promo.descuento / 100)
        : plato.precio,
      tienePromocion: !!promo,
    }
  })
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
