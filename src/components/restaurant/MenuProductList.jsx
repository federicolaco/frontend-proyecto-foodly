import { formatPrice } from '../../lib/cart'
import './MenuProductList.css'

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function MenuProductList({
  categoryLabel,
  products,
  searchQuery,
  onSearchChange,
  onAddProduct,
}) {
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredProducts = normalizedQuery
    ? products.filter(
      (product) =>
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.description.toLowerCase().includes(normalizedQuery),
    )
    : products

  return (
    <section className="menu-product-list">
      <div className="menu-product-list__header">
        <div className="menu-product-list__title-wrap">
          <h2 className="menu-product-list__title">{categoryLabel}</h2>
          <span className="menu-product-list__accent" aria-hidden="true" />
        </div>

        <div className="menu-product-list__search-wrap">
          <input
            type="search"
            className="menu-product-list__search"
            placeholder="Buscar producto..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label="Buscar producto"
          />
          <span className="menu-product-list__search-icon">
            <SearchIcon />
          </span>
        </div>
      </div>

      <div className="menu-product-list__items">
        {filteredProducts.length === 0 && (
          <p className="menu-product-list__empty">No encontramos productos con ese nombre.</p>
        )}

   {filteredProducts.map((product) => (
  <article key={product.id} className="menu-product-list__item">
    <img src={product.image} alt="" className="menu-product-list__image" />
    <div className="menu-product-list__content">
      <h3 className="menu-product-list__name">{product.name}</h3>
      <p className="menu-product-list__description">{product.description}</p>
    </div>
    <div className="menu-product-list__actions">
      <div className="menu-product-list__price-wrap">
        {product.tienePromocion && (
          <span className="menu-product-list__price menu-product-list__price--original">
            {formatPrice(product.price)}
          </span>
        )}
        <span className="menu-product-list__price">
          {formatPrice(product.precioFinal ?? product.price)}
        </span>
      </div>
      <button
        type="button"
        className="menu-product-list__add-btn"
        onClick={() => onAddProduct(product)}
      >
        AGREGAR +
      </button>
    </div>
  </article>
))}
      </div>
    </section>
  )
}
