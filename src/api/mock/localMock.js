import { getDb, nextId, updateDb } from './db'
import { mockDelay, MockApiError } from './helpers'
import { ensureMockDb } from './seed'
import { mockGetUserFromToken } from './authMock'

function requireUser(token) {
  const user = mockGetUserFromToken(token)
  if (!user) throw new MockApiError(401, 'Sesión inválida')
  if (user.blocked) throw new MockApiError(403, 'Cuenta suspendida')
  return user
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
        categories: [{ id: 'general', label: 'GENERAL' }],
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
    db.dishes.filter((dish) => dish.restaurantId === user.restaurantId),
  )
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
    throw new MockApiError(400, 'El precio debe ser un valor numérico mayor a cero.')
  }

  const result = updateDb((db) => {
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
        categoryId: dishPayload.categoryId ?? db.dishes[index].categoryId,
        active: dishPayload.active ?? db.dishes[index].active,
      }
      return db.dishes[index]
    }

    const dish = {
      id: nextId(db, 'dish'),
      restaurantId: user.restaurantId,
      categoryId: dishPayload.categoryId ?? 'general',
      name: dishPayload.name.trim(),
      description: dishPayload.description?.trim() ?? '',
      price: Number(dishPayload.price),
      image: dishPayload.image ?? null,
      active: true,
    }

    db.dishes.push(dish)
    return dish
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
  return mockDelay(
    db.promotions.filter((promo) => promo.restaurantId === user.restaurantId),
  )
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
