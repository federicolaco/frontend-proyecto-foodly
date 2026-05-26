import './StepCard.css'

export function StepCard({ step, title, description, image }) {
  return (
    <article className="step-card">
      <span className="step-card__badge">{step}</span>
      <div className="step-card__image-wrap">
        <img src={image} alt="" className="step-card__image" />
      </div>
      <div className="step-card__body">
        <h3 className="step-card__title">{title}</h3>
        <p className="step-card__description">{description}</p>
      </div>
    </article>
  )
}
