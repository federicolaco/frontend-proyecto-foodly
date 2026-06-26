import { clearSessionToken, getSessionToken, setStoredUser } from '../../lib/auth'
import { getDb, updateDb } from './db'
import { mockDelay, MockApiError, sanitizeUser } from './helpers'
import { ensureMockDb } from './seed'
import { mockGetUserFromToken } from './authMock'

const CODES_KEY = 'foodly_mock_passwd_codes'

function getCodes() {
  try {
    return JSON.parse(localStorage.getItem(CODES_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveCodes(codes) {
  localStorage.setItem(CODES_KEY, JSON.stringify(codes))
}

function requireUser(token) {
  const user = mockGetUserFromToken(token)
  if (!user) throw new MockApiError(401, 'Sesión inválida')
  if (user.blocked) throw new MockApiError(403, 'Su cuenta ha sido suspendida.')
  return user
}

export function mockUpdateProfile(token, payload) {
  ensureMockDb()
  const sessionUser = requireUser(token)

  const updated = updateDb((db) => {
    const index = db.users.findIndex((u) => u.id === sessionUser.id)
    if (index < 0) throw new MockApiError(404, 'Usuario no encontrado')

    const user = db.users[index]
    if (payload.firstName) user.firstName = payload.firstName.trim()
    if (payload.lastName) user.lastName = payload.lastName.trim()
    if (payload.name) user.name = payload.name.trim()
    if (payload.address) user.address = payload.address.trim()
    if (payload.description) user.description = payload.description.trim()

    const displayName =
      [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.name
    if (displayName) user.name = displayName

    return sanitizeUser(user)
  })

  setStoredUser(updated)
  return mockDelay(updated)
}

export function mockStartPasswordChange(token, currentPassword) {
  ensureMockDb()
  const user = requireUser(token)
  const dbUser = getDb().users.find((u) => u.id === user.id)
  if (!dbUser || dbUser.password !== currentPassword) {
    throw new MockApiError(400, 'La contraseña actual ingresada es incorrecta.')
  }

  const codes = getCodes()
  codes[user.id] = { code: '123456', expiresAt: Date.now() + 10 * 60 * 1000, attempts: 0 }
  saveCodes(codes)

  return mockDelay({ message: 'Se envió un código de 6 dígitos a su correo (mock: 123456).' })
}

export function mockVerifyPasswordCode(token, code) {
  const user = requireUser(token)
  const codes = getCodes()
  const entry = codes[user.id]
  if (!entry) throw new MockApiError(400, 'No hay un cambio de contraseña en curso.')
  if (Date.now() > entry.expiresAt) {
    throw new MockApiError(400, 'El código de verificación ha expirado.')
  }
  if (entry.code !== code.trim()) {
    entry.attempts += 1
    saveCodes(codes)
    if (entry.attempts >= 3) {
      delete codes[user.id]
      saveCodes(codes)
      throw new MockApiError(400, 'Ha superado el número máximo de intentos.')
    }
    throw new MockApiError(400, `El código ingresado es incorrecto. Le quedan ${3 - entry.attempts} intentos.`)
  }
  entry.verified = true
  saveCodes(codes)
  return mockDelay({ verified: true })
}

export function mockConfirmPasswordChange(token, newPassword, confirmPassword) {
  const user = requireUser(token)
  if (newPassword !== confirmPassword) {
    throw new MockApiError(400, 'Las contraseñas ingresadas no coinciden.')
  }
  if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
    throw new MockApiError(400, 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.')
  }

  const codes = getCodes()
  if (!codes[user.id]?.verified) {
    throw new MockApiError(400, 'Debe verificar el código antes de confirmar.')
  }

  updateDb((db) => {
    const index = db.users.findIndex((u) => u.id === user.id)
    if (index >= 0) db.users[index].password = newPassword
  })

  delete codes[user.id]
  saveCodes(codes)
  return mockDelay({ message: 'Contraseña actualizada correctamente.' })
}

export function mockRequestPasswordRecovery(email) {
  ensureMockDb()
  const db = getDb()
  const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
  if (!user) {
    return mockDelay({
      message: 'Si el correo ingresado está asociado a una cuenta, recibirá un enlace de recuperación.',
    })
  }

  const token = `mock_recovery_${user.id}_${Date.now()}`
  const recoveries = JSON.parse(localStorage.getItem('foodly_mock_recoveries') ?? '{}')
  recoveries[token] = { userId: user.id, expiresAt: Date.now() + 30 * 60 * 1000 }
  localStorage.setItem('foodly_mock_recoveries', JSON.stringify(recoveries))

  return mockDelay({
    message: 'Si el correo ingresado está asociado a una cuenta, recibirá un enlace de recuperación.',
    mockToken: token,
  })
}

export function mockResetPassword(token, newPassword) {
  if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
    throw new MockApiError(400, 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.')
  }

  const recoveries = JSON.parse(localStorage.getItem('foodly_mock_recoveries') ?? '{}')
  const entry = recoveries[token]
  if (!entry || Date.now() > entry.expiresAt) {
    throw new MockApiError(400, 'El enlace de recuperación ha expirado.')
  }

  updateDb((db) => {
    const index = db.users.findIndex((u) => u.id === entry.userId)
    if (index >= 0) db.users[index].password = newPassword
  })

  delete recoveries[token]
  localStorage.setItem('foodly_mock_recoveries', JSON.stringify(recoveries))
  return mockDelay({ message: 'Contraseña restablecida. Ya puede iniciar sesión.' })
}

export function mockDeleteAccount(token) {
  ensureMockDb()
  const user = requireUser(token)
  if (user.role !== 'cliente') throw new MockApiError(403, 'Solo clientes pueden eliminar su cuenta.')

  const db = getDb()
  const activeOrders = db.orders.filter(
    (o) => o.clientId === user.id && ['pending', 'confirmed'].includes(o.status),
  )
  if (activeOrders.length > 0) {
    throw new MockApiError(400, 'No es posible eliminar la cuenta mientras tenga pedidos en curso.')
  }

  const pendingClaims = db.claims.filter(
    (c) => c.clientId === user.id && c.status === 'pending',
  )
  if (pendingClaims.length > 0) {
    throw new MockApiError(400, 'No es posible eliminar la cuenta con reclamos pendientes.')
  }

  updateDb((dbState) => {
    dbState.users = dbState.users.filter((u) => u.id !== user.id)
  })

  clearSessionToken()
  return mockDelay({ deleted: true })
}
