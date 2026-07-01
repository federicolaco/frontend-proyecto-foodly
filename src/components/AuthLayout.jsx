import { Link } from 'react-router-dom'
import authDeliveryPanel from '../../img/auth-delivery-panel.png'
import './AuthLayout.css'

export function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      <aside
        className="auth-layout__visual"
        aria-hidden="true"
        style={{ '--auth-visual-image': `url(${authDeliveryPanel})` }}
      />

      <div className="auth-layout__panel">
        <Link to="/" className="auth-layout__logo">
          Foodly
        </Link>
        <div className="auth-layout__content">{children}</div>
      </div>
    </div>
  )
}
