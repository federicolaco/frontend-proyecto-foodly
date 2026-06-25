export const ROLES = {
  ADMIN: 'admin',
  LOCAL: 'local',
  CLIENT: 'cliente',
}

export function getHomePathForRole(role, user = null) {
  if (role === ROLES.LOCAL && user && !user.localEnabled) {
    return '/registrar-local'
  }

  switch (role) {
    case ROLES.ADMIN:
      return '/admin/solicitudes'
    case ROLES.LOCAL:
      return '/local-panel'
    default:
      return '/pedidos'
  }
}

export const ORDER_STATUS_LABELS = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
}

export const DEMO_ACCOUNTS = [
  { email: 'admin@foodly.com', password: 'Admin123!', role: 'Administrador' },
  { email: 'local@mcdonalds.com', password: 'Local123!', role: 'Local' },
  { email: 'cliente@test.com', password: 'Cliente123!', role: 'Cliente' },
]
