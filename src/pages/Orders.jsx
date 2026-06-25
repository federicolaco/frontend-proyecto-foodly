import { useEffect, useState } from 'react'
import { getMostOrderedDishes, getPopularRestaurants } from '../api/orders'
import { OrdersCatalog } from '../components/OrdersCatalog'
import { OrdersNavbar } from '../components/OrdersNavbar'
import { OrdersSidebar } from '../components/OrdersSidebar'
import './Orders.css'

export function Orders() {
  const [restaurants, setRestaurants] = useState([])
  const [mostOrdered, setMostOrdered] = useState([])
  const [sidebarLoading, setSidebarLoading] = useState(true)
  const [sidebarError, setSidebarError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadSidebar() {
      setSidebarLoading(true)
      setSidebarError(null)

      try {
        const [restaurantsData, mostOrderedData] = await Promise.all([
          getPopularRestaurants(),
          getMostOrderedDishes(),
        ])

        if (!cancelled) {
          setRestaurants(restaurantsData)
          setMostOrdered(mostOrderedData)
        }
      } catch {
        if (!cancelled) {
          setSidebarError('No pudimos cargar las recomendaciones.')
        }
      } finally {
        if (!cancelled) setSidebarLoading(false)
      }
    }

    loadSidebar()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="orders-page">
      <OrdersNavbar />

      <main className="orders-page__main contenedor">
        {sidebarError && (
          <p className="orders-page__error" role="alert">
            {sidebarError}
          </p>
        )}

        <div className="orders-page__layout">
          <OrdersSidebar
            restaurants={restaurants}
            mostOrdered={mostOrdered}
            loading={sidebarLoading}
          />

          <div className="orders-page__catalog-panel">
            <OrdersCatalog />
          </div>
        </div>
      </main>
    </div>
  )
}
