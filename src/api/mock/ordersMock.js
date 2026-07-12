import burgerCardImg from '../../../img/burger-card.png'
import pizzaCardImg from '../../../img/pizza-card.png'
import pastaCardImg from '../../../img/pasta-card.png'
import milanesaCardImg from '../../../img/milanesa-card.png'
import iceCreamCardImg from '../../../img/ice-cream-card.png'
import sushiCardImg from '../../../img/sushi-card.png'
import { getDb, nextId, updateDb } from './db'
import { mockDelay, MockApiError } from './helpers'
import { ensureMockDb } from './seed'
import { mockGetUserFromToken } from './authMock'

const PLACEHOLDER_IMAGES = [
  burgerCardImg,
  pizzaCardImg,
  pastaCardImg,
  sushiCardImg,
  milanesaCardImg,
  iceCreamCardImg,
]

export function getMockPlaceholderImage(index = 0) {
  return PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length]
}

function buildMockMercadoPagoInitPoint(orderId) {
  return `/pago/pendiente?external_reference=${orderId}`
}

function mapMockClientOrder(order) {
  const isPaymentPending =
    order.paymentMethod === 'mercadopago' &&
    order.status === 'pending' &&
    order.paid === false
  const estadoVisible = isPaymentPending ? 'Pendiente de pago' : null
  const mpInitPoint = isPaymentPending
    ? order.mpInitPoint ?? buildMockMercadoPagoInitPoint(order.id)
    : order.mpInitPoint ?? null

  return {
    ...order,
    estadoVisible,
    visibleStatus: estadoVisible,
    pagoPendiente: isPaymentPending,
    paymentPending: isPaymentPending,
    permiteReintentarPago: isPaymentPending,
    canRetryPayment: isPaymentPending,
    mpInitPoint,
  }
}

function requireClient(token) {
  const user = mockGetUserFromToken(token)
  if (!user) throw new MockApiError(401, 'Sesión inválida')
  if (user.blocked) throw new MockApiError(403, 'Cuenta suspendida')
  if (user.role !== 'cliente') throw new MockApiError(403, 'Solo clientes pueden realizar pedidos')
  return user
}

function getDishCategory(db, restaurantId, categoryId) {
  if (categoryId == null || categoryId === '') return null

  return db.categories.find(
    (category) =>
      Number(category.localId) === Number(restaurantId) &&
      String(category.id) === String(categoryId),
  ) ?? null
}

function sameCategory(left, right) {
  return String(left ?? '') === String(right ?? '')
}

function buildDishListItem(dish, db) {
  const restaurant = db.restaurants.find((r) => r.id === dish.restaurantId)
  const category = getDishCategory(db, dish.restaurantId, dish.categoryId)

  return {
    id: dish.id,
    restaurantId: dish.restaurantId,
    name: dish.name,
    restaurant: restaurant?.name ?? 'Local',
    image: dish.image ?? getMockPlaceholderImage(dish.id),
    price: dish.price,
    categoryId: category ? String(category.id) : '',
    categoryName: category?.name ?? 'Sin categoria',
  }
}

function buildPromotionListItem(promo, db) {
  const dish = db.dishes.find((d) => d.id === promo.dishId)
  const restaurant = db.restaurants.find((r) => r.id === promo.restaurantId)
  const basePrice = dish?.price ?? 0
  const discountedPrice = Math.round(basePrice * (1 - promo.discountPercent / 100))

  return {
    id: `promo-${promo.id}`,
    promotionId: promo.id,
    dishId: promo.dishId,
    restaurantId: promo.restaurantId,
    name: promo.title,
    restaurant: restaurant?.name ?? 'Local',
    image: dish?.image ?? getMockPlaceholderImage(promo.id),
    price: discountedPrice,
    originalPrice: basePrice,
    discountPercent: promo.discountPercent,
    isPromotion: true,
  }
}

function buildPromotedDishListItem(promo, db) {
  const dish = db.dishes.find((d) => d.id === promo.dishId)
  const restaurant = db.restaurants.find((r) => r.id === promo.restaurantId)
  const category = dish ? getDishCategory(db, dish.restaurantId, dish.categoryId) : null
  const basePrice = dish?.price ?? 0
  const discountedPrice = Math.round(basePrice * (1 - promo.discountPercent / 100))
  const dishId = dish?.id ?? promo.dishId ?? `promo-dish-${promo.id}`

  return {
    id: dishId,
    dishId,
    promotionId: promo.id,
    restaurantId: promo.restaurantId,
    name: dish?.name ?? promo.title,
    restaurant: restaurant?.name ?? 'Local',
    image: dish?.image ?? getMockPlaceholderImage(promo.id),
    price: discountedPrice,
    originalPrice: basePrice,
    discountPercent: promo.discountPercent,
    isPromotion: true,
    promotionTitle: promo.title,
    categoryId: category ? String(category.id) : '',
    categoryName: category?.name ?? 'Sin categoria',
  }
}

