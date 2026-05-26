import { Fragment } from 'react'
import step1Img from '../../img/step1.png'
import step2Img from '../../img/step2.png'
import step3Img from '../../img/step3.png'
import { WaveDivider } from './WaveDivider'
import { WavyAccent } from './WavyAccent'
import { DecorativeMarks } from './DecorativeMarks'
import { StepCard } from './StepCard'
import './HowItWorks.css'

const STEPS = [
  {
    step: 1,
    title: '1 Elegí tu comida',
    description:
      'Explorá restaurantes, bares y locales cerca tuyo. Compará menús, precios y tiempos de entrega.',
    image: step1Img,
  },
  {
    step: 2,
    title: '2 Hacé tu pedido',
    description:
      'Agregá productos al carrito, elegí método de pago y confirmá. Nosotros nos encargamos del resto.',
    image: step2Img,
  },
  {
    step: 3,
    title: '3 Recibí en tu casa',
    description:
      'Seguí tu pedido en tiempo real y recibilo en la puerta de tu casa, caliente y listo para disfrutar.',
    image: step3Img,
  },
]

export function HowItWorks() {
  return (
    <section className="how-it-works">
      <WaveDivider flip fill="#ffffff" />

      <header className="how-it-works__header contenedor">
        <h2 className="how-it-works__title">¿Cómo funciona?</h2>
        <p className="how-it-works__subtitle">Pedir tu comida en solo 3 pasos.</p>
        <WavyAccent />
      </header>

      <div className="how-it-works__steps contenedor">
        {STEPS.map((item, index) => (
          <Fragment key={item.step}>
            <StepCard {...item} />
            {index < STEPS.length - 1 && (
              <span className="how-it-works__arrow" aria-hidden="true">
                <svg width="14" height="24" viewBox="0 0 12 20" fill="none">
                  <path
                    d="M2 2l8 8-8 8"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            )}
          </Fragment>
        ))}
      </div>

      <div className="how-it-works__cta-wrap">
        <DecorativeMarks side="left" />
        <a href="" className="how-it-works__cta">
          ORDENA AHORA
        </a>
        <DecorativeMarks side="right" />
      </div>
    </section>
  )
}
