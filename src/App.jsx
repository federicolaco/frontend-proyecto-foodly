import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminLocalRequests } from './pages/admin/AdminLocalRequests'
import { Home } from './pages/Home'
import { LocalDishes } from './pages/local/LocalDishes'
import { LocalHome } from './pages/local/LocalHome'
import { LocalLayout } from './pages/local/LocalLayout'
import { LocalOrdersPage } from './pages/local/LocalOrdersPage'
import { Login } from './pages/Login'
import { MyOrders } from './pages/MyOrders'
import { Orders } from './pages/Orders'
import { Register } from './pages/Register'
import { RegisterLocal } from './pages/RegisterLocal'
import { Restaurant } from './pages/Restaurant'
import { ROLES } from './lib/roles'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/iniciar-sesion" element={<Login />} />
        <Route path="/registrarse" element={<Register />} />

        <Route
          path="/pedidos"
          element={
            <ProtectedRoute roles={[ROLES.CLIENT]}>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mis-pedidos"
          element={
            <ProtectedRoute roles={[ROLES.CLIENT]}>
              <MyOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/local/:restaurantId"
          element={
            <ProtectedRoute roles={[ROLES.CLIENT]}>
              <Restaurant />
            </ProtectedRoute>
          }
        />

        <Route
          path="/registrar-local"
          element={
            <ProtectedRoute>
              <RegisterLocal />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/solicitudes"
          element={
            <ProtectedRoute roles={[ROLES.ADMIN]}>
              <AdminLocalRequests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/local-panel"
          element={
            <ProtectedRoute roles={[ROLES.LOCAL]}>
              <LocalLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<LocalHome />} />
          <Route path="platos" element={<LocalDishes />} />
          <Route path="pedidos" element={<LocalOrdersPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