function mergeDishWithPromotion(baseDish, promotedDish) {
  if (!baseDish) return promotedDish
  if (!promotedDish) return baseDish

  const basePrice = Number(baseDish.originalPrice ?? baseDish.price ?? 0)
  const promotedPrice = Number(promotedDish.price ?? 0)
  const currentPrice = Number(baseDish.price ?? 0)

  const shouldReplaceCurrent =
    !baseDish.isPromotion ||
    promotedPrice < currentPrice ||
    (promotedPrice === currentPrice &&
      Number(promotedDish.discountPercent ?? 0) > Number(baseDish.discountPercent ?? 0))

  if (!shouldReplaceCurrent) return baseDish

  return {
    ...baseDish,
    ...promotedDish,
    id: baseDish.id,
    dishId: promotedDish.dishId ?? baseDish.id,
    originalPrice: basePrice || promotedDish.originalPrice,
    categoryId: baseDish.categoryId ?? promotedDish.categoryId,
    categoryName: baseDish.categoryName ?? promotedDish.categoryName,
  }
}

export function mockGetEnabledRestaurants(filters = {}) {
  ensureMockDb()
  const db = getDb()
  let restaurants = db.restaurants.filter((r) => r.enabled)

  if (filters.search) {
    const q = filters.search.toLowerCase()
    restaurants = restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.foodType?.toLowerCase().includes(q),
    )
  }

  if (filters.openOnly) {
    restaurants = restaurants.filter((r) => r.isOpen)
  }

  if (filters.minRating) {
    restaurants = restaurants.filter((r) => r.rating >= Number(filters.minRating))
  }

  if (filters.sort === 'rating') {
    restaurants.sort((a, b) => b.rating - a.rating)
  } else if (filters.sort === 'name') {
    restaurants.sort((a, b) => a.name.localeCompare(b.name))
  }

  return mockDelay(
    restaurants.map(({ id, name, logo, isOpen, rating, foodType }) => ({
      id,
      name,
      logo: logo ?? null,
      isOpen,
      rating,
      foodType,
    })),
  )
}

export function mockSearchDishesAndPromotions(query = '', options = {}) {
  ensureMockDb()
  const db = getDb()
  const normalized = query.trim().toLowerCase()
  const today = new Date().toISOString().slice(0, 10)

  let dishes = db.dishes.filter((dish) => {
    const restaurant = db.restaurants.find((r) => r.id === dish.restaurantId)
    return dish.active && restaurant?.enabled
  })

  let promotions = db.promotions.filter((promo) => {
    const restaurant = db.restaurants.find((r) => r.id === promo.restaurantId)
    return promo.active && restaurant?.enabled && promo.startDate <= today && promo.endDate >= today
  })

  if (normalized) {
    dishes = dishes.filter((dish) => {
      const restaurant = db.restaurants.find((r) => r.id === dish.restaurantId)
      return (
        dish.name.toLowerCase().includes(normalized) ||
        restaurant?.name.toLowerCase().includes(normalized)
      )
    })

    promotions = promotions.filter((promo) =>
      promo.title.toLowerCase().includes(normalized),
    )
  }

  if (options.category) {
    dishes = dishes.filter((dish) => sameCategory(dish.categoryId, options.category))
  }

  const dishMap = new Map(
    dishes.map((dish) => {
      const dishItem = buildDishListItem(dish, db)
      return [dishItem.id, dishItem]
    }),
  )

  promotions.forEach((promo) => {
    const promotedDish = buildPromotedDishListItem(promo, db)
    dishMap.set(
      promotedDish.id,
      mergeDishWithPromotion(dishMap.get(promotedDish.id), promotedDish),
    )
  })

  let combined = Array.from(dishMap.values())

  if (options.promotionsOnly) {
    combined = combined.filter((item) => item.isPromotion)
  }

  if (options.category) {
    combined = combined.filter((item) => sameCategory(item.categoryId, options.category))
  }

  if (options.maxPrice) {
    combined = combined.filter((item) => item.price <= Number(options.maxPrice))
  }

  if (options.sort === 'price-asc') {
    combined.sort((a, b) => a.price - b.price)
  } else if (options.sort === 'price-desc') {
    combined.sort((a, b) => b.price - a.price)
  } else if (options.sort === 'name') {
    combined.sort((a, b) => a.name.localeCompare(b.name))
  }

  return mockDelay(combined)
}

