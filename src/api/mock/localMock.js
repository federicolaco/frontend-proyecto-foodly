import { getDb, nextId, updateDb } from './db'
import { mockDelay, MockApiError } from './helpers'
import { ensureMockDb } from './seed'
import { mockGetUserFromToken } from './authMock'

const DEFAULT_LOCAL_STATS_PRESET = 'MES_ACTUAL'
const LOCAL_STATS_LIMIT = 5
const STATS_AMBIGUOUS_MESSAGE = 'Debe enviar un preset o un rango libre, pero no ambos.'
const STATS_INCOMPLETE_RANGE_MESSAGE = 'Para usar rango libre debe indicar fechaDesde y fechaHasta.'
const STATS_INVALID_RANGE_MESSAGE = 'La fechaDesde no puede ser posterior a fechaHasta.'
const STATS_EMPTY_MESSAGE = 'No hay ventas para el período seleccionado.'

function requireUser(token) {
  const user = mockGetUserFromToken(token)
  if (!user) throw new MockApiError(401, 'Sesión inválida')
  if (user.blocked) throw new MockApiError(403, 'Cuenta suspendida')
  return user
}

function createLocalDate(base = new Date()) {
  const date = new Date(base)
  date.setHours(12, 0, 0, 0)
  return date
}

function shiftDays(base, amount) {
  const date = createLocalDate(base)
  date.setDate(date.getDate() + amount)
  return date
}

function firstDayOfMonth(base) {
  const date = createLocalDate(base)
  date.setDate(1)
  return date
}

function lastDayOfMonth(base) {
  const date = firstDayOfMonth(base)
  date.setMonth(date.getMonth() + 1)
  date.setDate(0)
  return date
}

