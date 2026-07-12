import burgerCardImg from '../../../img/burger-card.png'
import pizzaCardImg from '../../../img/pizza-card.png'
import pastaCardImg from '../../../img/pasta-card.png'
import sushiCardImg from '../../../img/sushi-card.png'
import milanesaCardImg from '../../../img/milanesa-card.png'
import iceCreamCardImg from '../../../img/ice-cream-card.png'
import {
  formatAddress,
  mapBackendRole,
  mapBackendStatusToFrontend,
  normalizeAddress,
  parseDeliveryMinutes,
} from './helpers'

const PLACEHOLDER_IMAGES = [
  burgerCardImg,
  pizzaCardImg,
  pastaCardImg,
  sushiCardImg,
  milanesaCardImg,
  iceCreamCardImg,
]

function placeholder(index = 0) {
  return PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length]
}

function normalizeDishCategoryInfo(category) {
  if (category == null) {
    return { id: '', name: 'Sin categoria' }
  }

  if (typeof category === 'string') {
    const trimmed = category.trim()
    return {
      id: trimmed,
      name: trimmed || 'Sin categoria',
    }
  }

  if (typeof category === 'number') {
    return {
      id: String(category),
      name: `Categoria #${category}`,
    }
  }

  if (typeof category === 'object') {
    const rawName = category.nombre ?? category.name ?? category.label ?? category.categoryName
    const id = category.id ?? category.codigo ?? category.categoryId ?? rawName ?? ''
    const name = typeof rawName === 'string' ? rawName.trim() : rawName

    return {
      id: id == null || id === '' ? '' : String(id),
      name: name || (id != null && id !== '' ? `Categoria #${id}` : 'Sin categoria'),
    }
  }

  return { id: '', name: 'Sin categoria' }
}

function getDishCategoryInfo(plato) {
  const categorySource =
    plato?.dtCategoria ??
    plato?.categoria ??
    plato?.categoriaPlato ??
    plato?.category ??
    (plato?.categoryId != null || plato?.categoryName
      ? {
          id: plato?.categoryId ?? '',
          name: plato?.categoryName,
        }
      : null)

  return normalizeDishCategoryInfo(categorySource)
}

function getDishCategoryId(plato) {
  return getDishCategoryInfo(plato).id
}

function getDishCategoryName(plato) {
  return getDishCategoryInfo(plato).name
}

export function mapLoginResponse(data, extras = {}) {
  const role = mapBackendRole(data.tipo)
  const fullName = [data.nombre, data.apellido].filter(Boolean).join(' ').trim()
  const resolvedName = extras.name ?? (fullName || data.name || data.email)
  const addressSource =
    data.direccion ??
    data.addressDetails ??
    data.address ??
    data.dtDireccion ??
    null
  const addressNormalized = addressSource ? normalizeAddress(addressSource) : undefined

  return {
    token: data.token,
    user: {
      id: data.id,
      email: data.email,
      role,
      name: resolvedName,
      firstName: data.nombre ?? data.firstName,
      lastName: data.apellido ?? data.lastName,
      address: addressNormalized ? formatAddress(addressNormalized) : data.address,
      addressDetails: addressNormalized,
      localId: role === 'local' ? data.id : undefined,
      restaurantId: role === 'local' ? data.id : undefined,
      localEnabled: extras.localEnabled ?? role !== 'local',
      isOpen: role === 'local' ? Boolean(data.estaAbierto) : undefined,
      photo: data.foto ?? null,
    },
  }
}
export function mapClienteRegistrationPayload(payload) {
  return {
    email: payload.email.trim(),
    passwd: payload.password,
    nombre: payload.firstName.trim(),
    apellido: payload.lastName.trim(),
    documento: payload.document ?? `DOC${Date.now()}`,
    celular: payload.cellphone?.trim(),
    telefonoFijo: payload.landline?.trim() || null,
    direccion: payload.addressParsed,
  }
}

export function mapLocalRegistrationPayload(payload) {
  return {
    email: payload.email.trim(),
    passwd: payload.password,
    nombre: payload.name.trim(),
    descripcion: payload.description.trim(),
    direccion: payload.addressParsed,
    estaAbierto: false,
  }
}

export function mapLocalListItem(local) {
  const images = local.imagenes ?? []

  return {
    id: local.id,
    name: local.nombre,
    logo: local.foto ?? null,
    isOpen: Boolean(local.estaAbierto),
    rating: local.calificacionGlobal ?? 0,
    foodType: local.descripcion ?? '',
    description: local.descripcion ?? '',
    address: formatAddress(local.direccion),
    images,
  }
}

