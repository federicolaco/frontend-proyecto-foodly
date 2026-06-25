const SESSION_TOKEN_KEY = 'foodly_session_token'
const USER_KEY = 'foodly_user'

export function getSessionToken() {
  return localStorage.getItem(SESSION_TOKEN_KEY)
}

export function hasSession() {
  return Boolean(getSessionToken())
}

export function setSessionToken(token) {
  localStorage.setItem(SESSION_TOKEN_KEY, token)
}

export function clearSessionToken() {
  localStorage.removeItem(SESSION_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return { name: 'Usuario' }

  try {
    return JSON.parse(raw)
  } catch {
    return { name: 'Usuario' }
  }
}

export function setStoredUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}
