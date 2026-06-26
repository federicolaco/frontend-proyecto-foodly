import { NavLink, Outlet } from 'react-router-dom'
import { OrdersNavbar } from '../../components/OrdersNavbar'
import '../Panel.css'

const NAV_ITEMS = [
  { to: '/local-panel', end: true, label: 'Inicio' },
  { to: '/local-panel/platos', label: 'Platos' },
  { to: '/local-panel/promociones', label: 'Promociones' },
  { to: '/local-panel/pedidos', label: 'Pedidos' },
  { to: '/local-panel/reclamos', label: 'Reclamos' },
  { to: '/local-panel/clientes', label: 'Clientes' },
  { to: '/local-panel/estadisticas', label: 'Estadísticas' },
]

export function LocalLayout() {
  return (
    <div className="panel-page">
      <OrdersNavbar />

      <main className="panel-page__main contenedor">
        <h1 className="panel-page__title">Panel del Local</h1>

        <nav className="panel-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `panel-nav__link${isActive ? ' panel-nav__link--active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <Outlet />
      </main>
    </div>
  )
}
