import { Link } from 'react-router-dom'
import burgerCardImg from '../../img/burger-card.png'
import pizzaCardImg from '../../img/pizza-card.png'
import pastaCardImg from '../../img/pasta-card.png'
import sushiCardImg from '../../img/sushi-card.png'
import iceCreamCardImg from '../../img/ice-cream-card.png'
import milanesaCardImg from '../../img/milanesa-card.png'
import { FoodCard } from './FoodCard'
import { WavyAccent } from './WavyAccent'
import { DecorativeMarks } from './DecorativeMarks'
import './MostOrdered.css'

const FOOD_ITEMS = [
  {
    title: 'HAMBURGUESA',
    description:
      'Descubrí las mejores opciones en tu zona y pedí la hamburguesa que más te guste.',
    image: burgerCardImg,
  },
  {
    title: 'PIZZA',
    description:
      'Pedí tu pizza favorita, con los ingredientes que elijas y al tamaño que prefieras.',
    image: pizzaCardImg,
  },
  {
    title: 'PASTA',
    description:
      'Probá pastas hechas con dedicación y disfrutá sabores que te van a encantar.',
    image: pastaCardImg,
  },
  {
    title: 'SUSHI',
    description:
      'Disfrutá la frescura del mejor sushi, preparado con ingredientes de primera calidad.',
    image: sushiCardImg,
  },
  {
    title: 'HELADO',
    description:
      'Dale un toque dulce a tu día con helados cremosos y postres irresistibles.',
    image: iceCreamCardImg,
  },
  {
    title: 'MILANESA',
    description:
      'Pedí milanesas gigantes al horno o fritas, con papas y los agregados que quieras.',
    image: milanesaCardImg,
  },
]

export function MostOrdered() {
  return (
    <section className="most-ordered">
      <header className="most-ordered__header">
        <h2 className="most-ordered__title">Lo más pedido, directo a tu casa</h2>
        <p className="most-ordered__subtitle">
          Descubrí los platos que todos eligen y pedí fácil, rápido y seguro.
        </p>
        <WavyAccent />
      </header>

      <div className="most-ordered__scroll">
        <div className="most-ordered__cards-track">
          <div className="most-ordered__cards">
            {FOOD_ITEMS.map((item) => (
              <FoodCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </div>

      <div className="most-ordered__cta-wrap">
        <DecorativeMarks side="left" />
        <Link to="/pedidos" className="most-ordered__cta">
          OTRAS OPCIONES
        </Link>
        <DecorativeMarks side="right" />
      </div>
    </section>
  )
}
