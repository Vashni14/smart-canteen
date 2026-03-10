import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@context/AuthContext'
import { CartProvider } from '@context/CartContext'
import { SocketProvider } from '@context/SocketContext'

// Layouts
import CustomerLayout from '@layouts/CustomerLayout'
import DashboardLayout from '@layouts/DashboardLayout'

// Customer Pages
import LandingPage      from '@pages/customer/LandingPage'
import LoginPage        from '@pages/customer/LoginPage'
import RegisterPage     from '@pages/customer/RegisterPage'
import MenuPage         from '@pages/customer/MenuPage'
import CartPage         from '@pages/customer/CartPage'
import CheckoutPage     from '@pages/customer/CheckoutPage'
import OrderTrackPage   from '@pages/customer/OrderTrackPage'
import OrderHistoryPage from '@pages/customer/OrderHistoryPage'

// Kitchen Pages
import KitchenDashboard from '@pages/kitchen/KitchenDashboard'

// Pickup Pages
import PickupDashboard  from '@pages/pickup/PickupDashboard'

// Admin Pages
import AdminDashboard   from '@pages/admin/AdminDashboard'
import AdminMenu        from '@pages/admin/AdminMenu'
import AdminOrders      from '@pages/admin/AdminOrders'
import AdminInventory   from '@pages/admin/AdminInventory'
import AdminStaff       from '@pages/admin/AdminStaff'
import AdminReports     from '@pages/admin/AdminReports'

// Guards
import ProtectedRoute   from '@components/common/ProtectedRoute'

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <SocketProvider>
          <Routes>
            {/* ── Public / Customer Routes ────────────────── */}
            <Route element={<CustomerLayout />}>
              <Route path="/"          element={<LandingPage />} />
              <Route path="/login"     element={<LoginPage />} />
              <Route path="/register"  element={<RegisterPage />} />
              <Route path="/menu"      element={<MenuPage />} />
              <Route path="/cart"      element={<CartPage />} />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute roles={['customer']}>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute roles={['customer']}>
                    <OrderHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders/:id/track"
                element={
                  <ProtectedRoute roles={['customer']}>
                    <OrderTrackPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* ── Kitchen Routes ──────────────────────────── */}
            <Route
              path="/kitchen"
              element={
                <ProtectedRoute roles={['chef']}>
                  <DashboardLayout role="chef" />
                </ProtectedRoute>
              }
            >
              <Route index element={<KitchenDashboard />} />
            </Route>

            {/* ── Pickup Staff Routes ─────────────────────── */}
            <Route
              path="/pickup"
              element={
                <ProtectedRoute roles={['pickup']}>
                  <DashboardLayout role="pickup" />
                </ProtectedRoute>
              }
            >
              <Route index element={<PickupDashboard />} />
            </Route>

            {/* ── Admin Routes ────────────────────────────── */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['admin']}>
                  <DashboardLayout role="admin" />
                </ProtectedRoute>
              }
            >
              <Route index           element={<AdminDashboard />} />
              <Route path="menu"     element={<AdminMenu />} />
              <Route path="orders"   element={<AdminOrders />} />
              <Route path="inventory" element={<AdminInventory />} />
              <Route path="staff"    element={<AdminStaff />} />
              <Route path="reports"  element={<AdminReports />} />
            </Route>

            {/* ── Fallback ────────────────────────────────── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </CartProvider>
    </AuthProvider>
  )
}
