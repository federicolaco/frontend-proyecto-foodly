import { getSessionToken } from '../lib/auth'

const DEFAULT_API_URL = 'https://proyectoequipo32026-testing.up.railway.app/api/v1'

const API_BASE =
  import.meta.env.VITE_USE_MOCK === 'true'
    ? ''
    : (import.meta.env.VITE_API_URL ?? DEFAULT_API_URL)

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



function buildHeaders(options = {}, token = getSessionToken()) {

  const headers = { ...(options.headers ?? {}) }



  if (!(options.body instanceof FormData) && !headers['Content-Type']) {

    headers['Content-Type'] = 'application/json'

  }



  if (token && !headers.Authorization) {

    headers.Authorization = `Bearer ${token}`

  }



  return headers

}



export async function apiFetch(path, options = {}) {

  const response = await fetch(`${API_BASE}${path}`, {

    ...options,

    headers: buildHeaders(options),

  })



  if (!response.ok) {

    throw new ApiError(response.status, await parseErrorMessage(response))

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

  try {

    return await apiFetch(path, options)

  } catch (error) {

    if (error instanceof ApiError && (error.status === 400 || error.status === 404)) {

      return null

    }

    throw error

  }

}

