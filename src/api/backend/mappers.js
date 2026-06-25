import burgerCardImg from '../../../img/burger-card.png'
import pizzaCardImg from '../../../img/pizza-card.png'
import pastaCardImg from '../../../img/pasta-card.png'
import sushiCardImg from '../../../img/sushi-card.png'
import milanesaCardImg from '../../../img/milanesa-card.png'
import iceCreamCardImg from '../../../img/ice-cream-card.png'
import { formatAddress, mapBackendRole, mapBackendStatusToFrontend } from './helpers'

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
    activo: false,
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
  const restaurantId = plato.dtLocal?.id
  return {
    id: plato.id,
    restaurantId,
    name: plato.nombre,
    restaurant: plato.dtLocal?.nombre ?? 'Local',
    image: plato.imagenes?.[0] ?? placeholder(index),
    price: plato.precio ?? 0,
    categoryId: 'general',
  }
}

export function mapPromocionListItem(promo, index = 0) {
  const plato = promo.dtPlato
  const restaurantId = plato?.dtLocal?.id
  const basePrice = plato?.precio ?? 0
  const discountPercent = promo.descuento ?? 0
  const discountedPrice = Math.round(basePrice * (1 - discountPercent / 100))

  return {
    id: `promo-${promo.id}`,
    promotionId: promo.id,
    dishId: plato?.id,
    restaurantId,
    name: promo.descripcion ?? plato?.nombre ?? 'Promoción',
    restaurant: plato?.dtLocal?.nombre ?? 'Local',
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
        categoryId: 'general',
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
    restaurantId: plato.dtLocal?.id,
    categoryId: 'general',
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
    deliveryMinutes: pedido.tiempoEstEntrega?.seconds
      ? Math.round(pedido.tiempoEstEntrega.seconds / 60)
      : undefined,
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
    disponible: payload.active ?? true,
    dtLocal: { id: Number(localId) },
  }
}
