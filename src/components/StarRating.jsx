export function StarRating({ value, onChange, readOnly = false }) {
  return (
    <div className="star-rating" role={readOnly ? 'img' : 'group'} aria-label={`Calificación: ${value} de 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-rating__star${star <= value ? ' star-rating__star--active' : ''}`}
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          aria-label={`${star} estrellas`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
