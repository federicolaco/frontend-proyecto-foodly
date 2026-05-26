import burgerImg from '../../img/burger.png'
import { WaveDivider } from './WaveDivider'
import './Hero.css'

export function Hero() {
  return (
    <section className="hero">
      <div className="hero__content contenedor">
        <div className="hero__image-wrap">
          <img src={burgerImg} alt="Hamburguesa gourmet" className="hero__image" />
        </div>

        <div className="hero__text">
          <h1 className="hero__title">
            Miles de sabores.
            <br />
            Un solo lugar.
          </h1>
          <p className="hero__subtitle">Todas las comidas, a un clic de distancia</p>
          <a href="" className="hero__cta">
            ORDENA AHORA
          </a>
        </div>
      </div>

      <WaveDivider fill="#ffffff" />
    </section>
  )
}
