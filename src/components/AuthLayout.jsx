import { Link } from 'react-router-dom'
import loginRegisterVisual from '../../img/login-register.png'
import './AuthLayout.css'

export function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      <aside className="auth-layout__visual" aria-hidden="true">
        <img src={loginRegisterVisual} alt="" className="auth-layout__illustration" />
      </aside>

      <div className="auth-layout__panel">
        <Link to="/" className="auth-layout__logo">
          Foodly
        </Link>
        <div className="auth-layout__content">{children}</div>
      </div>
    </div>
  )
}
