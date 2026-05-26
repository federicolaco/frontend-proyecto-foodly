import './WaveDivider.css'

export function WaveDivider({ flip = false, fill = '#ffffff' }) {
  return (
    <div className={`wave-divider ${flip ? 'wave-divider--flip' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M0,40 C240,90 480,0 720,40 C960,80 1200,10 1440,50 L1440,80 L0,80 Z"
          fill={fill}
        />
      </svg>
    </div>
  )
}
