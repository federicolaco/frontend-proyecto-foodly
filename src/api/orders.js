import burgerCardImg from '../../img/burger-card.png'
import pizzaCardImg from '../../img/pizza-card.png'
import pastaCardImg from '../../img/pasta-card.png'
import sushiCardImg from '../../img/sushi-card.png'
import milanesaCardImg from '../../img/milanesa-card.png'
import iceCreamCardImg from '../../img/ice-cream-card.png'
import { getSessionToken, getStoredUser } from '../lib/auth'
import { apiFetch, apiFetchSafe, isApiConfigured } from './client'
import {
  buildLocalListParams,
  buildOrderListParams,
  buildSearchParams,
  getUserDeliveryAddress,
  mapPagedResponse,
} from './backend/helpers'
import {
  buildOrderPayload,
  mapLocalListItem,
  mapOrderListItem,
  mapPlatoListItem,
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

const CLIENT_CATALOG_PAGE_SIZE = 10
const SEARCH_FETCH_PAGE_SIZE = 100
let latestCatalogSnapshot = { key: '', items: [] }

export function getPlaceholderImage(index = 0) {
  return MOCK_IMAGES[index % MOCK_IMAGES.length]
}

function normalizeCategoryName(value) {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es')
}

function buildCatalogCategories(items = []) {
  const categoryMap = new Map()

  items.forEach((item) => {
    const name = typeof item?.categoryName === 'string' ? item.categoryName.trim() : ''
    const key = normalizeCategoryName(name)

    // En el catálogo global del cliente puede haber categorías con el mismo
    // nombre en locales distintos. Para no duplicar opciones indistinguibles
    // ("Hamburguesas" dos veces), la UI agrupa por nombre normalizado.
    if (!key || key === 'sin categoria') return

    if (!categoryMap.has(key)) {
      categoryMap.set(key, { key, name })
    }
  })

  return Array.from(categoryMap.values()).sort((left, right) =>
    left.name.localeCompare(right.name, 'es', { sensitivity: 'base' }),
  )
}

function applyCategoryFilter(items = [], categoryKey = '') {
  const normalizedCategoryKey = normalizeCategoryName(categoryKey)
  if (!normalizedCategoryKey) return items

  return items.filter((item) => normalizeCategoryName(item?.categoryName) === normalizedCategoryKey)
}

function paginateCatalogItems(items = [], page = 0, pageSize = CLIENT_CATALOG_PAGE_SIZE) {
  const normalizedPageSize = Number(pageSize) > 0 ? Number(pageSize) : CLIENT_CATALOG_PAGE_SIZE
  const totalElements = items.length
  const totalPages = Math.max(1, Math.ceil(totalElements / normalizedPageSize))
  const requestedPage = Number.isInteger(page) ? page : Number(page) || 0
  const safePage = Math.min(Math.max(requestedPage, 0), totalPages - 1)
  const start = safePage * normalizedPageSize

  return {
    items: items.slice(start, start + normalizedPageSize),
    page: safePage,
    totalPages,
    totalElements,
  }
}

function buildCatalogResult(items = [], options = {}) {
  const categories = buildCatalogCategories(items)
  const filteredItems = applyCategoryFilter(items, options.category)
  const paginated = paginateCatalogItems(
    filteredItems,
    options.page,
    options.pageSize ?? CLIENT_CATALOG_PAGE_SIZE,
  )

  return {
    ...paginated,
    categories,
  }
}

function getSearchRequestOptions(options = {}, overrides = {}) {
  return {
    promotionsOnly: options.promotionsOnly,
    sort: options.sort,
    maxPrice: options.maxPrice,
    localId: options.localId,
    ...overrides,
  }
}

function buildCatalogSnapshotKey(query = '', options = {}) {
  return JSON.stringify({
    query: query.trim(),
    promotionsOnly: Boolean(options.promotionsOnly),
    sort: options.sort ?? '',
    maxPrice: options.maxPrice ?? '',
    localId: options.localId ?? '',
  })
}

async function fetchSearchResponse(query = '', options = {}) {
  const params = buildSearchParams(query, options)
  const qs = params.toString()
  return apiFetch(`/clientes/busqueda${qs ? `?${qs}` : ''}`)
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
  const snapshotKey = buildCatalogSnapshotKey(query, options)

  if (latestCatalogSnapshot.key === snapshotKey) {
    return buildCatalogResult(latestCatalogSnapshot.items, options)
  }

  if (isApiConfigured()) {
    const requestOptions = getSearchRequestOptions(options, {
      page: 0,
      pageSize: SEARCH_FETCH_PAGE_SIZE,
    })

    try {
      const firstResponse = await fetchSearchResponse(query, requestOptions)
      const backendTotalPages = Math.max(Number(firstResponse?.totalPaginas ?? 1), 1)
      const remainingPages = Array.from({ length: backendTotalPages - 1 }, (_, index) => index + 1)
      const remainingResponses = await Promise.all(
        remainingPages.map((page) =>
          fetchSearchResponse(
            query,
            getSearchRequestOptions(options, {
              page,
              pageSize: SEARCH_FETCH_PAGE_SIZE,
            }),
          ),
        ),
      )

      const responses = [firstResponse, ...remainingResponses]
      const items = responses.flatMap((response, index) =>
        mapSearchResults(response, requestOptions, index * SEARCH_FETCH_PAGE_SIZE),
      )

      latestCatalogSnapshot = { key: snapshotKey, items }
      return buildCatalogResult(items, options)
    } catch (err) {
      // El backend responde 400 cuando la búsqueda no encuentra ningún plato
      // ni promoción; para el usuario eso es simplemente "sin resultados",
      // no una falla real.
      if (err.status === 400) {
        latestCatalogSnapshot = { key: snapshotKey, items: [] }
        return buildCatalogResult([], options)
      }
      throw err
    }
  }

  const mockItems = await mockSearchDishesAndPromotions(query, getSearchRequestOptions(options))
  latestCatalogSnapshot = { key: snapshotKey, items: mockItems }
  return buildCatalogResult(mockItems, options)
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
