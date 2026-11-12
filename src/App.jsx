import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { FeedbackProvider } from './context/FeedbackProvider';
import { ProtectedRoute } from './components/routing/ProtectedRoute';
import Layout from './components/layout/Layout'; 

const LandingPage = lazy(() => import('./features/LandingPage'));
const LoginPage = lazy(() => import('./features/auth/LoginPage'));
const RegisterPage = lazy(() => import('./features/auth/RegisterPage'));
const PlatformSetupPage = lazy(() => import('./features/auth/PlatformSetupPage'));
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage'));
const PosPage = lazy(() => import('./features/pos/PosPage'));
const ProductsPage = lazy(() => import('./features/inventory/ProductsPage'));
const ShopsPage = lazy(() => import('./features/shops/ShopsPage'));
const StaffPage = lazy(() => import('./features/staff/StaffPage'));
const SalesPage = lazy(() => import('./features/sales/SalesPage'));
const CustomersPage = lazy(() => import('./features/finance/CustomersPage'));
const DebtsPage = lazy(() => import('./features/finance/DebtsPage'));
const ExpensesPage = lazy(() => import('./features/finance/ExpensesPage'));
const StockUsePage = lazy(() => import('./features/finance/StockUsePage'));
const AccountsPage = lazy(() => import('./features/finance/AccountsPage'));
const AdminTenantsPage = lazy(() => import('./features/admin/AdminTenantsPage'));

export default function App() {
  return (
    <ThemeProvider>
      <FeedbackProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<div role="status" aria-live="polite" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Loading page...</div>}>
              <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/owner/login" element={<Navigate to="/login" replace />} />
              <Route path="/platform/login" element={<Navigate to="/login" replace />} />
              <Route path="/platform/setup" element={<PlatformSetupPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Shop owner portal */}
              <Route element={<ProtectedRoute portal="owner"><Layout variant="owner" /></ProtectedRoute>}>
                <Route path="/owner/dashboard" element={<ProtectedRoute allowedRoles={['OWNER']}><DashboardPage /></ProtectedRoute>} />
                <Route path="/owner/pos" element={<ProtectedRoute allowedRoles={['OWNER']}><PosPage /></ProtectedRoute>} />
                <Route path="/owner/products" element={<ProtectedRoute allowedRoles={['OWNER']}><ProductsPage /></ProtectedRoute>} />
                <Route path="/owner/shops" element={<ProtectedRoute allowedRoles={['OWNER']}><ShopsPage /></ProtectedRoute>} />
                <Route path="/owner/staff" element={<ProtectedRoute allowedRoles={['OWNER']}><StaffPage /></ProtectedRoute>} />
                <Route path="/owner/sales" element={<ProtectedRoute allowedRoles={['OWNER', 'STAFF']}><SalesPage /></ProtectedRoute>} />
                <Route path="/owner/customers" element={<ProtectedRoute allowedRoles={['OWNER', 'STAFF']}><CustomersPage /></ProtectedRoute>} />
                <Route path="/owner/debts" element={<ProtectedRoute allowedRoles={['OWNER', 'STAFF']}><DebtsPage /></ProtectedRoute>} />
                <Route path="/owner/expenses" element={<ProtectedRoute allowedRoles={['OWNER']}><ExpensesPage /></ProtectedRoute>} />
                <Route path="/owner/stock-use" element={<ProtectedRoute allowedRoles={['OWNER']}><StockUsePage /></ProtectedRoute>} />
                <Route path="/owner/accounts" element={<ProtectedRoute allowedRoles={['OWNER']}><AccountsPage /></ProtectedRoute>} />
              </Route>

              {/* SaaS owner portal: account provisioned during system setup */}
              <Route element={<ProtectedRoute portal="platform"><Layout variant="platform" /></ProtectedRoute>}>
                <Route path="/owner/admin/tenants" element={<ProtectedRoute portal="platform" allowedRoles={['SUPER_ADMIN']}><AdminTenantsPage /></ProtectedRoute>} />
              </Route>

              {/* Client / Shop portal */}
              <Route element={<ProtectedRoute portal="client"><Layout variant="client" /></ProtectedRoute>}>
                <Route path="/client/pos" element={<ProtectedRoute allowedRoles={['OWNER', 'STAFF']}><PosPage /></ProtectedRoute>} />
                <Route path="/client/sales" element={<ProtectedRoute allowedRoles={['OWNER', 'STAFF']}><SalesPage /></ProtectedRoute>} />
                <Route path="/client/customers" element={<ProtectedRoute allowedRoles={['OWNER', 'STAFF']}><CustomersPage /></ProtectedRoute>} />
                <Route path="/client/debts" element={<ProtectedRoute allowedRoles={['OWNER', 'STAFF']}><DebtsPage /></ProtectedRoute>} />
              </Route>

              {/* Legacy routes for compatibility */}
              <Route path="/dashboard" element={<Navigate to="/owner/dashboard" replace />} />
              <Route path="/pos" element={<Navigate to={posRedirectPath()} replace />} />
              <Route path="/products" element={<Navigate to="/owner/products" replace />} />
              <Route path="/shops" element={<Navigate to="/owner/shops" replace />} />
              <Route path="/staff" element={<Navigate to="/owner/staff" replace />} />
              <Route path="/admin/tenants" element={<Navigate to="/owner/admin/tenants" replace />} />
              <Route path="/sales" element={<Navigate to={userRoleRedirectPath()} replace />} />
              <Route path="/customers" element={<Navigate to={userRoleRedirectPath()} replace />} />
              <Route path="/debts" element={<Navigate to={userRoleRedirectPath()} replace />} />
              <Route path="/expenses" element={<Navigate to="/owner/expenses" replace />} />
              <Route path="/stock-use" element={<Navigate to="/owner/stock-use" replace />} />
              <Route path="/accounts" element={<Navigate to="/owner/accounts" replace />} />

              {/* Unknown Routes */}
              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </FeedbackProvider>
    </ThemeProvider>
  );
}

function userRoleRedirectPath() {
  const user = JSON.parse(localStorage.getItem('leo_user') || 'null');
  return user?.role === 'OWNER' ? '/owner/sales' : '/client/sales';
}

function posRedirectPath() {
  const user = JSON.parse(localStorage.getItem('leo_user') || 'null');
  return user?.role === 'OWNER' ? '/owner/pos' : '/client/pos';
}
