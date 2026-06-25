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

export function buildLocalSearchParams(filters = {}) {
  const params = new URLSearchParams()
  if (filters.search) params.set('nombre', filters.search)
  if (filters.openOnly) params.set('estaAbierto', 'true')
  if (filters.minRating) params.set('calificacionMinima', String(filters.minRating))
  if (filters.sort === 'rating') params.set('ordenarPor', 'calificacion')
  if (filters.sort === 'name') params.set('ordenarPor', 'nombre')
  return params
}

export function buildOrderListParams(filters = {}) {
  const params = new URLSearchParams()
  if (filters.status) params.set('estado', mapFrontendStatusToBackend(filters.status))
  return params
}
