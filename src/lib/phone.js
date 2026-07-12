export const TELEFONO_FIJO_PREFIX = '+598'

// El teléfono fijo solo aplica a Uruguay, así que mostrarle el "+598" al
// usuario es ruido: lo escribe/lee siempre sin el prefijo, pero el valor que
// viaja a la API sigue siendo el E.164 completo.
export function formatTelefonoFijo(value) {
  if (!value) return ''
  return value.startsWith(TELEFONO_FIJO_PREFIX) ? value.slice(TELEFONO_FIJO_PREFIX.length) : value
}
