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
    rejected: 'Rechazado',
    cancelled: 'Cancelado',
  }
  return map[status] ?? status
}

export function mapBackendStatusToFrontend(estado) {
  const map = {
    Pendiente: 'pending',
    Confirmado: 'confirmed',
    Rechazado: 'rejected',
    Cancelado: 'cancelled',
  }
  return map[estado] ?? String(estado ?? '').toLowerCase()
}

export function isJwtExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
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
  if (filters.sort) body.ordenarPor = filters.sort
  return body
}

export function buildClaimSearchBody(filters = {}) {
  const body = {}
  if (filters.clientId) body.idCliente = Number(filters.clientId)
  if (filters.date) body.fechaReclamo = filters.date
  if (filters.orderStatus) body.estadoPedido = filters.orderStatus
  if (!body.idCliente && !body.fechaReclamo && !body.estadoPedido) {
    body.estadoPedido = 'Confirmado'
  }
  return body
}

export function buildOrderListParams(filters = {}) {
  const params = new URLSearchParams()
  if (filters.status) params.set('estado', mapFrontendStatusToBackend(filters.status))
  return params
}
