import { getSessionToken, clearSessionToken } from '../lib/auth'


export const SESSION_EXPIRED_EVENT = 'foodly:session-expired'

let sessionExpiredNotified = false

const PUBLIC_AUTH_PATH_PREFIXES = [
  '/usuarios/login',
  '/usuarios/activar',
  '/usuarios/reenviar-activacion',
  '/usuarios/recuperar',
  '/usuarios/recuperar_contra_correo',
  '/clientes/registro',
  '/clientes/google',
]

function isPublicAuthPath(path = '') {
  return PUBLIC_AUTH_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))
}

function notifySessionExpired() {
  clearSessionToken()
  if (sessionExpiredNotified) return
  sessionExpiredNotified = true
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
  
  setTimeout(() => {
    sessionExpiredNotified = false
  }, 0)
}

const API_BASE =
  import.meta.env.VITE_USE_MOCK === 'true'
    ? ''
    : import.meta.env.VITE_API_URL

export function isMockMode() {
  return import.meta.env.VITE_USE_MOCK === 'true'
}

export function isApiConfigured() {
  return Boolean(API_BASE)
}

export function getApiModeLabel() {
  if (isMockMode()) return 'Mock (localStorage)'
  return API_BASE || 'Sin API'
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function parseErrorMessage(response) {
  try {
    const data = await response.json()
    return data?.mensaje ?? data?.message ?? `Error ${response.status}: ${response.statusText}`
  } catch {
    return `Error ${response.status}: ${response.statusText}`
  }
}

function buildHeaders(path, options = {}, token = getSessionToken()) {
  const headers = { ...(options.headers ?? {}) }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  if (token && !headers.Authorization && !isPublicAuthPath(path)) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

export async function apiFetch(path, options = {}) {
  const { disableSessionExpiredOn403: _disableSessionExpiredOn403, ...requestOptions } = options
  const headers = buildHeaders(path, requestOptions)
  const response = await fetch(`${API_BASE}${path}`, {
    ...requestOptions,
    headers,
  })

  if (!response.ok) {
    const message = await parseErrorMessage(response)


    if (
      response.status === 403 &&
      headers.Authorization &&
      !isPublicAuthPath(path) &&
      !options.disableSessionExpiredOn403
    ) {
      notifySessionExpired()
    }

    throw new ApiError(response.status, message)
  }

  if (response.status === 204) return null

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return null

  return response.json()
}

export async function apiFetchMultipart(path, formData, options = {}) {
  return apiFetch(path, {
    ...options,
    method: options.method ?? 'POST',
    body: formData,
    headers: {
      ...(options.headers ?? {}),
    },
  })
}

export async function apiFetchSafe(path, options = {}) {
  const acceptedStatuses =
    Array.isArray(options.acceptStatuses) && options.acceptStatuses.length > 0
      ? options.acceptStatuses
      : [400, 404]
  const { acceptStatuses: _acceptStatuses, ...requestOptions } = options

  try {
    return await apiFetch(path, requestOptions)
  } catch (error) {
    if (error instanceof ApiError && acceptedStatuses.includes(error.status)) {
      return null
    }

    throw error
  }
}
