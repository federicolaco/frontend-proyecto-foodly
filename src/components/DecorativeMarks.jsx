import splash1 from '../../img/splash1.png'
import splash2 from '../../img/splash2.png'
import './DecorativeMarks.css'

export function DecorativeMarks({ side = 'left' }) {
  const src = side === 'right' ? splash2 : splash1

  return (
    <img
      src={src}
      alt=""
      className={`decorative-marks decorative-marks--${side}`}
      aria-hidden="true"
    />
  )
}
