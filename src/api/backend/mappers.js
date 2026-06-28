import burgerCardImg from '../../../img/burger-card.png'
import pizzaCardImg from '../../../img/pizza-card.png'
import pastaCardImg from '../../../img/pasta-card.png'
import sushiCardImg from '../../../img/sushi-card.png'
import milanesaCardImg from '../../../img/milanesa-card.png'
import iceCreamCardImg from '../../../img/ice-cream-card.png'
import { formatAddress, mapBackendRole, mapBackendStatusToFrontend, parseDeliveryMinutes } from './helpers'

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

function normalizeDishCategory(category) {
  if (typeof category === 'string') {
    const trimmed = category.trim()
    return trimmed || 'general'
  }

  if (typeof category === 'number') {
    return String(category)
  }

  if (category && typeof category === 'object') {
    return (
      category.id ??
      category.codigo ??
      category.nombre ??
      category.name ??
      'general'
    )
  }

  return 'general'
}

function getDishCategory(plato) {
  return normalizeDishCategory(
    plato?.categoria ??
      plato?.categoryId ??
      plato?.category ??
      plato?.dtCategoria ??
      plato?.categoriaPlato,
  )
}

export function mapLoginResponse(data, extras = {}) {
  const role = mapBackendRole(data.tipo)
  return {
    token: data.token,
    user: {
      id: data.id,
      email: data.email,
      role,
      name: extras.name ?? data.email,
      localId: role === 'local' ? data.id : undefined,
      restaurantId: role === 'local' ? data.id : undefined,
      localEnabled: extras.localEnabled ?? role !== 'local',
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

export function mapLocalListItem(local, index = 0) {
  return {
    id: local.id,
    name: local.nombre,
    logo: local.imagenes?.[0] ?? null,
    isOpen: Boolean(local.estaAbierto),
    rating: local.calificacionGlobal ?? 0,
    foodType: local.descripcion ?? '',
    description: local.descripcion ?? '',
    address: formatAddress(local.direccion),
    images: local.imagenes ?? [],
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
    image: plato.imagenes?.[0] ?? placeholder(index),
    price: plato.precio ?? 0,
    categoryId: getDishCategory(plato),
  }
}

export function mapPromocionListItem(promo, index = 0) {
  const plato = promo.dtPlato ?? promo.plato
  const restaurant = plato?.dtLocal ?? plato?.local
  const restaurantId = restaurant?.id
  const basePrice = plato?.precio ?? 0
  const discountPercent = promo.descuento ?? 0
  const discountedPrice = Math.round(basePrice * (1 - discountPercent / 100))

  return {
    id: `promo-${promo.id}`,
    promotionId: promo.id,
    dishId: plato?.id,
    restaurantId,
    name: promo.descripcion ?? plato?.nombre ?? 'Promoción',
    restaurant: restaurant?.nombre ?? 'Local',
    image: plato?.imagenes?.[0] ?? placeholder(index),
    price: discountedPrice,
    originalPrice: basePrice,
    discountPercent,
    isPromotion: true,
  }
}

export function mapSearchResults(response, options = {}, startIndex = 0) {
  const platos = response?.platos ?? []
  const promociones = response?.promociones ?? []
  const dishItems = platos.map((plato, index) => mapPlatoListItem(plato, startIndex + index))
  const promoItems = promociones.map((promo, index) =>
    mapPromocionListItem(promo, startIndex + dishItems.length + index),
  )

  let combined = options.promotionsOnly ? promoItems : [...dishItems, ...promoItems]

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
        categoryId: getDishCategory(plato),
        name: plato.nombre,
        description: plato.descripcion ?? '',
        price: plato.precio ?? 0,
        image: plato.imagenes?.[0] ?? placeholder(index),
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
    categoryId: getDishCategory(plato),
    name: plato.nombre,
    description: plato.descripcion ?? '',
    price: plato.precio ?? 0,
    image: plato.imagenes?.[0] ?? placeholder(index),
    active: plato.disponible !== false,
  }
}

export function mapOrderListItem(pedido) {
  const clientName = [pedido.cliente?.nombre, pedido.cliente?.apellido]
    .filter(Boolean)
    .join(' ')
    .trim()

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
  return {
    dtPedido: {
      dtLocal: { id: Number(payload.restaurantId) },
      dtCliente: { id: Number(clientId) },
      medioDePago: 'simulado',
      pagoSimulado: true,
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
    categoria: normalizeDishCategory(payload.categoryId ?? payload.categoria),
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

export function mapLocalPromotion(promo, index = 0) {
  return {
    id: promo.id,
    dishId: promo.plato?.id ?? promo.dtPlato?.id ?? promo.idPlato,
    title: promo.descripcion ?? 'Promoción',
    discountPercent: promo.descuento ?? 0,
    startDate: promo.fechaInicio?.split('T')[0] ?? promo.fechaInicio,
    endDate: promo.fechaFin?.split('T')[0] ?? promo.fechaFin,
    active: true,
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
  const isResolved =
    claim.estado === 'Solucionado' ||
    claim.status === 'resolved' ||
    (claim.montoReintegro != null && claim.montoReintegro > 0)

  return {
    id: claim.id,
    orderId: claim.dtPedido?.id ?? claim.orderId,
    clientName: clientName || claim.clientName || 'Cliente',
    reason: claim.motivo ?? claim.reason,
    compensationType: claim.tipoCompensacion ?? claim.compensationType,
    status: isResolved ? 'resolved' : 'pending',
    amount: claim.montoReintegro ?? claim.amount ?? 0,
    createdAt: claim.fecha ?? claim.createdAt ?? new Date().toISOString(),
    resolutionType: claim.resolutionType,
    resolutionNote: claim.resolutionNote,
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
    alreadyRated: client.alreadyRated ?? false,
  }
}

export function mapLocalStats(data) {
  return {
    monthlyRevenue: data.gananciasMensuales ?? 0,
    topDishes: (data.platosMasPedido ?? []).map((plato, index) => ({
      id: plato.id,
      name: plato.nombre,
      price: plato.precio ?? 0,
      image: plato.imagenes?.[0] ?? placeholder(index),
    })),
  }
}