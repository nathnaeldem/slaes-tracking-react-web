import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import Layout from './components/shared/Layout';

// Lazy-loaded pages
const LoginPage     = lazy(() => import('./components/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProductsPage  = lazy(() => import('./pages/ProductsPage'));
const ReportsPage   = lazy(() => import('./pages/ReportsPage'));
const UsersPage     = lazy(() => import('./pages/UsersPage'));

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Loading...</p>
    </div>
  );
}

function ProtectedRoute() {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function AppRoutes() {
  const { token } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={
          token ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />

      {/* Protected */}
      <Route path="/" element={<ProtectedRoute />}>  
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="products"  element={<ProductsPage />} />
        <Route path="reports"   element={<ReportsPage />} />
        <Route path="users"     element={<UsersPage />} />
      </Route>

      {/* Fallback */}
      <Route
        path="*"
        element={<Navigate to={token ? '/dashboard' : '/login'} replace />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<LoadingScreen />}>
        <AppRoutes />
      </Suspense>
    </AuthProvider>
  );
}
