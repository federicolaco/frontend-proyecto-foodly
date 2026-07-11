import {
  clearGoogleRegistrationDraft,
  clearSessionToken,
  getSessionToken,
  getStoredUser,
  setSessionToken,
  setStoredUser,
} from '../lib/auth'
import { getHomePathForRole } from '../lib/roles'
import { apiFetch, apiFetchMultipart, isApiConfigured } from './client'
import {
  createPlaceholderImage,
  formatAddress,
  isJwtExpired,
  normalizeAddress,
} from './backend/helpers'
import { mapClienteRegistrationPayload, mapLoginResponse } from './backend/mappers'
import {
  mockCompleteGoogleRegistration,
  mockLogin,
  mockLoginWithGoogle,
  mockLogout,
  mockRegister,
  mockStartGoogleRegistration,
  mockValidateSession,
} from './mock/authMock'
import { MockApiError } from './mock/helpers'

export { MockApiError as AuthError }

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function resolveGooglePhotoValue(photo) {
  if (!photo) return undefined
  if (typeof photo === 'string') return photo
  if (isApiConfigured()) return photo
  return fileToDataUrl(photo)
}

async function resolveLocalEnabled() {
  return true
}

export async function login(email, password) {
  if (isApiConfigured()) {
    const data = await apiFetch('/usuarios/login', {
      method: 'POST',
      body: JSON.stringify({ email, passwd: password }),
    })

    const role = data.tipo?.toLowerCase()
    const localEnabled = role === 'local' ? await resolveLocalEnabled() : undefined
    const mapped = mapLoginResponse(data, { localEnabled })

    setSessionToken(mapped.token)
    setStoredUser(mapped.user)
    return mapped
  }

  const data = await mockLogin(email, password)
  setSessionToken(data.token)
  setStoredUser(data.user)
  return data
}

export async function register(payload) {
  if (isApiConfigured()) {
    const formData = new FormData()
    const datos = mapClienteRegistrationPayload({
      ...payload,
      addressParsed: normalizeAddress(payload.address),
    })

    formData.append(
      'datos',
      new Blob([JSON.stringify(datos)], { type: 'application/json' }),
    )
    formData.append('foto', payload.photo ?? createPlaceholderImage('perfil.png'))

    const addressNormalized = normalizeAddress(payload.address)
    await apiFetchMultipart('/clientes/registro', formData)

    return {
      requiresActivation: true,
      email: payload.email.trim(),
      address: formatAddress(addressNormalized),
      addressDetails: addressNormalized,
    }
  }

  const data = await mockRegister({
    ...payload,
    address: formatAddress(normalizeAddress(payload.address)),
  })
  const addressNormalized = normalizeAddress(payload.address)

  return {
    ...data,
    addressDetails: addressNormalized,
  }
}

export async function loginWithGoogle(idToken) {
  if (isApiConfigured()) {
    const data = await apiFetch('/clientes/google', {
      method: 'POST',
      body: JSON.stringify({
        idToken,
        direccion: null,
        documento: null,
        esRegistro: false,
      }),
    })
    const mapped = mapLoginResponse(data)
    setSessionToken(mapped.token)
    setStoredUser(mapped.user)
    return mapped
  }

  const data = await mockLoginWithGoogle({ idToken })
  setSessionToken(data.token)
  setStoredUser(data.user)
  return data
}

export async function startGoogleRegistration(idToken) {
  if (isApiConfigured()) {
    return apiFetch('/clientes/google/registro/iniciar', {
      method: 'POST',
      body: JSON.stringify({
        idToken,
        direccion: null,
        documento: null,
        esRegistro: true,
      }),
    })
  }

  return mockStartGoogleRegistration({ idToken })
}

export async function completeGoogleRegistration(payload) {
  const resolvedPhoto = await resolveGooglePhotoValue(payload.photo)

  if (isApiConfigured()) {
    const formData = new FormData()
    const datos = {
      tokenRegistro: payload.tokenRegistro,
      documento: payload.document,
      direccion: normalizeAddress(payload.address),
      aceptaTerminos: Boolean(payload.acceptTerms),
    }

    formData.append(
      'datos',
      new Blob([JSON.stringify(datos)], { type: 'application/json' }),
    )
    if (resolvedPhoto) {
      formData.append('foto', resolvedPhoto)
    }

    const data = await apiFetchMultipart('/clientes/google/registro/completar', formData)
    const mapped = mapLoginResponse(data)
    setSessionToken(mapped.token)
    setStoredUser(mapped.user)
    clearGoogleRegistrationDraft()
    return mapped
  }

  const data = await mockCompleteGoogleRegistration({
    ...payload,
    photo: resolvedPhoto,
    address: formatAddress(normalizeAddress(payload.address)),
  })
  const addressNormalized = normalizeAddress(payload.address)
  const user = { ...data.user, addressDetails: addressNormalized }
  setSessionToken(data.token)
  setStoredUser(user)
  clearGoogleRegistrationDraft()
  return { ...data, user }
}

export async function logout() {
  const token = getSessionToken()

  if (isApiConfigured() && token) {
    try {
      await apiFetch('/usuarios/logout', { method: 'POST' })
    } catch {
     
    }
  } else if (token) {
    await mockLogout(token)
  }

  clearSessionToken()
}

export async function validateSession() {
  const token = getSessionToken()
  if (!token) return false

  if (isApiConfigured()) {
    if (isJwtExpired(token)) {
      clearSessionToken()
      return false
    }

    return Boolean(getStoredUser()?.email)
  }

  const user = await mockValidateSession(token)
  if (!user) {
    clearSessionToken()
    return false
  }

  setStoredUser(user)
  return true
}

export { getHomePathForRole }
