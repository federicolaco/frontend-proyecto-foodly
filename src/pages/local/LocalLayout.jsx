import { NavLink, Outlet } from 'react-router-dom'
import { OrdersNavbar } from '../../components/OrdersNavbar'
import '../Panel.css'

export function LocalLayout() {
  return (
    <div className="panel-page">
      <OrdersNavbar />

      <main className="panel-page__main contenedor">
        <h1 className="panel-page__title">Panel del Local</h1>

        <nav className="panel-nav">
          <NavLink
            to="/local-panel"
            end
            className={({ isActive }) =>
              `panel-nav__link${isActive ? ' panel-nav__link--active' : ''}`
            }
          >
            Inicio
          </NavLink>
          <NavLink
            to="/local-panel/platos"
            className={({ isActive }) =>
              `panel-nav__link${isActive ? ' panel-nav__link--active' : ''}`
            }
          >
            Platos
          </NavLink>
          <NavLink
            to="/local-panel/pedidos"
            className={({ isActive }) =>
              `panel-nav__link${isActive ? ' panel-nav__link--active' : ''}`
            }
          >
            Pedidos
          </NavLink>
        </nav>

        <Outlet />
      </main>
    </div>
  )
}
