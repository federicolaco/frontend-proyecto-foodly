import { ROLES } from './roles'

export const LOCAL_PANEL_TABS = [
  { label: 'Inicio', to: '/local-panel' },
  { label: 'Platos', to: '/local-panel/platos' },
  { label: 'Promociones', to: '/local-panel/promociones' },
  { label: 'Pedidos', to: '/local-panel/pedidos' },
  { label: 'Reclamos', to: '/local-panel/reclamos' },
  { label: 'Clientes', to: '/local-panel/clientes' },
  { label: 'Estadísticas', to: '/local-panel/estadisticas' },
]

export function getAppNavLinks(user) {
  if (!user?.role) return []

  if (user.role === ROLES.CLIENT) {
    return [
      { label: 'Platos', to: '/pedidos' },
      { label: 'Locales', to: '/locales' },
      { label: 'Mis pedidos', to: '/mis-pedidos' },
    ]
  }

  if (user.role === ROLES.ADMIN) {
    return [
      { label: 'Solicitudes', to: '/admin/solicitudes' },
      { label: 'Usuarios', to: '/admin/usuarios' },
    ]
  }

  if (user.role === ROLES.LOCAL) {
    if (user.localEnabled) {
      // Estos enlaces se muestran como tabs dentro del panel (ver
      // LOCAL_PANEL_TABS / LocalLayout.jsx), no en la navbar superior.
      return []
    }

    return [{ label: 'Registrar local', to: '/registrar-local' }]
  }

  return []
}

export function getProfileMenuItems(user) {
  const items = []

  if (user.role !== ROLES.ADMIN) {
    items.push({ label: 'Mi perfil', to: '/cuenta', action: 'navigate' })
  }

  if (user.role === ROLES.LOCAL && !user.localEnabled) {
    items.unshift({
      label: 'Completar registro del local',
      to: '/registrar-local',
      action: 'navigate',
    })
  }

  if (user.role === ROLES.CLIENT) {
    items.push({
      label: 'Mis pedidos',
      to: '/mis-pedidos',
      action: 'navigate',
    })
  }

  items.push({ label: 'Cerrar sesión', action: 'logout' })

  return items
}

export const PUBLIC_NAV_LINKS = [
  { label: 'Inicio', to: '/' },
  { label: 'Ingresar', to: '/iniciar-sesion' },
  { label: 'Registrarse', to: '/registrarse' },
]