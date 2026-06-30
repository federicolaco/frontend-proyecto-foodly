import { useNavigate } from 'react-router-dom'
import { buildRestaurantPath } from '../api/restaurant'
import { getPlaceholderImage } from '../api/orders'
import './OrdersSidebar.css'

function RestaurantLogo({ name, logo }) {
  if (logo) {
    return (
      <img
        src={logo}
        alt=""
        className="orders-sidebar__logo orders-sidebar__logo--image"
        aria-hidden="true"
      />
    )
  }

  return (
    <span className="orders-sidebar__logo" aria-hidden="true">
      {name.charAt(0)}
    </span>
  )
}

export function OrdersSidebar({ restaurants, mostOrdered, loading }) {
  const navigate = useNavigate()
  return (
    <aside className="orders-sidebar">
      <section className="orders-sidebar__panel">
        <h2 className="orders-sidebar__title">Restaurantes más populares</h2>
        <ul className="orders-sidebar__list">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <li key={`restaurant-skeleton-${index}`}>
                  <div className="orders-sidebar__skeleton" />
                </li>
              ))
            : restaurants.map((restaurant) => (
                <li key={restaurant.id}>
                  <button
                    type="button"
                    className="orders-sidebar__restaurant-btn"
                    onClick={() => navigate(buildRestaurantPath(restaurant.id))}
                  >
                    <RestaurantLogo name={restaurant.name} logo={restaurant.logo} />
                    <span className="orders-sidebar__restaurant-name">{restaurant.name}</span>
                  </button>
                </li>
              ))}
        </ul>
      </section>
      <section className="orders-sidebar__panel">
        <h2 className="orders-sidebar__title">Lo más pedido...</h2>
        <ul className="orders-sidebar__list">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <li key={`dish-skeleton-${index}`}>
                  <div className="orders-sidebar__skeleton orders-sidebar__skeleton--tall" />
                </li>
              ))
            : mostOrdered.map((dish, index) => (
                <li key={dish.id}>
                  <button
                    type="button"
                    className="orders-sidebar__dish-btn"
                    onClick={() => navigate(buildRestaurantPath(dish.restaurantId))}
                  >
                    <img
                      src={dish.image ?? getPlaceholderImage(index)}
                      alt=""
                      className="orders-sidebar__dish-image"
                    />
                    <span className="orders-sidebar__dish-info">
                      <span className="orders-sidebar__dish-name">{dish.name}</span>
                      <span className="orders-sidebar__dish-restaurant">{dish.restaurant}</span>
                    </span>
                  </button>
                </li>
              ))}
        </ul>
      </section>
    </aside>
  )
}
