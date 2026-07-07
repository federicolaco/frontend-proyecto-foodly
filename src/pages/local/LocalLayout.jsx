import { Outlet } from 'react-router-dom'
import { OrdersNavbar } from '../../components/OrdersNavbar'
import '../Panel.css'

export function LocalLayout() {
  return (
    <div className="panel-page">
      <OrdersNavbar />

      <main className="panel-page__main contenedor">
        <h1 className="panel-page__title">Panel del Local</h1>

        <Outlet />
      </main>
    </div>
  )
}