export function mockGetMostOrdered(limit = 4) {
  ensureMockDb()
  const db = getDb()

  const counts = {}
  db.orders
    .filter((order) => order.status === 'confirmed')
    .forEach((order) => {
      order.items.forEach((item) => {
        counts[item.id] = (counts[item.id] ?? 0) + item.quantity
      })
    })

  const ranked = db.dishes
    .filter((dish) => dish.active)
    .map((dish) => ({ dish, count: counts[dish.id] ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(({ dish }) => buildDishListItem(dish, db))

  if (ranked.length >= limit) return mockDelay(ranked)

  const fallback = db.dishes
    .filter((dish) => dish.active)
    .slice(0, limit)
    .map((dish) => buildDishListItem(dish, db))

  return mockDelay(fallback)
}

export function mockGetRestaurantById(restaurantId) {
  ensureMockDb()
  const db = getDb()
  const restaurant = db.restaurants.find((r) => r.id === Number(restaurantId))

  if (!restaurant || !restaurant.enabled) {
    throw new MockApiError(404, 'Restaurante no encontrado')
  }

  const products = db.dishes
    .filter((dish) => dish.restaurantId === restaurant.id && dish.active)
    .map((dish) => {
      const category = getDishCategory(db, dish.restaurantId, dish.categoryId)

      return {
        id: dish.id,
        categoryId: category ? String(category.id) : '',
        categoryName: category?.name ?? 'Sin categoria',
        name: dish.name,
        description: dish.description,
        price: dish.price,
        image: dish.image ?? getMockPlaceholderImage(dish.id),
      }
    })

  return mockDelay({
    ...restaurant,
    products,
  })
}

export function mockCreateOrder(token, payload) {
  ensureMockDb()
  const user = requireClient(token)
  const paymentMethod = payload.paymentMethod ?? 'mercadopago'

  if (!payload.items?.length) {
    throw new MockApiError(400, 'Debe agregar al menos un plato para realizar el pedido.')
  }

  for (const item of payload.items) {
    if (!item.quantity || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      throw new MockApiError(400, 'La cantidad debe ser un número entero mayor a cero.')
    }
  }

  const db = getDb()
  const restaurant = db.restaurants.find((r) => r.id === Number(payload.restaurantId))

  if (!restaurant?.enabled) {
    throw new MockApiError(404, 'Local no encontrado')
  }

  if (!restaurant.isOpen) {
    throw new MockApiError(
      400,
      'Lo sentimos, el local seleccionado cerró y no acepta más pedidos por el momento.',
    )
  }

  const total = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const result = updateDb((dbInner) => {
    const orderId = nextId(dbInner, 'order')
    const order = {
      id: orderId,
      clientId: user.id,
      clientName: user.name,
      clientPhone: user.cellphone ?? null,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      restaurantPhone: restaurant.telefonoFijo ?? null,
      paymentMethod,
      items: payload.items,
      total,
      status: 'pending',
      paid: paymentMethod === 'efectivo',
      createdAt: new Date().toISOString(),
      mpInitPoint:
        paymentMethod === 'mercadopago'
          ? buildMockMercadoPagoInitPoint(orderId)
          : null,
    }

    dbInner.orders.push(order)
    return order
  })

  return mockDelay(mapMockClientOrder(result))
}

export function mockGetClientOrders(token, filters = {}) {
  ensureMockDb()
  const user = requireClient(token)
  const db = getDb()

  let orders = db.orders.filter((order) => order.clientId === user.id)

  if (filters.status) {
    orders = orders.filter((order) => order.status === filters.status)
  }

  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  return mockDelay(orders.map(mapMockClientOrder))
}

export function mockCancelClientOrder(token, orderId) {
  ensureMockDb()
  const user = requireClient(token)

  const result = updateDb((db) => {
    const order = db.orders.find(
      (entry) => entry.id === Number(orderId) && entry.clientId === user.id,
    )
    if (!order) throw new MockApiError(404, 'Pedido no encontrado')

    if (order.status !== 'pending') {
      throw new MockApiError(
        400,
        'No es posible cancelar este pedido porque ya fue confirmado por el local.',
      )
    }

    order.status = 'cancelled'
    order.cancelledAt = new Date().toISOString()
    return order
  })

  return mockDelay(result)
}

export function mockRetryClientOrderPayment(token, orderId) {
  ensureMockDb()
  const user = requireClient(token)

  const order = getDb().orders.find(
    (entry) => entry.id === Number(orderId) && entry.clientId === user.id,
  )

  if (!order) throw new MockApiError(404, 'Pedido no encontrado')

  if (order.paymentMethod !== 'mercadopago' || order.status !== 'pending' || order.paid !== false) {
    throw new MockApiError(400, 'Este pedido no admite reintentar el pago.')
  }

  return mockDelay(mapMockClientOrder(order))
}
