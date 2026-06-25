import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { fetchRestaurant, getRestaurantProduct } from '../api/restaurant'
import { CartSidebar } from '../components/restaurant/CartSidebar'
import { MenuCategoryTabs } from '../components/restaurant/MenuCategoryTabs'
import { MenuProductList } from '../components/restaurant/MenuProductList'
import { RestaurantBanner } from '../components/restaurant/RestaurantBanner'
import { RestaurantDeliveryBar } from '../components/restaurant/RestaurantDeliveryBar'
import { OrdersNavbar } from '../components/OrdersNavbar'
import { useCart } from '../context/CartContext'
import './Restaurant.css'

export function Restaurant() {
  const { restaurantId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()

  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeCategory, setActiveCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadRestaurant() {
      setLoading(true)
      setError(null)

      try {
        const data = await fetchRestaurant(restaurantId)
        if (!cancelled) {
          setRestaurant(data)
          setActiveCategory(data.categories[0]?.id ?? '')
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
    if (!dishId) return

    const product = getRestaurantProduct(restaurant, dishId)
    if (product) {
      addToCart({ id: restaurant.id, name: restaurant.name }, product, 1)
    }

    setSearchParams({}, { replace: true })
  }, [addToCart, restaurant, searchParams, setSearchParams])

  const handleAddProduct = (product) => {
    if (!restaurant) return
    addToCart({ id: restaurant.id, name: restaurant.name }, product, 1)
  }

  if (loading) {
    return (
      <div className="restaurant-page">
        <OrdersNavbar />
        <main className="restaurant-page__main contenedor">
          <p className="restaurant-page__status">Cargando menú...</p>
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

  const activeCategoryLabel =
    restaurant.categories.find((category) => category.id === activeCategory)?.label ?? ''

  const categoryProducts = restaurant.products.filter(
    (product) => product.categoryId === activeCategory,
  )

  return (
    <div className="restaurant-page">
      <OrdersNavbar />

      <main className="restaurant-page__main contenedor">
        <div className="restaurant-page__delivery-bar">
          <RestaurantDeliveryBar deliveryTime={restaurant.deliveryTime} />
          {!restaurant.isOpen && (
            <p className="restaurant-page__closed-banner" role="alert">
              Este local está cerrado y no acepta pedidos por el momento.
            </p>
          )}
        </div>

        <div className="restaurant-page__layout">
          <div className="restaurant-page__menu-column">
            <RestaurantBanner restaurant={restaurant} />
            <MenuCategoryTabs
              categories={restaurant.categories}
              activeCategory={activeCategory}
              onChange={setActiveCategory}
            />

            <div className="restaurant-page__menu-panel">
              <MenuProductList
                categoryLabel={activeCategoryLabel}
                products={categoryProducts}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onAddProduct={handleAddProduct}
              />
            </div>
          </div>

          <CartSidebar restaurantOpen={restaurant.isOpen !== false} />
        </div>
      </main>
    </div>
  )
}
