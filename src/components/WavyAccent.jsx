export function WavyAccent({ color = '#f9ca07' }) {
  return (
    <svg
      className="wavy-accent"
      width="120"
      height="12"
      viewBox="0 0 120 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M0 6 Q15 0 30 6 T60 6 T90 6 T120 6"
        stroke={color}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}