function formatIsoDate(date) {
  const safeDate = createLocalDate(date)
  const year = safeDate.getFullYear()
  const month = String(safeDate.getMonth() + 1).padStart(2, '0')
  const day = String(safeDate.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function resolveMockStatsPreset(preset) {
  const today = createLocalDate()

  switch (preset) {
    case 'HOY':
      return { fechaDesde: formatIsoDate(today), fechaHasta: formatIsoDate(today) }
    case 'ULTIMOS_7_DIAS':
      return { fechaDesde: formatIsoDate(shiftDays(today, -6)), fechaHasta: formatIsoDate(today) }
    case 'ULTIMOS_30_DIAS':
      return { fechaDesde: formatIsoDate(shiftDays(today, -29)), fechaHasta: formatIsoDate(today) }
    case 'MES_ANTERIOR': {
      const currentMonthFirstDay = firstDayOfMonth(today)
      const previousMonthLastDay = shiftDays(currentMonthFirstDay, -1)
      return {
        fechaDesde: formatIsoDate(firstDayOfMonth(previousMonthLastDay)),
        fechaHasta: formatIsoDate(lastDayOfMonth(previousMonthLastDay)),
      }
    }
    case 'MES_ACTUAL':
    default:
      return { fechaDesde: formatIsoDate(firstDayOfMonth(today)), fechaHasta: formatIsoDate(today) }
  }
}

function resolveMockStatsPeriod(filters = {}) {
  const preset = typeof filters.preset === 'string' ? filters.preset.trim() : ''
  const fechaDesde = typeof filters.fechaDesde === 'string' ? filters.fechaDesde.trim() : ''
  const fechaHasta = typeof filters.fechaHasta === 'string' ? filters.fechaHasta.trim() : ''
  const hasFreeRange = Boolean(fechaDesde || fechaHasta)

  if (preset && hasFreeRange) {
    throw new MockApiError(400, STATS_AMBIGUOUS_MESSAGE)
  }

  if (hasFreeRange) {
    if (!fechaDesde || !fechaHasta) {
      throw new MockApiError(400, STATS_INCOMPLETE_RANGE_MESSAGE)
    }

    if (fechaDesde > fechaHasta) {
      throw new MockApiError(400, STATS_INVALID_RANGE_MESSAGE)
    }

    return { fechaDesde, fechaHasta }
  }

  return resolveMockStatsPreset(preset || DEFAULT_LOCAL_STATS_PRESET)
}

function getOrderDateOnly(order) {
  const rawDate = order?.createdAt ?? order?.confirmedAt ?? null
  return typeof rawDate === 'string' ? rawDate.split('T')[0] : null
}

function getYearMonthKey(isoDate) {
  return typeof isoDate === 'string' ? isoDate.slice(0, 7) : null
}

function normalizeCategoryName(value = '') {
  return String(value).trim().replace(/\s+/g, ' ')
}

function findCategoryById(db, localId, categoryId) {
  if (categoryId == null || categoryId === '') return null
  return db.categories.find(
    (category) =>
      Number(category.localId) === Number(localId) &&
      String(category.id) === String(categoryId),
  ) ?? null
}

function findCategoryByName(db, localId, categoryName) {
  const normalizedName = normalizeCategoryName(categoryName).toLowerCase()
  if (!normalizedName) return null

  return db.categories.find(
    (category) =>
      Number(category.localId) === Number(localId) &&
      normalizeCategoryName(category.name).toLowerCase() === normalizedName,
  ) ?? null
}

function mapCategoryForClient(category) {
  if (!category) return null
  return {
    id: category.id,
    name: category.name,
  }
}

function mapMockDish(db, dish) {
  const category = findCategoryById(db, dish.restaurantId, dish.categoryId)

  return {
    ...dish,
    categoryId: category ? String(category.id) : '',
    categoryName: category?.name ?? 'Sin categoria',
  }
}

function resolveDishCategory(db, localId, categoryId) {
  if (categoryId == null || categoryId === '') return null

  const category = findCategoryById(db, localId, categoryId)
  if (!category) {
    throw new MockApiError(400, 'La categoria seleccionada no pertenece al local.')
  }

  return category
}

export function mockSubmitLocalRequest(token, payload) {
  ensureMockDb()
  const user = requireUser(token)

  if (user.role !== 'local' && user.role !== 'cliente') {
    throw new MockApiError(403, 'No tiene permisos para solicitar registro de local')
  }

  const result = updateDb((db) => {
    const duplicateName = db.restaurants.some(
      (r) => r.name.toLowerCase() === payload.name.trim().toLowerCase() && r.enabled,
    )
    if (duplicateName) {
      throw new MockApiError(409, 'El nombre del local ya está registrado.')
    }

    const pending = db.localRequests.find(
      (req) => req.userId === user.id && req.status === 'pending',
    )
    if (pending) {
      throw new MockApiError(409, 'Ya tiene una solicitud pendiente de revisión.')
    }

    const request = {
      id: nextId(db, 'localRequest'),
      userId: user.id,
      name: payload.name.trim(),
      email: payload.email.trim(),
      address: payload.address.trim(),
      description: payload.description.trim(),
      imageCount: payload.imageCount ?? 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    db.localRequests.push(request)

    const userIndex = db.users.findIndex((entry) => entry.id === user.id)
    if (userIndex >= 0) {
      db.users[userIndex].role = 'local'
      db.users[userIndex].localEnabled = false
    }

    return request
  })

  return mockDelay(result)
}

export function mockGetPendingLocalRequests(token) {
  ensureMockDb()
  const admin = mockGetUserFromToken(token)
  if (!admin || admin.role !== 'admin') throw new MockApiError(403, 'Acceso denegado')

  const db = getDb()
  return mockDelay(
    db.localRequests
      .filter((req) => req.status === 'pending')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  )
}

export function mockResolveLocalRequest(token, requestId, action) {
  ensureMockDb()
  const admin = requireUser(token)
  if (admin.role !== 'admin') throw new MockApiError(403, 'Acceso denegado')

  const result = updateDb((db) => {
    const request = db.localRequests.find((req) => req.id === Number(requestId))
    if (!request) throw new MockApiError(404, 'Solicitud no encontrada')
    if (request.status !== 'pending') {
      throw new MockApiError(400, 'La solicitud ya fue resuelta')
    }

    request.status = action === 'approve' ? 'approved' : 'rejected'
    request.resolvedAt = new Date().toISOString()

    const userIndex = db.users.findIndex((entry) => entry.id === request.userId)
    if (userIndex < 0) throw new MockApiError(404, 'Usuario solicitante no encontrado')

    if (action === 'approve') {
      const restaurantId = nextId(db, 'restaurant')
      db.restaurants.push({
        id: restaurantId,
        name: request.name,
        ownerUserId: request.userId,
        enabled: true,
        isOpen: false,
        rating: 0,
        reviews: 0,
        hours: 'A definir',
        deliveryTime: '30-40 minutos',
        image: null,
        foodType: request.description.slice(0, 40),
      })

      db.users[userIndex].localEnabled = true
      db.users[userIndex].restaurantId = restaurantId
      db.users[userIndex].role = 'local'
    } else {
      db.users[userIndex].localEnabled = false
    }

    return request
  })

  return mockDelay(result)
}

export function mockGetLocalRestaurant(token) {
  ensureMockDb()
  const user = requireUser(token)
  if (user.role !== 'local' || !user.localEnabled || !user.restaurantId) {
    throw new MockApiError(403, 'Local no habilitado')
  }

  const db = getDb()
  const restaurant = db.restaurants.find((r) => r.id === user.restaurantId)
  if (!restaurant) throw new MockApiError(404, 'Local no encontrado')

  return mockDelay(restaurant)
}

export function mockSetLocalOpenState(token, isOpen) {
  ensureMockDb()
  const user = requireUser(token)
  if (user.role !== 'local' || !user.restaurantId) {
    throw new MockApiError(403, 'Acceso denegado')
  }

  const result = updateDb((db) => {
    const restaurant = db.restaurants.find((r) => r.id === user.restaurantId)
    if (!restaurant) throw new MockApiError(404, 'Local no encontrado')

    if (isOpen && restaurant.isOpen) {
      throw new MockApiError(400, 'El local ya se encuentra registrado como abierto para el día de hoy.')
    }

    if (!isOpen && !restaurant.isOpen) {
      throw new MockApiError(400, 'El local ya está cerrado.')
    }

    if (!isOpen) {
      const pendingCount = db.orders.filter(
        (order) => order.restaurantId === user.restaurantId && order.status === 'pending',
      ).length
      restaurant.pendingOrdersOnClose = pendingCount
    }

    restaurant.isOpen = isOpen
    restaurant.openChangedAt = new Date().toISOString()
    return restaurant
  })

  return mockDelay(result)
}

export function mockGetLocalDishes(token) {
  ensureMockDb()
  const user = requireUser(token)
  if (user.role !== 'local' || !user.restaurantId) {
    throw new MockApiError(403, 'Acceso denegado')
  }

  const db = getDb()
  return mockDelay(
    db.dishes
      .filter((dish) => dish.restaurantId === user.restaurantId)
      .map((dish) => mapMockDish(db, dish)),
  )
}

export function mockGetLocalCategories(token) {
  ensureMockDb()
  const user = requireUser(token)
  if (user.role !== 'local' || !user.restaurantId) {
    throw new MockApiError(403, 'Acceso denegado')
  }

  const db = getDb()
  return mockDelay(
    db.categories
      .filter((category) => Number(category.localId) === Number(user.restaurantId))
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(mapCategoryForClient),
  )
}

export function mockCreateLocalCategory(token, nombre) {
  ensureMockDb()
  const user = requireUser(token)
  if (user.role !== 'local' || !user.restaurantId) {
    throw new MockApiError(403, 'Acceso denegado')
  }

  const normalizedName = normalizeCategoryName(nombre)
  if (!normalizedName) {
    throw new MockApiError(400, 'El nombre de la categoria es obligatorio.')
  }

  const result = updateDb((db) => {
    const existingCategory = findCategoryByName(db, user.restaurantId, normalizedName)
    if (existingCategory) {
      throw new MockApiError(409, 'Ya existe una categoria con ese nombre para este local.')
    }

    const category = {
      id: nextId(db, 'category'),
      localId: user.restaurantId,
      name: normalizedName,
    }

    db.categories.push(category)
    return mapCategoryForClient(category)
  })

  return mockDelay(result)
}

export function mockSaveDish(token, dishPayload) {
  ensureMockDb()
  const user = requireUser(token)
  if (user.role !== 'local' || !user.restaurantId) {
    throw new MockApiError(403, 'Acceso denegado')
  }

  if (!dishPayload.name?.trim()) {
    throw new MockApiError(400, 'El nombre del plato es obligatorio.')
  }

  if (!dishPayload.price || Number(dishPayload.price) <= 0) {
    throw new MockApiError(400, 'El precio debe ser un valor num??rico mayor a cero.')
  }

  const result = updateDb((db) => {
    const category = resolveDishCategory(db, user.restaurantId, dishPayload.categoryId)

    if (dishPayload.id) {
      const index = db.dishes.findIndex(
        (dish) => dish.id === Number(dishPayload.id) && dish.restaurantId === user.restaurantId,
      )
      if (index < 0) throw new MockApiError(404, 'Plato no encontrado')

      db.dishes[index] = {
        ...db.dishes[index],
        name: dishPayload.name.trim(),
        description: dishPayload.description?.trim() ?? '',
        price: Number(dishPayload.price),
        categoryId: category?.id ?? null,
        active: dishPayload.active ?? db.dishes[index].active,
      }
      return mapMockDish(db, db.dishes[index])
    }

    const dish = {
      id: nextId(db, 'dish'),
      restaurantId: user.restaurantId,
      categoryId: category?.id ?? null,
      name: dishPayload.name.trim(),
      description: dishPayload.description?.trim() ?? '',
      price: Number(dishPayload.price),
      image: dishPayload.image ?? null,
      active: true,
    }

    db.dishes.push(dish)
    return mapMockDish(db, dish)
  })

  return mockDelay(result)
}

export function mockDeleteDish(token, dishId) {
  ensureMockDb()
  const user = requireUser(token)
  if (user.role !== 'local' || !user.restaurantId) {
    throw new MockApiError(403, 'Acceso denegado')
  }

  const result = updateDb((db) => {
    const index = db.dishes.findIndex(
      (dish) => dish.id === Number(dishId) && dish.restaurantId === user.restaurantId,
    )
    if (index < 0) throw new MockApiError(404, 'Plato no encontrado')
    db.dishes[index].active = false
    return db.dishes[index]
  })

  return mockDelay(result)
}

export function mockGetLocalOrders(token, filters = {}) {
  ensureMockDb()
  const user = requireUser(token)
  if (user.role !== 'local' || !user.restaurantId) {
    throw new MockApiError(403, 'Acceso denegado')
  }

  const db = getDb()
  let orders = db.orders.filter((order) => order.restaurantId === user.restaurantId)

  if (filters.status) {
    orders = orders.filter((order) => order.status === filters.status)
  }

  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  return mockDelay(orders)
}

export function mockConfirmOrder(token, orderId, deliveryMinutes) {
  ensureMockDb()
  const user = requireUser(token)
  if (user.role !== 'local' || !user.restaurantId) {
    throw new MockApiError(403, 'Acceso denegado')
  }

  if (!deliveryMinutes || Number(deliveryMinutes) <= 0) {
    throw new MockApiError(400, 'Debe ingresar el tiempo estimado de entrega para confirmar el pedido.')
  }

  const result = updateDb((db) => {
    const order = db.orders.find(
      (entry) => entry.id === Number(orderId) && entry.restaurantId === user.restaurantId,
    )
    if (!order) throw new MockApiError(404, 'Pedido no encontrado')
    if (order.status !== 'pending') {
      throw new MockApiError(400, 'Solo se pueden confirmar pedidos pendientes')
    }

    order.status = 'confirmed'
    order.deliveryMinutes = Number(deliveryMinutes)
    order.confirmedAt = new Date().toISOString()
    order.paymentSimulated = true
    order.invoiceGenerated = true

    return order
  })

  return mockDelay(result)
}

export function mockRejectOrder(token, orderId, reason) {
  ensureMockDb()
  const user = requireUser(token)
  if (user.role !== 'local' || !user.restaurantId) {
    throw new MockApiError(403, 'Acceso denegado')
  }

  if (!reason?.trim()) {
    throw new MockApiError(400, 'Debe seleccionar o escribir un motivo de rechazo antes de continuar.')
  }

  const result = updateDb((db) => {
    const order = db.orders.find(
      (entry) => entry.id === Number(orderId) && entry.restaurantId === user.restaurantId,
    )
    if (!order) throw new MockApiError(404, 'Pedido no encontrado')
    if (order.status !== 'pending') {
      throw new MockApiError(400, 'Solo se pueden rechazar pedidos pendientes')
    }

    order.status = 'rejected'
    order.rejectionReason = reason.trim()
    order.rejectedAt = new Date().toISOString()

    return order
  })

  return mockDelay(result)
}

export function mockGetLocalPromotions(token) {
  ensureMockDb()
  const user = requireUser(token)
  if (user.role !== 'local' || !user.restaurantId) {
    throw new MockApiError(403, 'Acceso denegado')
  }

  const db = getDb()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const groups = db.promotions
    .filter((promo) => promo.restaurantId === user.restaurantId && promo.active !== false)
    .reduce((result, promo) => {
      const startDate = new Date(`${String(promo.startDate ?? promo.fechaInicio).split('T')[0]}T00:00:00`)
      const endDate = new Date(`${String(promo.endDate ?? promo.fechaFin).split('T')[0]}T00:00:00`)

      if (today < startDate) {
        result.proximas.push(promo)
        return result
      }

      if (today > endDate) {
        result.vencidas.push(promo)
        return result
      }

      result.vigentes.push(promo)
      return result
    }, {
      vigentes: [],
      vencidas: [],
      proximas: [],
    })

  return mockDelay(groups)
}

export function mockSavePromotion(token, payload) {
  ensureMockDb()
  const user = requireUser(token)
  if (user.role !== 'local' || !user.restaurantId) {
    throw new MockApiError(403, 'Acceso denegado')
  }

  const result = updateDb((db) => {
    if (payload.id) {
      const index = db.promotions.findIndex(
        (promo) => promo.id === Number(payload.id) && promo.restaurantId === user.restaurantId,
      )
      if (index < 0) throw new MockApiError(404, 'Promoción no encontrada')
      db.promotions[index] = { ...db.promotions[index], ...payload, restaurantId: user.restaurantId }
      return db.promotions[index]
    }

    const promo = {
      id: nextId(db, 'promotion'),
      restaurantId: user.restaurantId,
      dishId: Number(payload.dishId),
      title: payload.title.trim(),
      discountPercent: Number(payload.discountPercent),
      startDate: payload.startDate,
      endDate: payload.endDate,
      active: true,
    }
    db.promotions.push(promo)
    return promo
  })

  return mockDelay(result)
}

export function mockDeletePromotion(token, promotionId) {
  ensureMockDb()
  const user = requireUser(token)
  if (user.role !== 'local' || !user.restaurantId) {
    throw new MockApiError(403, 'Acceso denegado')
  }

  const result = updateDb((db) => {
    const index = db.promotions.findIndex(
      (promo) => promo.id === Number(promotionId) && promo.restaurantId === user.restaurantId,
    )
    if (index < 0) throw new MockApiError(404, 'Promoción no encontrada')
    db.promotions[index].active = false
    return db.promotions[index]
  })

  return mockDelay(result)
}

export function mockGetLocalStats(token, filters = {}) {
  ensureMockDb()
  const user = requireUser(token)
  if (user.role !== 'local' || !user.restaurantId) {
    throw new MockApiError(403, 'Acceso denegado')
  }

  const db = getDb()
  const { fechaDesde, fechaHasta } = resolveMockStatsPeriod(filters)
  const orders = db.orders.filter(
    (o) =>
      o.restaurantId === user.restaurantId &&
      ['confirmed', 'delivered'].includes(o.status) &&
      (() => {
        const orderDate = getOrderDateOnly(o)
        return orderDate && orderDate >= fechaDesde && orderDate <= fechaHasta
      })(),
  )

  const dishStats = {}
  const monthlySalesMap = {}
  orders.forEach((order) => {
    const orderDate = getOrderDateOnly(order)
    const yearMonthKey = getYearMonthKey(orderDate)
    if (yearMonthKey) {
      monthlySalesMap[yearMonthKey] = (monthlySalesMap[yearMonthKey] ?? 0) + Number(order.total ?? 0)
    }

    order.items?.forEach((item) => {
      const dishId = Number(item.id)
      if (!dishId) return

      const dish = db.dishes.find((entry) => entry.id === dishId)
      const quantity = Number(item.quantity ?? 0)
      const amount = Number(item.price ?? 0) * quantity

      if (!dishStats[dishId]) {
        dishStats[dishId] = {
          id: dishId,
          nombre: dish?.name ?? item.name ?? `Plato #${dishId}`,
          imagen: dish?.image ?? null,
          cantidadVendida: 0,
          montoVendido: 0,
        }
      }

      dishStats[dishId].cantidadVendida += quantity
      dishStats[dishId].montoVendido += amount
    })
  })

  const ventasConfirmadas = orders.reduce((sum, o) => sum + (o.total ?? 0), 0)
  const ventasPorPlato = Object.values(dishStats).sort((a, b) => {
    if (b.cantidadVendida !== a.cantidadVendida) return b.cantidadVendida - a.cantidadVendida
    if (b.montoVendido !== a.montoVendido) return b.montoVendido - a.montoVendido
    return a.id - b.id
  })
  const ventasMensuales = Object.entries(monthlySalesMap)
    .map(([yearMonth, amount]) => {
      const [year, month] = yearMonth.split('-')
      return {
        anio: Number(year),
        mes: Number(month),
        montoVendido: Number(amount),
      }
    })
    .sort((left, right) => {
      if (left.anio !== right.anio) return left.anio - right.anio
      return left.mes - right.mes
    })

  if (ventasPorPlato.length === 0) {
    throw new MockApiError(400, STATS_EMPTY_MESSAGE)
  }

  return mockDelay({
    fechaDesde,
    fechaHasta,
    ventasConfirmadas,
    platosMasPedido: ventasPorPlato.slice(0, LOCAL_STATS_LIMIT),
    ventasPorPlato,
    ventasMensuales,
  })
}
