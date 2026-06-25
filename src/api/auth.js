import { clearSessionToken, getSessionToken, getStoredUser, setSessionToken, setStoredUser } from '../lib/auth'

import { getHomePathForRole } from '../lib/roles'

import { apiFetch, apiFetchMultipart, isApiConfigured } from './client'

import {

  createPlaceholderImage,

  isJwtExpired,

  parseAddressString,

} from './backend/helpers'

import { mapClienteRegistrationPayload, mapLoginResponse } from './backend/mappers'

import {

  mockLogin,

  mockLogout,

  mockRegister,

  mockRegisterWithGoogle,

  mockValidateSession,

} from './mock/authMock'

import { MockApiError } from './mock/helpers'



export { MockApiError as AuthError }



async function resolveLocalEnabled(userId) {

  try {

    const locales = await apiFetch('/clientes')

    return Array.isArray(locales) && locales.some((local) => local.id === userId)

  } catch {

    return false

  }

}



export async function login(email, password) {

  if (isApiConfigured()) {

    const data = await apiFetch('/usuarios/login', {

      method: 'POST',

      body: JSON.stringify({ email, passwd: password }),

    })



    const role = data.tipo?.toLowerCase()

    const localEnabled = role === 'local' ? await resolveLocalEnabled(data.id) : undefined

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

      addressParsed: parseAddressString(payload.address),

    })



    formData.append(

      'datos',

      new Blob([JSON.stringify(datos)], { type: 'application/json' }),

    )

    formData.append('foto', payload.photo ?? createPlaceholderImage('perfil.png'))



    await apiFetchMultipart('/clientes/registro', formData)

    try {
      await apiFetch(`/usuarios/activar?email=${encodeURIComponent(payload.email.trim())}`)
    } catch {
      // Cuenta ya activa o mail no configurado en Railway.
    }

    return login(payload.email, payload.password)

  }



  const data = await mockRegister(payload)

  setSessionToken(data.token)

  setStoredUser(data.user)

  return data

}



export async function registerWithGoogle(payload) {

  if (isApiConfigured()) {

    const data = await apiFetch('/clientes/google', {

      method: 'POST',

      body: JSON.stringify({

        email: payload.email,

        nombre: payload.firstName ?? payload.name ?? 'Usuario',

        apellido: payload.lastName ?? '',

        documento: payload.document ?? `GOOG${Date.now()}`,

      }),

    })



    const mapped = {

      token: null,

      user: {

        id: data.id,

        email: data.email,

        role: 'cliente',

        name: `${data.nombre ?? ''} ${data.apellido ?? ''}`.trim() || data.email,

      },

    }



    if (mapped.token) setSessionToken(mapped.token)

    setStoredUser(mapped.user)

    return mapped

  }



  const data = await mockRegisterWithGoogle(payload)

  setSessionToken(data.token)

  setStoredUser(data.user)

  return data

}



export async function logout() {

  const token = getSessionToken()



  if (isApiConfigured() && token) {

    try {

      await apiFetch('/usuarios/logout', { method: 'POST' })

    } catch {

      // Ignorar error de logout remoto

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

