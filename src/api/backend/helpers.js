const PLACEHOLDER_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

export function createPlaceholderImage(filename = 'placeholder.png') {
  const binary = atob(PLACEHOLDER_PNG_BASE64)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new File([bytes], filename, { type: 'image/png' })
}

export function parseAddressString(address = '') {
  const trimmed = address.trim()
  if (!trimmed) {
    return { calle: 'Sin especificar', numero: 'S/N', ciudad: 'N/D', codigoPostal: '0000' }
  }

  const commaParts = trimmed.split(',').map((part) => part.trim())
  const streetPart = commaParts[0] ?? trimmed
  const cityPart = commaParts.slice(1).join(', ') || 'N/D'
  const numberMatch = streetPart.match(/^(.*?)[,\s]+(\d+\w*)\s*$/)

  if (numberMatch) {
    return {
      calle: numberMatch[1].trim() || streetPart,
      numero: numberMatch[2].trim(),
      ciudad: cityPart,
      codigoPostal: '0000',
    }
  }

  return {
    calle: streetPart,
    numero: 'S/N',
    ciudad: cityPart,
    codigoPostal: '0000',
  }
}

export function normalizeAddress(address) {
  if (!address) return parseAddressString('')
  if (typeof address === 'string') return parseAddressString(address)

  return {
    calle: address.calle?.trim() || 'Sin especificar',
    numero: address.numero?.trim() || 'S/N',
    ciudad: address.ciudad?.trim() || 'N/D',
    codigoPostal: address.codigoPostal?.trim() || '0000',
  }
}

export function addressFromFields({ street, streetNumber, city, postalCode }) {
  return normalizeAddress({
    calle: street,
    numero: streetNumber,
    ciudad: city,
    codigoPostal: postalCode,
  })
}

export function splitAddressFields(source) {
  const details = normalizeAddress(source?.addressDetails ?? source?.address ?? source)
  return {
    street: details.calle === 'Sin especificar' ? '' : details.calle,
    streetNumber: details.numero === 'S/N' ? '' : details.numero,
    city: details.ciudad === 'N/D' ? '' : details.ciudad,
    postalCode: details.codigoPostal === '0000' ? '' : details.codigoPostal,
  }
}

export function getUserDeliveryAddress(user) {
  if (user?.addressDetails) return normalizeAddress(user.addressDetails)
  if (user?.address) return normalizeAddress(user.address)
  return normalizeAddress('')
}

export function parseDeliveryMinutes(tiempoEstEntrega) {
  if (tiempoEstEntrega == null) return undefined

  if (typeof tiempoEstEntrega === 'number') {
    return tiempoEstEntrega >= 3600 ? Math.round(tiempoEstEntrega / 60) : tiempoEstEntrega
  }

  if (typeof tiempoEstEntrega === 'string') {
    const isoMatch = tiempoEstEntrega.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/i)
    if (isoMatch) {
      const hours = Number(isoMatch[1] || 0)
      const minutes = Number(isoMatch[2] || 0)
      const seconds = Number(isoMatch[3] || 0)
      return hours * 60 + minutes + Math.round(seconds / 60)
    }
  }

  if (typeof tiempoEstEntrega === 'object') {
    if (typeof tiempoEstEntrega.seconds === 'number') {
      return Math.round(tiempoEstEntrega.seconds / 60)
    }
  }

  return undefined
}

export function formatAddress(direccion) {
  if (!direccion) return ''
  return [direccion.calle, direccion.numero, direccion.ciudad].filter(Boolean).join(', ')
}

export function mapBackendRole(tipo = '') {
  const normalized = tipo.toLowerCase()
  if (normalized === 'admin' || normalized === 'administrador') return 'admin'
  if (normalized === 'local') return 'local'
  return 'cliente'
}

export function mapFrontendStatusToBackend(status) {
  const map = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    delivered: 'Entregado',
    rejected: 'Rechazado',
    cancelled: 'Cancelado',
  }
  return map[status] ?? status
}

export function mapBackendStatusToFrontend(estado) {
  const normalized = String(estado ?? '').trim().toLowerCase()
  const map = {
    pendiente: 'pending',
    confirmado: 'confirmed',
    entregado: 'delivered',
    rechazado: 'rejected',
    cancelado: 'cancelled',
  }
  return map[normalized] ?? normalized
}

function base64UrlDecode(segment) {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padding = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  return atob(padded + padding)
}

export function isJwtExpired(token) {
  try {
    const payload = JSON.parse(base64UrlDecode(token.split('.')[1]))
    if (!payload?.exp) return false
    return Date.now() >= payload.exp * 1000
  } catch {
    return false
  }
}

export function buildSearchFilter(query = '', options = {}) {
  const filtro = {}

  if (query.trim()) filtro.nombre = query.trim()
  if (options.promotionsOnly) filtro.promocionActiva = true
  if (options.sort === 'price-asc') filtro.precioMasBajo = true
  if (options.sort === 'price-desc') filtro.precioMasAlto = true
  if (options.sort === 'name') filtro.alfabetico = true

  return filtro
}

export function buildLocalListBody(filters = {}) {
  const body = {}
  if (filters.search) body.nombre = filters.search
  if (filters.openOnly) body.estaAbierto = true
  if (filters.minRating) body.calificacionMinima = Number(filters.minRating)
  if (filters.sort === 'rating') {
    body.ordenarPor = 'calificacion'
    body.direccion = 'desc'
  } else if (filters.sort === 'name') {
    body.ordenarPor = 'nombre'
    body.direccion = 'asc'
  }
  return body
}

