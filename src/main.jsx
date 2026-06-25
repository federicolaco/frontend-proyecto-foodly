import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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
    <CartProvider>
      <App />
    </CartProvider>
  </StrictMode>,
)
