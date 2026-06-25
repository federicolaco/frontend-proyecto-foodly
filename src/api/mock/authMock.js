import { ensureMockDb } from './seed'
import { getDb, nextId, updateDb } from './db'
import { mockDelay, MockApiError, sanitizeUser } from './helpers'

const SESSIONS_KEY = 'foodly_mock_sessions'

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

function createToken(userId) {
  return `mock_token_${userId}_${Date.now()}`
}

function findUserByToken(token) {
  const sessions = getSessions()
  const userId = sessions[token]
  if (!userId) return null

  ensureMockDb()
  const db = getDb()
  return db.users.find((user) => user.id === userId) ?? null
}

export function mockLogin(email, password) {
  ensureMockDb()
  const db = getDb()
  const user = db.users.find(
    (entry) => entry.email.toLowerCase() === email.trim().toLowerCase(),
  )

  if (!user || user.password !== password) {
    throw new MockApiError(401, 'El correo electrónico o la contraseña son incorrectos.')
  }

  if (user.blocked) {
    throw new MockApiError(403, 'Su cuenta ha sido suspendida. Contacte al administrador para más información.')
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
      'La contraseña debe tener al menos 8 caracteres, una letra mayúscula y un número.',
    )
  }

  const result = updateDb((db) => {
    if (db.users.some((user) => user.email.toLowerCase() === email)) {
      throw new MockApiError(409, 'El correo electrónico ingresado ya está asociado a una cuenta existente.')
    }

    const user = {
      id: nextId(db, 'user'),
      email,
      password,
      role,
      name: `${payload.firstName} ${payload.lastName}`.trim(),
      address: payload.address ?? '',
      blocked: false,
      localEnabled: false,
      restaurantId: null,
    }

    db.users.push(user)

    const token = createToken(user.id)
    const sessions = getSessions()
    sessions[token] = user.id
    saveSessions(sessions)

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
  if (user.blocked) return mockDelay(null)

  ensureMockDb()
  const db = getDb()
  const freshUser = db.users.find((entry) => entry.id === user.id)
  if (!freshUser || freshUser.blocked) return mockDelay(null)

  return mockDelay(sanitizeUser(freshUser))
}

export function mockGetUserFromToken(token) {
  return findUserByToken(token)
}

export function mockRegisterWithGoogle(payload) {
  ensureMockDb()
  const email = payload.email.trim().toLowerCase()

  const result = updateDb((db) => {
    const existing = db.users.find((user) => user.email.toLowerCase() === email)
    if (existing) {
      throw new MockApiError(
        409,
        `El correo ${email} ya está asociado a una cuenta existente. ¿Desea iniciar sesión en su lugar?`,
      )
    }

    const user = {
      id: nextId(db, 'user'),
      email,
      password: null,
      role: 'cliente',
      name: `${payload.firstName} ${payload.lastName}`.trim(),
      address: payload.address ?? '',
      blocked: false,
      localEnabled: false,
      restaurantId: null,
      googleAuth: true,
    }

    db.users.push(user)

    const token = createToken(user.id)
    const sessions = getSessions()
    sessions[token] = user.id
    saveSessions(sessions)

    return { token, user: sanitizeUser(user) }
  })

  return mockDelay(result)
}
