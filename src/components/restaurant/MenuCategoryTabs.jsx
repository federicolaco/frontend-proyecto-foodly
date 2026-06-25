import './MenuCategoryTabs.css'

export function MenuCategoryTabs({ categories, activeCategory, onChange }) {
  return (
    <div className="menu-category-tabs">
      <div className="menu-category-tabs__track">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`menu-category-tabs__btn ${
              activeCategory === category.id ? 'menu-category-tabs__btn--active' : ''
            }`}
            onClick={() => onChange(category.id)}
          >
            {category.label}
          </button>
        ))}
      </div>
      <span className="menu-category-tabs__arrow" aria-hidden="true">
        ›
      </span>
    </div>
  )
}