export function mapPlatoListItem(plato, index = 0) {
  const restaurantId = plato.dtLocal?.id ?? plato.local?.id
  const restaurant = plato.dtLocal ?? plato.local
  return {
    id: plato.id,
    restaurantId,
    name: plato.nombre,
    restaurant: restaurant?.nombre ?? 'Local',
    image: plato.imagen ?? placeholder(index),
    price: plato.precio ?? 0,
    categoryId: getDishCategoryId(plato),
    categoryName: getDishCategoryName(plato),
  }
}

export function mapPromocionListItem(promo, index = 0) {
  const plato = promo.dtPlato ?? promo.plato
  const restaurant = plato?.dtLocal ?? plato?.local
  const restaurantId = restaurant?.id
  const basePrice = plato?.precio ?? 0
  const discountPercent = promo.descuento ?? 0
  const discountedPrice =Math.round(basePrice * (1 - discountPercent / 100) * 100) / 100

  return {
    id: `promo-${promo.id}`,
    promotionId: promo.id,
    dishId: plato?.id,
    restaurantId,
    name: promo.descripcion ?? plato?.nombre ?? 'Promoción',
    restaurant: restaurant?.nombre ?? 'Local',
    image: plato?.imagen ?? placeholder(index),
    price: discountedPrice,
    originalPrice: basePrice,
    discountPercent,
    isPromotion: true,
  }
}