export function buildLocalClientFilterBody(filters = {}) {
  const body = {}
  if (filters.search) body.nombre = filters.search
  if (filters.minRating) body.calificacionMinima = Number(filters.minRating)
  return body
}

export function buildAdminUserFilterBody(filters = {}) {
  const body = {}
  if (filters.search) body.texto = filters.search
  if (filters.role) body.tipoUsuario = filters.role
  if (filters.status === 'blocked') body.estado = 'Bloqueado'
  if (filters.status === 'active') body.estado = 'Activo'
  if (filters.status === 'pending') body.estado = 'Pendiente'
  if (filters.sort) body.ordenarPor = filters.sort
  return body
}

export function buildClaimSearchBody(filters = {}) {
  const body = {}
  if (filters.clientId) body.idCliente = Number(filters.clientId)
  if (filters.localId) body.idLocal = Number(filters.localId)
  if (filters.date) body.fechaReclamo = filters.date
  if (filters.orderStatus) body.estadoPedido = filters.orderStatus
  if (filters.claimStatus === 'pending') body.estadoReclamo = 'Pendiente'
  if (filters.claimStatus === 'attended' || filters.claimStatus === 'resolved') body.estadoReclamo = 'Atendido'
  if (filters.claimStatus === 'rejected') body.estadoReclamo = 'Rechazado'
  return body
}

function mapClaimStatus(status) {
  if (status === 'pending') return 'Pendiente'
  if (status === 'attended' || status === 'resolved') return 'Atendido'
  if (status === 'rejected') return 'Rechazado'
  return null
}

export function buildOrderListParams(filters = {}) {
  const params = new URLSearchParams()
  if (filters.status) params.set('estado', mapFrontendStatusToBackend(filters.status))
  if (filters.page !== undefined) params.set('pagina', String(filters.page))
  if (filters.pageSize !== undefined) params.set('tamanio', String(filters.pageSize))
  return params
}

export function buildSearchParams(query = '', options = {}) {
  const params = new URLSearchParams()
  if (query.trim()) params.set('nombre', query.trim())
  if (options.promotionsOnly) params.set('promocionActiva', 'true')
  if (options.sort === 'price-asc') params.set('precioMasBajo', 'true')
  if (options.sort === 'price-desc') params.set('precioMasAlto', 'true')
  if (options.sort === 'name') params.set('alfabetico', 'true')
  if (options.localId) params.set('localId', String(Number(options.localId)))
  if (options.page !== undefined) params.set('pagina', String(options.page))
  if (options.pageSize !== undefined) params.set('tamanio', String(options.pageSize))
  return params
}

export function buildLocalListParams(filters = {}) {
  const params = new URLSearchParams()
  if (filters.search) params.set('nombre', filters.search)
  if (filters.openOnly) params.set('estaAbierto', 'true')
  if (filters.minRating) params.set('calificacionMinima', String(Number(filters.minRating)))
  if (filters.sort === 'rating') {
    params.set('ordenarPor', 'calificacion')
    params.set('direccion', 'desc')
  } else if (filters.sort === 'name') {
    params.set('ordenarPor', 'nombre')
    params.set('direccion', 'asc')
  }
  if (filters.page !== undefined) params.set('pagina', String(filters.page))
  if (filters.pageSize !== undefined) params.set('tamanio', String(filters.pageSize))
  return params
}

export function buildLocalClientFilterParams(filters = {}) {
  const params = new URLSearchParams()
  if (filters.search) params.set('nombre', filters.search)
  if (filters.minRating) params.set('calificacionMinima', String(Number(filters.minRating)))
  return params
}

export function buildAdminUserFilterParams(filters = {}) {
  const params = new URLSearchParams()
  if (filters.search) params.set('texto', filters.search)
  if (filters.role) params.set('tipoUsuario', filters.role)
  if (filters.status === 'blocked') params.set('estado', 'Bloqueado')
  if (filters.status === 'active') params.set('estado', 'Activo')
  if (filters.status === 'pending') params.set('estado', 'Pendiente')
  if (filters.sort) params.set('ordenarPor', filters.sort)
  if (filters.page !== undefined) params.set('pagina', String(filters.page))
  if (filters.pageSize !== undefined) params.set('tamanio', String(filters.pageSize))
  return params
}

export function buildClaimSearchParams(filters = {}, pagination = {}) {
  const params = new URLSearchParams()
  if (filters.clientId) params.set('idCliente', String(Number(filters.clientId)))
  if (filters.localId) params.set('idLocal', String(Number(filters.localId)))
  if (filters.date) params.set('fechaReclamo', filters.date)
  if (filters.orderStatus) params.set('estadoPedido', filters.orderStatus)
  if (filters.claimStatus === 'pending') params.set('estadoReclamo', 'Pendiente')
  if (filters.claimStatus === 'attended' || filters.claimStatus === 'resolved') params.set('estadoReclamo', 'Atendido')
  if (filters.claimStatus === 'rejected') params.set('estadoReclamo', 'Rechazado')
  if (pagination.page !== undefined) params.set('pagina', String(pagination.page))
  if (pagination.pageSize !== undefined) params.set('tamanio', String(pagination.pageSize))
  return params
}

export function mapPagedResponse(raw, itemMapper = (x) => x) {
  const contenido = raw?.contenido ?? []
  return {
    items: contenido.map(itemMapper),
    page: raw?.paginaActual ?? 0,
    totalPages: raw?.totalPaginas ?? 1,
    totalElements: raw?.totalElementos ?? contenido.length,
  }
}
