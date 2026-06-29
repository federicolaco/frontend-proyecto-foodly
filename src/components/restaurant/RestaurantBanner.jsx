import './RestaurantBanner.css'

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.9 6.9 7.5.6-5.7 5 1.7 7.3L12 18.8 5.6 22.8l1.7-7.3-5.7-5 7.5-.6L12 2z" />
    </svg>
  )
}

export function RestaurantBanner({ restaurant }) {
  const reviewCount = restaurant.reviews ?? 0

  return (
    <section className="restaurant-banner">
      <img
        src={restaurant.logo ?? restaurant.images?.[0]}
        alt=""
        className="restaurant-banner__image"
        aria-hidden="true"
      />
      <div className="restaurant-banner__info">
        <h1 className="restaurant-banner__name">{restaurant.name}</h1>
        <p className="restaurant-banner__rating">
          <StarIcon />
          <span>
            {restaurant.rating} (+ {reviewCount} opiniones)
          </span>
        </p>
      </div>
      <p className="restaurant-banner__hours">{restaurant.hours}</p>
    </section>
  )
}
