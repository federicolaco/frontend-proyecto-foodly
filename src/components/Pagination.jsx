import './Pagination.css'

export function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null

  const canGoPrev = page > 0
  const canGoNext = page < totalPages - 1

  return (
    <nav className="pagination" aria-label="Paginación">
      <button
        type="button"
        className="panel-btn panel-btn--outline pagination__btn"
        onClick={() => onPageChange(page - 1)}
        disabled={!canGoPrev}
      >
        Anterior
      </button>
      <span className="pagination__info">
        Página {page + 1} de {totalPages}
      </span>
      <button
        type="button"
        className="panel-btn panel-btn--outline pagination__btn"
        onClick={() => onPageChange(page + 1)}
        disabled={!canGoNext}
      >
        Siguiente
      </button>
    </nav>
  )
}