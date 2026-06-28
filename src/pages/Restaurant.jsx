import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getUserDeliveryAddress } from '../api/backend/helpers'
import { fetchRestaurant, getRestaurantProduct } from '../api/restaurant'
import { CartSidebar } from '../components/restaurant/CartSidebar'
import { MenuProductList } from '../components/restaurant/MenuProductList'
import { RestaurantBanner } from '../components/restaurant/RestaurantBanner'
import { RestaurantDeliveryBar } from '../components/restaurant/RestaurantDeliveryBar'
import { OrdersNavbar } from '../components/OrdersNavbar'
import { useCart } from '../context/CartContext'
import { getStoredUser } from '../lib/auth'
import './Restaurant.css'

export function Restaurant() {
  const { restaurantId } = useParams()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()

  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState(() =>
    getUserDeliveryAddress(getStoredUser()),
  )

  useEffect(() => {
    let cancelled = false

    async function loadRestaurant() {
      setLoading(true)
      setError(null)

      try {
        const data = await fetchRestaurant(restaurantId)
        if (!cancelled) {
          setRestaurant(data)
        }
      } catch {
        if (!cancelled) {
          setError('No pudimos cargar el local.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadRestaurant()

    return () => {
      cancelled = true
    }
  }, [restaurantId])

  useEffect(() => {
    if (!restaurant) return

    const dishId = searchParams.get('plato')
    const preselectedProduct = location.state?.preselectedProduct ?? null
    if (!dishId && !preselectedProduct) return

    const product =
      (dishId ? getRestaurantProduct(restaurant, dishId) : null) ??
      (preselectedProduct?.id ? getRestaurantProduct(restaurant, preselectedProduct.id) : null) ??
      preselectedProduct

    if (product) {
      addToCart({ id: restaurant.id, name: restaurant.name }, product, 1)
    }

    navigate(`/local/${restaurantId}`, { replace: true })
  }, [addToCart, location.state, navigate, restaurant, restaurantId, searchParams])

  const handleAddProduct = (product) => {
    if (!restaurant) return
    addToCart({ id: restaurant.id, name: restaurant.name }, product, 1)
  }

  if (loading) {
    return (
      <div className="restaurant-page">
        <OrdersNavbar />
        <main className="restaurant-page__main contenedor">
          <p className="restaurant-page__status">Cargando men�...</p>
        </main>
      </div>
    )
  }

  if (error || !restaurant) {
    return (
      <div className="restaurant-page">
        <OrdersNavbar />
        <main className="restaurant-page__main contenedor">
          <p className="restaurant-page__status restaurant-page__status--error">{error}</p>
          <button type="button" className="restaurant-page__back" onClick={() => navigate('/pedidos')}>
            Volver a pedidos
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="restaurant-page">
      <OrdersNavbar />

      <main className="restaurant-page__main contenedor">
        <div className="restaurant-page__delivery-bar">
          <RestaurantDeliveryBar
            address={deliveryAddress}
            onAddressChange={setDeliveryAddress}
          />
          {!restaurant.isOpen && (
            <p className="restaurant-page__closed-banner" role="alert">
              Este local est� cerrado y no acepta pedidos por el momento.
            </p>
          )}
        </div>

        <div className="restaurant-page__layout">
          <div className="restaurant-page__menu-column">
            <RestaurantBanner restaurant={restaurant} />

            <div className="restaurant-page__menu-panel">
              <MenuProductList
                categoryLabel="Menu"
                products={restaurant.products}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onAddProduct={handleAddProduct}
              />
            </div>
          </div>

          <CartSidebar
            restaurantOpen={restaurant.isOpen !== false}
            deliveryAddress={deliveryAddress}
          />
        </div>
      </main>
    </div>
  )
}