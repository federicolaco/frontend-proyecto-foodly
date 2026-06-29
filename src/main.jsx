import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'
import { ensureMockDb } from './api/mock/seed'
import { isApiConfigured } from './api/client'
import { CartProvider } from './context/CartContext.jsx'
import './index.css'

if (!isApiConfigured()) {
  ensureMockDb()
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <CartProvider>
        <App />
      </CartProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)