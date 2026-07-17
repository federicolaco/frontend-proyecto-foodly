import { NavLink, Outlet } from 'react-router-dom'
import { OrdersNavbar } from '../../components/OrdersNavbar'
import { LOCAL_PANEL_TABS } from '../../lib/navLinks'
import '../Panel.css'

export function LocalLayout() {
  return (
    <div className="panel-page">
      <OrdersNavbar />

      <main className="panel-page__main contenedor">
        <h1 className="panel-page__title">Panel del Local</h1>

        <nav className="panel-nav">
          {LOCAL_PANEL_TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/local-panel'}
              className={({ isActive }) =>
                `panel-nav__link${isActive ? ' panel-nav__link--active' : ''}`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <Outlet />
      </main>
    </div>
  )
}