import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ApiModeBanner } from './components/ApiModeBanner'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AccountSettings } from './pages/account/AccountSettings'
import { AdminLocalRequests } from './pages/admin/AdminLocalRequests'
import { AdminUsers } from './pages/admin/AdminUsers'
import { ForgotPassword } from './pages/ForgotPassword'
import { Home } from './pages/Home'
import { LocalClaims } from './pages/local/LocalClaims'
import { LocalClients } from './pages/local/LocalClients'
import { LocalDishes } from './pages/local/LocalDishes'
import { LocalHome } from './pages/local/LocalHome'
import { LocalLayout } from './pages/local/LocalLayout'
import { LocalOrdersPage } from './pages/local/LocalOrdersPage'
import { LocalPromotions } from './pages/local/LocalPromotions'
import { LocalStats } from './pages/local/LocalStats'
import { Locales } from './pages/Locales'
import { Login } from './pages/Login'
import { MyOrders } from './pages/MyOrders'
import { Orders } from './pages/Orders'
import { Register } from './pages/Register'
import { RegisterLocal } from './pages/RegisterLocal'
import { ResetPassword } from './pages/ResetPassword'
import { Restaurant } from './pages/Restaurant'
import { ROLES } from './lib/roles'

function App() {
  return (
    <BrowserRouter>
      <ApiModeBanner />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/iniciar-sesion" element={<Login />} />
        <Route path="/registrarse" element={<Register />} />
        <Route path="/recuperar-contrasena" element={<ForgotPassword />} />
        <Route path="/restablecer-contrasena" element={<ResetPassword />} />

        <Route
          path="/cuenta"
          element={
            <ProtectedRoute>
              <AccountSettings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pedidos"
          element={
            <ProtectedRoute roles={[ROLES.CLIENT]}>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/locales"
          element={
            <ProtectedRoute roles={[ROLES.CLIENT]}>
              <Locales />
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
          path="/admin/usuarios"
          element={
            <ProtectedRoute roles={[ROLES.ADMIN]}>
              <AdminUsers />
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
          <Route path="promociones" element={<LocalPromotions />} />
          <Route path="pedidos" element={<LocalOrdersPage />} />
          <Route path="reclamos" element={<LocalClaims />} />
          <Route path="estadisticas" element={<LocalStats />} />
          <Route path="clientes" element={<LocalClients />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
