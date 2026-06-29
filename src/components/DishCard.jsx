import { getPlaceholderImage } from '../api/orders'
import { formatPrice } from '../lib/cart'
import './DishCard.css'

export function DishCard({ dish, index = 0, onSelect }) {
  return (
    <article
      className="dish-card"
      onClick={() => onSelect?.(dish)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect?.(dish)
        }
      }}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      <div className="dish-card__image-wrap">
        <img
          src={dish.image ?? getPlaceholderImage(index)}
          alt={dish.name}
          className="dish-card__image"
          loading="lazy"
        />
      </div>
      <div className="dish-card__body">
        <div className="dish-card__details">
          <h3 className="dish-card__name">{dish.name}</h3>
          <p className="dish-card__restaurant">{dish.restaurant}</p>
          {dish.isPromotion && (
            <span className="dish-card__promo">Promo {dish.discountPercent}% OFF</span>
          )}
        </div>

        <div className="dish-card__price-wrap">
          {dish.isPromotion && dish.originalPrice ? (
            <span className="dish-card__original-price">{formatPrice(dish.originalPrice)}</span>
          ) : null}
          <span className="dish-card__price">{formatPrice(dish.price)}</span>
        </div>
      </div>
    </article>
  )
}