import { getApiModeLabel, isMockMode } from '../api/client'
import './ApiModeBanner.css'

export function ApiModeBanner() {
  if (!import.meta.env.DEV) return null

  const mock = isMockMode()

  return (
    <div
      className={`api-mode-banner${mock ? ' api-mode-banner--mock' : ' api-mode-banner--api'}`}
      role="status"
    >
      {mock ? 'Modo mock' : 'API Railway'} — {getApiModeLabel()}
    </div>
  )
}
