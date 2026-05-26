import './FoodCard.css'

export function FoodCard({ title, description, image }) {
  return (
    <article className="food-card">
      <div className="food-card__image-wrap">
        <img src={image} alt={title} className="food-card__image" />
      </div>
      <h3 className="food-card__title">{title}</h3>
      <p className="food-card__description">{description}</p>
    </article>
  )
}
