export const DEFAULT_COUNTRY_CODE = '+598'

export const COUNTRY_CODES = [
  { iso: 'UY', name: 'Uruguay', code: '+598', flag: '🇺🇾' },
  { iso: 'AR', name: 'Argentina', code: '+54', flag: '🇦🇷' },
  { iso: 'BR', name: 'Brasil', code: '+55', flag: '🇧🇷' },
  { iso: 'CL', name: 'Chile', code: '+56', flag: '🇨🇱' },
  { iso: 'PY', name: 'Paraguay', code: '+595', flag: '🇵🇾' },
  { iso: 'BO', name: 'Bolivia', code: '+591', flag: '🇧🇴' },
  { iso: 'PE', name: 'Perú', code: '+51', flag: '🇵🇪' },
  { iso: 'CO', name: 'Colombia', code: '+57', flag: '🇨🇴' },
  { iso: 'EC', name: 'Ecuador', code: '+593', flag: '🇪🇨' },
  { iso: 'VE', name: 'Venezuela', code: '+58', flag: '🇻🇪' },
  { iso: 'MX', name: 'México', code: '+52', flag: '🇲🇽' },
  { iso: 'US', name: 'Estados Unidos', code: '+1', flag: '🇺🇸' },
  { iso: 'CR', name: 'Costa Rica', code: '+506', flag: '🇨🇷' },
  { iso: 'PA', name: 'Panamá', code: '+507', flag: '🇵🇦' },
  { iso: 'DO', name: 'Rep. Dominicana', code: '+1', flag: '🇩🇴' },
  { iso: 'CU', name: 'Cuba', code: '+53', flag: '🇨🇺' },
  { iso: 'GT', name: 'Guatemala', code: '+502', flag: '🇬🇹' },
  { iso: 'HN', name: 'Honduras', code: '+504', flag: '🇭🇳' },
  { iso: 'SV', name: 'El Salvador', code: '+503', flag: '🇸🇻' },
  { iso: 'NI', name: 'Nicaragua', code: '+505', flag: '🇳🇮' },
  { iso: 'ES', name: 'España', code: '+34', flag: '🇪🇸' },
  { iso: 'IT', name: 'Italia', code: '+39', flag: '🇮🇹' },
  { iso: 'FR', name: 'Francia', code: '+33', flag: '🇫🇷' },
  { iso: 'DE', name: 'Alemania', code: '+49', flag: '🇩🇪' },
  { iso: 'GB', name: 'Reino Unido', code: '+44', flag: '🇬🇧' },
  { iso: 'PT', name: 'Portugal', code: '+351', flag: '🇵🇹' },
]

// Prefijos ordenados de más largo a más corto, para no confundir "+1" con "+598" al
// intentar reconocer el código a partir de un número completo ya guardado.
const CODES_BY_LENGTH_DESC = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length)

export function findCountryByPhoneValue(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return null
  return CODES_BY_LENGTH_DESC.find((country) => trimmed.startsWith(country.code)) ?? null
}
