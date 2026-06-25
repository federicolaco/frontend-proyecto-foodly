export function mockDelay(data, ms = 300) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), ms)
  })
}

export class MockApiError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'MockApiError'
    this.status = status
  }
}

export function sanitizeUser(user) {
  if (!user) return null
  const { password: _password, ...safe } = user
  return safe
}
