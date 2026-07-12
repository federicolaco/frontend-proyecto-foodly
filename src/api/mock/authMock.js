import { ensureMockDb } from './seed'
import { getDb, nextId, updateDb } from './db'
import { mockDelay, MockApiError, sanitizeUser } from './helpers'

const SESSIONS_KEY = 'foodly_mock_sessions'
const GOOGLE_REGISTRATION_KEY = 'foodly_mock_google_registration'
const ACTIVATION_TOKENS_KEY = 'foodly_mock_activation_tokens'

function getSessions() {
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveSessions(sessions) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

function getActivationTokens() {
  try {
    return JSON.parse(localStorage.getItem(ACTIVATION_TOKENS_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveActivationTokens(tokens) {
  localStorage.setItem(ACTIVATION_TOKENS_KEY, JSON.stringify(tokens))
}

function getPendingGoogleRegistrations() {
  try {
    return JSON.parse(sessionStorage.getItem(GOOGLE_REGISTRATION_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function savePendingGoogleRegistrations(registrations) {
  sessionStorage.setItem(GOOGLE_REGISTRATION_KEY, JSON.stringify(registrations))
}

function createToken(userId) {
  return `mock_token_${userId}_${Date.now()}`
}

function createRegistrationToken() {
  return `mock_google_registration_${Date.now()}`
}

function createActivationToken(userId) {
  return `mock_activation_${userId}_${Date.now()}`
}

function findUserByToken(token) {
  const sessions = getSessions()
  const userId = sessions[token]
  if (!userId) return null

  ensureMockDb()
  const db = getDb()
  return db.users.find((user) => user.id === userId) ?? null
}

function getMockGoogleIdentity(payload = {}) {
  const fallbackEmail = 'google.cliente@mock.foodly'

  return {
    email: (payload.email ?? fallbackEmail).trim().toLowerCase(),
    firstName: payload.firstName?.trim() || 'Google',
    lastName: payload.lastName?.trim() || 'Cliente',
    photo: payload.photo ?? 'https://via.placeholder.com/160?text=Google',
  }
}

export function mockLogin(email, password) {
  ensureMockDb()
  const db = getDb()
  const user = db.users.find(
    (entry) => entry.email.toLowerCase() === email.trim().toLowerCase(),
  )

  if (!user || user.password !== password) {
    throw new MockApiError(401, 'El correo electronico o la contrasena son incorrectos.')
  }

  if (user.blocked) {
    throw new MockApiError(403, 'Su cuenta ha sido suspendida. Contacte al administrador para mas informacion.')
  }

  if (user.pendingActivation) {
    throw new MockApiError(
      403,
      'Tu cuenta todavia no fue activada. Revisa tu correo y usa el enlace de activacion antes de iniciar sesion.',
    )
  }

  const token = createToken(user.id)
  const sessions = getSessions()
  sessions[token] = user.id
  saveSessions(sessions)

  return mockDelay({ token, user: sanitizeUser(user) })
}

export function mockRegister(payload) {
  ensureMockDb()

  const email = payload.email.trim().toLowerCase()
  const password = payload.password
  const role = payload.role ?? 'cliente'

  if (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    throw new MockApiError(
      400,
      'La contrasena debe tener al menos 8 caracteres, una letra mayuscula y un numero.',
    )
  }

  const user = updateDb((db) => {
    if (db.users.some((entry) => entry.email.toLowerCase() === email)) {
      throw new MockApiError(409, 'El correo electronico ingresado ya esta asociado a una cuenta existente.')
    }

    const createdUser = {
      id: nextId(db, 'user'),
      email,
      password,
      role,
      name: `${payload.firstName} ${payload.lastName}`.trim(),
      address: payload.address ?? '',
      cellphone: payload.cellphone?.trim() || undefined,
      blocked: false,
      pendingActivation: true,
      localEnabled: false,
      restaurantId: null,
    }

    db.users.push(createdUser)
    return sanitizeUser(createdUser)
  })

  const mockActivationToken = createActivationToken(user.id)
  const activationTokens = getActivationTokens()
  activationTokens[mockActivationToken] = {
    userId: user.id,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  }
  saveActivationTokens(activationTokens)

  return mockDelay({
    requiresActivation: true,
    email,
    mockActivationToken,
    mockActivationPath: `/activar-cuenta?token=${encodeURIComponent(mockActivationToken)}`,
  })
}

export function mockLoginWithGoogle(payload) {
  ensureMockDb()
  const identity = getMockGoogleIdentity(payload)
  const db = getDb()
  const user = db.users.find((entry) => entry.email.toLowerCase() === identity.email)

  if (!user) {
    throw new MockApiError(
      400,
      `No existe una cuenta de cliente asociada al correo ${identity.email}. Registrese con Google para continuar.`,
    )
  }

  if (user.blocked) {
    throw new MockApiError(403, 'Su cuenta ha sido suspendida. Contacte al administrador para mas informacion.')
  }

  if (user.pendingActivation) {
    throw new MockApiError(
      403,
      'Tu cuenta todavia no fue activada. Revisa tu correo y usa el enlace de activacion antes de iniciar sesion.',
    )
  }

  if (!user.googleAuth) {
    throw new MockApiError(
      400,
      `La cuenta asociada al correo ${identity.email} no esta vinculada a Google. Inicie sesion con correo y contrasena.`,
    )
  }

  const token = createToken(user.id)
  const sessions = getSessions()
  sessions[token] = user.id
  saveSessions(sessions)

  return mockDelay({ token, user: sanitizeUser(user) })
}

export function mockStartGoogleRegistration(payload) {
  ensureMockDb()
  const identity = getMockGoogleIdentity(payload)

  const result = updateDb((db) => {
    if (db.users.some((user) => user.email.toLowerCase() === identity.email)) {
      throw new MockApiError(
        409,
        `El correo ${identity.email} ya esta asociado a una cuenta existente. Desea iniciar sesion en su lugar?`,
      )
    }

    const tokenRegistro = createRegistrationToken()
    const pending = getPendingGoogleRegistrations()
    pending[tokenRegistro] = identity
    savePendingGoogleRegistrations(pending)

    return {
      tokenRegistro,
      email: identity.email,
      nombre: identity.firstName,
      apellido: identity.lastName,
      foto: identity.photo,
    }
  })

  return mockDelay(result)
}

export function mockCompleteGoogleRegistration(payload) {
  ensureMockDb()
  const pending = getPendingGoogleRegistrations()
  const registration = pending[payload.tokenRegistro]

  if (!registration) {
    throw new MockApiError(400, 'El token de registro es invalido o expiro. Inicie el registro con Google nuevamente.')
  }

  if (!payload.document?.trim()) {
    throw new MockApiError(400, 'El documento es obligatorio.')
  }

  if (!payload.acceptTerms) {
    throw new MockApiError(400, 'Debe aceptar los terminos para continuar.')
  }

  const result = updateDb((db) => {
    if (db.users.some((user) => user.email.toLowerCase() === registration.email)) {
      throw new MockApiError(
        409,
        `El correo ${registration.email} ya esta asociado a una cuenta existente. Desea iniciar sesion en su lugar?`,
      )
    }

    const resolvedPhoto = payload.photo ?? registration.photo ?? null

    const user = {
      id: nextId(db, 'user'),
      email: registration.email,
      password: null,
      role: 'cliente',
      name: `${registration.firstName} ${registration.lastName}`.trim(),
      address: payload.address ?? '',
      blocked: false,
      localEnabled: false,
      restaurantId: null,
      googleAuth: true,
      photo: resolvedPhoto,
    }

    db.users.push(user)

    const token = createToken(user.id)
    const sessions = getSessions()
    sessions[token] = user.id
    saveSessions(sessions)

    delete pending[payload.tokenRegistro]
    savePendingGoogleRegistrations(pending)

    return { token, user: sanitizeUser(user) }
  })

  return mockDelay(result)
}

export function mockLogout(token) {
  const sessions = getSessions()
  delete sessions[token]
  saveSessions(sessions)
  return mockDelay(null)
}

export function mockValidateSession(token) {
  const user = findUserByToken(token)
  if (!user) return mockDelay(null)
  if (user.blocked || user.pendingActivation) return mockDelay(null)

  ensureMockDb()
  const db = getDb()
  const freshUser = db.users.find((entry) => entry.id === user.id)
  if (!freshUser || freshUser.blocked || freshUser.pendingActivation) return mockDelay(null)

  return mockDelay(sanitizeUser(freshUser))
}

export function mockGetUserFromToken(token) {
  return findUserByToken(token)
}

export function mockActivatePendingAccount(token) {
  ensureMockDb()

  if (!token) {
    throw new MockApiError(400, 'El enlace de activacion no es valido.')
  }

  const activationTokens = getActivationTokens()
  const entry = activationTokens[token]

  if (!entry || Date.now() > entry.expiresAt) {
    throw new MockApiError(400, 'El enlace de activacion no es valido o expiro.')
  }

  updateDb((db) => {
    const index = db.users.findIndex((user) => user.id === entry.userId)
    if (index < 0) {
      throw new MockApiError(404, 'Usuario no encontrado.')
    }

    db.users[index].pendingActivation = false
  })

  delete activationTokens[token]
  saveActivationTokens(activationTokens)

  return mockDelay({ message: 'Cuenta activada correctamente.' })
}

export function mockResendActivation(email) {
  ensureMockDb()

  const correoNormalizado = (email ?? '').trim().toLowerCase()
  if (!correoNormalizado) {
    throw new MockApiError(400, 'Debe ingresar un correo electronico.')
  }

  const db = getDb()
  const user = db.users.find((entry) => entry.email.toLowerCase() === correoNormalizado)

  if (!user) {
    throw new MockApiError(404, 'No existe ninguna cuenta registrada con ese correo.')
  }
  if (!user.pendingActivation) {
    throw new MockApiError(400, 'La cuenta ya se encuentra activada. Ya podes iniciar sesion.')
  }

  const activationTokens = getActivationTokens()
  Object.keys(activationTokens).forEach((key) => {
    if (activationTokens[key].userId === user.id) delete activationTokens[key]
  })

  const mockActivationToken = createActivationToken(user.id)
  activationTokens[mockActivationToken] = {
    userId: user.id,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  }
  saveActivationTokens(activationTokens)

  return mockDelay({
    message: 'Te reenviamos el correo de activacion.',
    mockActivationToken,
    mockActivationPath: `/activar-cuenta?token=${encodeURIComponent(mockActivationToken)}`,
  })
}