function mapPromotedDishListItem(promo, index = 0) {
  const plato = promo.dtPlato ?? promo.plato
  const restaurant = plato?.dtLocal ?? plato?.local
  const restaurantId = restaurant?.id
  const basePrice = plato?.precio ?? 0
  const discountPercent = promo.descuento ?? 0
  const discountedPrice = Math.round(basePrice * (1 - discountPercent / 100) * 100) / 100
  const dishId = plato?.id ?? promo.idPlato ?? `promo-dish-${promo.id}`

  return {
    id: dishId,
    dishId,
    promotionId: promo.id,
    restaurantId,
    name: plato?.nombre ?? promo.descripcion ?? 'Promoción',
    restaurant: restaurant?.nombre ?? 'Local',
    image: plato?.imagen ?? placeholder(index),
    price: discountedPrice,
    originalPrice: basePrice,
    discountPercent,
    isPromotion: true,
    promotionTitle: promo.descripcion ?? null,
    categoryId: getDishCategoryId(plato),
    categoryName: getDishCategoryName(plato),
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

export function mapSearchResults(response, options = {}, startIndex = 0) {
  const platos = (response?.platos ?? []).filter((plato) => plato.disponible !== false)
  const promociones = (response?.promociones ?? []).filter((promo) => {
    const plato = promo.dtPlato ?? promo.plato
    return plato?.disponible !== false
  })
  const dishMap = new Map(
    platos.map((plato, index) => {
      const dishItem = mapPlatoListItem(plato, startIndex + index)
      return [dishItem.id, dishItem]
    }),
  )

  promociones.forEach((promo, index) => {
    const promotedDish = mapPromotedDishListItem(
      promo,
      startIndex + platos.length + index,
    )

    // El backend pagina `platos` pero devuelve `promociones` completo, sin
    // paginar, en cada request. Si el plato de esta promo no está entre los
    // platos de la página actual, es que pertenece a otra página: no hay que
    // agregarlo acá, o el mismo plato termina apareciendo duplicado en más
    // de una página del catálogo del cliente.
    if (!dishMap.has(promotedDish.id)) return

    dishMap.set(
      promotedDish.id,
      mergeDishWithPromotion(dishMap.get(promotedDish.id), promotedDish),
    )
  })

  let combined = Array.from(dishMap.values())

  if (options.promotionsOnly) {
    combined = combined.filter((item) => item.isPromotion)
  }

  if (options.maxPrice) {
    const max = Number(options.maxPrice)
    combined = combined.filter((item) => item.price <= max)
  }

  return combined
}

export function mapRestaurantDetail(local, platos = []) {
  const base = mapLocalListItem(local)
  return {
    ...base,
    enabled: true,
    products: platos
      .filter((plato) => plato.disponible !== false)
      .map((plato, index) => ({
        id: plato.id,
        categoryId: getDishCategoryId(plato),
        categoryName: getDishCategoryName(plato),
        name: plato.nombre,
        description: plato.descripcion ?? '',
        price: plato.precio ?? 0,
        precioFinal: plato.precioFinal ?? plato.precio ?? 0,
        tienePromocion: plato.tienePromocion ?? false,
        image: plato.imagen ?? placeholder(index),
      })),
  }
}
export function mapLocalPanelRestaurant(local, extras = {}) {
  return {
    id: local.id,
    name: local.nombre,
    isOpen: Boolean(local.estaAbierto),
    rating: local.calificacionGlobal ?? 0,
    enabled: extras.enabled ?? true,
    pendingOrdersOnClose: extras.pendingOrdersOnClose ?? 0,
  }
}

export function mapLocalDish(plato, index = 0) {
  return {
    id: plato.id,
    restaurantId: plato.dtLocal?.id ?? plato.local?.id,
    categoryId: getDishCategoryId(plato),
    categoryName: getDishCategoryName(plato),
    name: plato.nombre,
    description: plato.descripcion ?? '',
    price: plato.precio ?? 0,
    image: plato.imagen ?? placeholder(index),
    active: plato.disponible !== false,
  }
}

export function mapOrderListItem(pedido) {
  const clientName = [pedido.cliente?.nombre, pedido.cliente?.apellido]
    .filter(Boolean)
    .join(' ')
    .trim()
  const motivoRechazo = pedido.motivoRechazo ?? pedido.rejectionReason ?? null
  const estadoVisible =
    typeof pedido.estadoVisible === 'string' && pedido.estadoVisible.trim()
      ? pedido.estadoVisible.trim()
      : null
  const pagoPendiente = Boolean(pedido.pagoPendiente)
  const permiteReintentarPago = Boolean(pedido.permiteReintentarPago)
  const mpInitPoint = pedido.mpInitPoint ?? null

  return {
    id: pedido.id,
    clientId: pedido.cliente?.id,
    clientName: clientName || 'Cliente',
    restaurantId: pedido.local?.id,
    restaurantName: pedido.local?.nombre ?? 'Local',
    items: [],
    total: pedido.total ?? 0,
    status: mapBackendStatusToFrontend(pedido.estado),
    createdAt: pedido.fecha ?? new Date().toISOString(),
    deliveryMinutes: parseDeliveryMinutes(pedido.tiempoEstEntrega),
    itemCount: pedido.cantidadItems ?? 0,
    motivoRechazo,
    rejectionReason: motivoRechazo,
    estadoVisible,
    visibleStatus: estadoVisible,
    pagoPendiente,
    paymentPending: pagoPendiente,
    permiteReintentarPago,
    canRetryPayment: permiteReintentarPago,
    mpInitPoint,
  }
}

export function mapPendingLocalRequest(solicitud) {
  return {
    id: solicitud.id,
    name: solicitud.nombre,
    email: solicitud.email,
    address: formatAddress(solicitud.direccion),
    description: solicitud.descripcion ?? '',
    imageCount: solicitud.imagenes?.length ?? 0,
    status: 'pending',
  }
}

export function buildOrderPayload(clientId, payload) {
  const paymentMethod = payload.paymentMethod ?? 'mercadopago'

  return {
    dtPedido: {
      dtLocal: { id: Number(payload.restaurantId) },
      dtCliente: { id: Number(clientId) },
      medioDePago: paymentMethod,
      pagoSimulado: false,
      domicilioEntrega: payload.deliveryAddress ?? {
        calle: 'Sin especificar',
        numero: 'S/N',
        ciudad: 'N/D',
        codigoPostal: '0000',
      },
    },
    detalles: payload.items.map((item) => ({
      cantidad: item.quantity,
      dtPlato: { id: Number(item.id) },
    })),
  }
}

export function buildDishPayload(localId, payload) {
  return {
    id: payload.id ?? undefined,
    nombre: payload.name?.trim(),
    descripcion: payload.description?.trim() ?? payload.name?.trim() ?? 'Plato',
    precio: Number(payload.price),
    dtCategoria: payload.categoryId ? { id: Number(payload.categoryId) } : null,
    disponible: payload.active ?? true,
    dtLocal: { id: Number(localId) },
  }
}

export function buildPromotionPayload(payload) {
  const toDateTime = (date) => (date?.includes('T') ? date : `${date}T00:00:00`)
  return {
    idPlato: Number(payload.dishId),
    descuento: Number(payload.discountPercent),
    fechaInicio: toDateTime(payload.startDate),
    fechaFin: toDateTime(payload.endDate),
    descripcion: payload.title?.trim() ?? payload.description?.trim() ?? 'Promoción',
  }
}

function resolvePromotionActive(promo) {
  if (typeof promo?.active === 'boolean') return promo.active
  if (typeof promo?.activa === 'boolean') return promo.activa
  if (typeof promo?.activo === 'boolean') return promo.activo
  if (typeof promo?.habilitada === 'boolean') return promo.habilitada
  if (typeof promo?.habilitado === 'boolean') return promo.habilitado

  if (typeof promo?.estado === 'string') {
    const normalized = promo.estado.trim().toLowerCase()
    if (['activa', 'activo', 'habilitada', 'habilitado', 'vigente'].includes(normalized)) return true
    if (['inactiva', 'inactivo', 'deshabilitada', 'deshabilitado', 'eliminada', 'eliminado', 'baja', 'vencida'].includes(normalized)) return false
  }

  if (promo?.fechaBaja) return false

  return true
}

export function mapLocalPromotion(promo, index = 0) {
  return {
    id: promo.id,
    dishId: promo.plato?.id ?? promo.dtPlato?.id ?? promo.idPlato,
    title: promo.descripcion ?? 'Promoción',
    discountPercent: promo.descuento ?? 0,
    startDate: promo.fechaInicio?.split('T')[0] ?? promo.fechaInicio,
    endDate: promo.fechaFin?.split('T')[0] ?? promo.fechaFin,
    active: resolvePromotionActive(promo),
  }
}

export function mapUserListItem(user) {
  const statusMap = { Activo: 'active', Bloqueado: 'blocked', Pendiente: 'pending' }
  return {
    id: user.id,
    email: user.email,
    role: mapBackendRole(user.tipoUsuario ?? user.tipo ?? 'cliente'),
    name: user.nombreVisible ?? user.email,
    status: statusMap[user.estado] ?? (user.blocked ? 'blocked' : 'active'),
    rating: user.calificacionGlobal ?? 0,
  }
}

export function mapClaim(claim) {
  const cliente = claim.dtPedido?.dtCliente ?? claim.dtPedido?.cliente
  const clientName = [cliente?.nombre, cliente?.apellido].filter(Boolean).join(' ').trim()
  const rawStatus = String(claim.estado ?? claim.status ?? '').trim().toLowerCase()
  const compensationType = claim.tipoCompensacion ?? claim.compensationType ?? null
  const rejectionReason = claim.motivoRechazo ?? claim.rejectionReason ?? claim.resolutionNote ?? null

  let status = 'pending'
  if (['atendido', 'attended', 'resolved'].includes(rawStatus)) status = 'attended'
  if (['rechazado', 'rejected'].includes(rawStatus)) status = 'rejected'

  return {
    id: claim.id,
    orderId: claim.dtPedido?.id ?? claim.orderId,
    clientName: clientName || claim.clientName || 'Cliente',
    reason: claim.motivo ?? claim.reason,
    compensationType,
    status,
    amount: claim.montoReintegro ?? claim.amount ?? 0,
    createdAt: claim.fecha ?? claim.createdAt ?? new Date().toISOString(),
    resolutionType: claim.resolutionType ?? compensationType,
    resolutionNote: claim.resolutionNote ?? rejectionReason,
    rejectionReason,
  }
}

export function mapRatingSummary(data) {
  if (!data) return { average: 0, total: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
  if (data.average !== undefined) return data

  const breakdownSource = data.detallePorPuntuacion ?? data.breakdown ?? {}
  const readBreakdown = (star) =>
    breakdownSource[star] ?? breakdownSource[String(star)] ?? 0

  return {
    average: data.calificacionGlobal ?? data.promedio ?? data.average ?? 0,
    total: data.totalValoraciones ?? data.totalCalificaciones ?? data.total ?? 0,
    breakdown: {
      1: readBreakdown(1),
      2: readBreakdown(2),
      3: readBreakdown(3),
      4: readBreakdown(4),
      5: readBreakdown(5),
    },
  }
}

export function mapLocalClient(client) {
  return {
    id: client.id,
    name: [client.nombre, client.apellido].filter(Boolean).join(' ').trim() || client.name,
    rating: client.calificacionGlobal ?? client.rating ?? 0,
    alreadyRated: client.yaCalificado ?? client.alreadyRated ?? false,
    myScore: client.miPuntaje ?? null,
    myComment: client.miComentario ?? '',
  }
}

export function mapLocalStats(data) {
  const mapAnalyticDish = (plato, index) => ({
    id: plato.id,
    name: plato.nombre ?? plato.name ?? 'Plato',
    image: plato.imagen ?? placeholder(index),
    soldQuantity: Number(plato.cantidadVendida ?? 0),
    soldAmount: Number(plato.montoVendido ?? 0),
  })

  const monthlySales = (data.ventasMensuales ?? [])
    .map((sale) => ({
      year: Number(sale.anio ?? 0),
      month: Number(sale.mes ?? 0),
      soldAmount: Number(sale.montoVendido ?? 0),
    }))
    .sort((left, right) => {
      if (left.year !== right.year) return left.year - right.year
      return left.month - right.month
    })

  return {
    fromDate: data.fechaDesde ?? null,
    untilDate: data.fechaHasta ?? null,
    confirmedSales: data.ventasConfirmadas ?? 0,
    topDishes: (data.platosMasPedido ?? []).map(mapAnalyticDish),
    salesByDish: (data.ventasPorPlato ?? []).map(mapAnalyticDish),
    monthlySales,
  }
}
