const SESSION_TOKEN_KEY = 'foodly_session_token'
const USER_KEY = 'foodly_user'
const GOOGLE_REGISTRATION_KEY = 'foodly_google_registration'

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

export function getGoogleRegistrationDraft() {
  const raw = sessionStorage.getItem(GOOGLE_REGISTRATION_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setGoogleRegistrationDraft(draft) {
  sessionStorage.setItem(GOOGLE_REGISTRATION_KEY, JSON.stringify(draft))
}

export function clearGoogleRegistrationDraft() {
  sessionStorage.removeItem(GOOGLE_REGISTRATION_KEY)
}
