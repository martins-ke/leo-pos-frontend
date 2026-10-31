import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { FeedbackProvider } from './context/FeedbackProvider';
import { ProtectedRoute } from './components/routing/ProtectedRoute';
import Layout from './components/layout/Layout';

import LandingPage from './features/LandingPage';

import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import DashboardPage from './features/dashboard/DashboardPage';
import PosPage from './features/pos/PosPage';
import ProductsPage from './features/inventory/ProductsPage';
import ShopsPage from './features/shops/ShopsPage';
import StaffPage from './features/staff/StaffPage';
import SalesPage from './features/sales/SalesPage';
import CustomersPage from './features/finance/CustomersPage';
import DebtsPage from './features/finance/DebtsPage';
import ExpensesPage from './features/finance/ExpensesPage';
import StockUsePage from './features/finance/StockUsePage';
import AccountsPage from './features/finance/AccountsPage';

export default function App() {
return ( <ThemeProvider> <FeedbackProvider> <AuthProvider> <BrowserRouter> <Routes>

          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected POS Routes */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['OWNER']}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route path="/pos" element={<PosPage />} />

            <Route
              path="/products"
              element={
                <ProtectedRoute allowedRoles={['OWNER']}>
                  <ProductsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/shops"
              element={
                <ProtectedRoute allowedRoles={['OWNER']}>
                  <ShopsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/staff"
              element={
                <ProtectedRoute allowedRoles={['OWNER']}>
                  <StaffPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/sales"
              element={
                <ProtectedRoute allowedRoles={['OWNER', 'STAFF']}>
                  <SalesPage />
                </ProtectedRoute>
              }
            />

            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/debts" element={<DebtsPage />} />

            <Route
              path="/expenses"
              element={
                <ProtectedRoute allowedRoles={['OWNER']}>
                  <ExpensesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/stock-use"
              element={
                <ProtectedRoute allowedRoles={['OWNER']}>
                  <StockUsePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/accounts"
              element={
                <ProtectedRoute allowedRoles={['OWNER']}>
                  <AccountsPage />
                </ProtectedRoute>
              }
            />

          </Route>

          {/* Unknown Routes */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </FeedbackProvider>
</ThemeProvider>

);
}
