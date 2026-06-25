import { getPlaceholderImage } from '../api/orders'
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
        <h3 className="dish-card__name">{dish.name}</h3>
        <p className="dish-card__restaurant">{dish.restaurant}</p>
        {dish.isPromotion && (
          <span className="dish-card__promo">
            Promo {dish.discountPercent}% — ${dish.price.toLocaleString('es-AR')}
          </span>
        )}
      </div>
    </article>
  )
}
