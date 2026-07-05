const APP_LOCALE = 'es-UY'
const APP_TIME_ZONE = 'America/Montevideo'

const dateFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: APP_TIME_ZONE,
})

const dateTimeFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: APP_TIME_ZONE,
})

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const ISO_DATETIME_WITHOUT_ZONE_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/

function formatDateParts(year, month, day) {
  return `${day}/${month}/${year}`
}

function formatDateTimeParts(year, month, day, hour, minute) {
  return `${day}/${month}/${year}, ${hour}:${minute}`
}

function parseNaiveDateString(value) {
  if (typeof value !== 'string') return null

  const dateMatch = value.match(ISO_DATE_PATTERN)
  if (dateMatch) {
    const [, year, month, day] = dateMatch
    return { year, month, day, hour: null, minute: null }
  }

  const dateTimeMatch = value.match(ISO_DATETIME_WITHOUT_ZONE_PATTERN)
  if (dateTimeMatch) {
    const [, year, month, day, hour, minute] = dateTimeMatch
    return { year, month, day, hour, minute }
  }

  return null
}

function normalizeDate(value) {
  if (value instanceof Date) return value

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value) {
  if (!value) return '—'

  const naiveDate = parseNaiveDateString(value)
  if (naiveDate) {
    return formatDateParts(naiveDate.year, naiveDate.month, naiveDate.day)
  }

  const date = normalizeDate(value)
  if (!date) return String(value)

  return dateFormatter.format(date)
}

export function formatDateTime(value) {
  if (!value) return '—'

  const naiveDate = parseNaiveDateString(value)
  if (naiveDate?.hour && naiveDate?.minute) {
    return formatDateTimeParts(
      naiveDate.year,
      naiveDate.month,
      naiveDate.day,
      naiveDate.hour,
      naiveDate.minute,
    )
  }

  const date = normalizeDate(value)
  if (!date) return String(value)

  return dateTimeFormatter.format(date)
}

export { APP_LOCALE, APP_TIME_ZONE }
