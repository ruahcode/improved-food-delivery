import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import NewAdminLayout from '../components/admin/NewAdminLayout';
import AdminDashboard from '../components/admin/AdminDashboard';
import ProductManager from '../components/admin/ProductManager';
import OrderManager from '../components/admin/OrderManager';
import UserManager from '../components/admin/UserManager';
import AnalyticsPanel from '../components/admin/AnalyticsPanel';
import Settings from '../components/admin/Settings';
import useAuth from '../hooks/useAuth';

const AdminRoutes = () => {
  const { user } = useAuth();

  // Redirect to home if user is not an admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <NewAdminLayout>
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="products/*" element={<ProductManager />} />
        <Route path="orders" element={<OrderManager />} />
        <Route path="users" element={<UserManager />} />
        <Route path="settings" element={<Settings />} />
        <Route path="analytics" element={<AnalyticsPanel />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </NewAdminLayout>
  );
};

export default AdminRoutes;
