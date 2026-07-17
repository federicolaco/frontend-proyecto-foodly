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
import { LocalStats } from './pages/local/LocalStatsPage'
import { Locales } from './pages/Locales'
import { Login } from './pages/Login'
import { MyOrders } from './pages/MyOrders'
import { Orders } from './pages/Orders'
import { Register } from './pages/Register'
import { RegisterGoogle } from './pages/RegisterGoogle'
import { RegisterLocal } from './pages/RegisterLocal'
import { ResetPassword } from './pages/ResetPassword'
import { ConfirmEmailChange } from './pages/ConfirmEmailChange'
import { Restaurant } from './pages/Restaurant'
import { ROLES } from './lib/roles'
import { ActivarCuenta } from './pages/ActivarCuenta'
import { PaymentSuccess } from './pages/payment/PaymentSuccess'
import { PaymentFailure } from './pages/payment/PaymentFailure'
import { PaymentPending } from './pages/payment/PaymentPending'
import { RegisterPendingActivation } from './pages/RegisterPendingActivation'
import { ResendActivation } from './pages/ResendActivation'
import { SessionWatcher } from './components/SessionWatcher'

function App() {
  return (
    <BrowserRouter>
      <SessionWatcher />
      <ApiModeBanner />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/iniciar-sesion" element={<Login />} />
        <Route path="/registrarse" element={<Register />} />
        <Route path="/registrarse/google" element={<RegisterGoogle />} />
        <Route path="/registro/pendiente-activacion" element={<RegisterPendingActivation />} />
        <Route path="/recuperar-contrasena" element={<ForgotPassword />} />
        <Route path="/restablecer-contrasena" element={<ResetPassword />} />
        <Route path="/confirmar-cambio-correo" element={<ConfirmEmailChange />} />
        <Route path="/activar-cuenta" element={<ActivarCuenta />} />
        <Route path="/reenviar-activacion" element={<ResendActivation />} />

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
          path="/pago/exito"
          element={
            <ProtectedRoute roles={[ROLES.CLIENT]}>
              <PaymentSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pago/error"
          element={
            <ProtectedRoute roles={[ROLES.CLIENT]}>
              <PaymentFailure />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pago/pendiente"
          element={
            <ProtectedRoute roles={[ROLES.CLIENT]}>
              <PaymentPending />
            </ProtectedRoute>
          }
        />

        <Route path="/registrar-local" element={<RegisterLocal />} />

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