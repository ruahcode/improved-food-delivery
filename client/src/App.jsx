import './styles/main.css';

import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import AuthProvider from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CategoryProvider } from './context/CategoryContext';
import RoleBasedNavbar from './components/RoleBasedNavbar';
import ConditionalLayout from './components/ConditionalLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import RoleBasedRoute from './components/RoleBasedRoute';
import { ROLES } from './utils/roleUtils';

import LoadingSpinner from './components/LoadingSpinner';
import ScrollToTop from './components/ScrollToTop';

// Lazy load components
const Home = lazy(() => import('./pages/Home'));
const RestaurantListing = lazy(() => import('./pages/RestaurantListing'));
const CategoryResults = lazy(() => import('./pages/CategoryResults'));
const RestaurantMenu = lazy(() => import('./components/RestaurantMenu'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const AuthPage = lazy(() => import('./pages/auth/AuthPage'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const Favorites = lazy(() => import('./pages/Favorites'));
const CheckoutPage = lazy(() => import('./components/Checkout'));
const Orders = lazy(() => import('./pages/Orders'));
const Cart = lazy(() => import('./pages/Cart'));
const PaymentCallback = lazy(() => import('./pages/PaymentCallback'));

const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentFailure = lazy(() => import('./pages/PaymentFailure'));
const UserProfile = lazy(() => import('./pages/UserProfile'));


const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const AnalyticsPanel = lazy(() => import('./components/admin/AnalyticsPanel'));
const ProductManager = lazy(() => import('./components/admin/ProductManager'));
const OrderManager = lazy(() => import('./components/admin/OrderManager'));
const UserManager = lazy(() => import('./components/admin/UserManager'));

const Settings = lazy(() => import('./components/admin/Settings'));


const AppContent = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = React.useState(true);
  
  // Removed unused variables to fix lint errors

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Show loading for at least 1 second for better UX

    // Check if we're returning from Chapa payment with restoreAuth flag
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('restoreAuth') === 'true') {
      const savedToken = sessionStorage.getItem('prePaymentAuth');
      const savedPath = sessionStorage.getItem('prePaymentPath') || '/';
      
      if (savedToken) {
        // Restore the token to localStorage
        localStorage.setItem('token', savedToken);
        // Clear the session storage
        sessionStorage.removeItem('prePaymentAuth');
        sessionStorage.removeItem('prePaymentPath');
        
        // Redirect to the saved path or home
        window.location.replace(savedPath);
      }
    }

    return () => clearTimeout(timer);
  }, [location]);

  // Calculate the minimum height for content to prevent layout shifts
  const contentMinHeight = 'calc(100vh - 8rem)'; // 8rem accounts for header (4rem) + footer (4rem)

  // Full page loading overlay
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }


  return (
    <div className="min-h-screen flex flex-col bg-white relative">
      {/* Loading overlay - only shown during initial load */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      <ScrollToTop />
      <RoleBasedNavbar />
      <main className="flex-grow pt-16 bg-white">
        <Suspense fallback={
          <div style={{ minHeight: contentMinHeight }} className="flex items-center justify-center">
            <LoadingSpinner size="lg" className="text-red-500" />
          </div>
        }>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/restaurants" element={<RestaurantListing />} />
            <Route path="/category/:category" element={<CategoryResults />} />
            <Route path="/restaurants/:id" element={<RestaurantMenu />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/login" element={<AuthPage initialMode="login" />} />
            <Route path="/signup" element={<AuthPage initialMode="signup" />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/favorites" element={<Favorites />} />
            
            {/* Protected Routes */}
            <Route path="/checkout" element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            } />


            
            <Route path="/orders" element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />
            
            <Route path="/cart" element={<Cart />} />

            {/* Enhanced Payment Flow Routes */}
            <Route path="/order/:orderId/payment-callback" element={<PaymentCallback />} />
            <Route path="/order/:orderId/success" element={<PaymentSuccess />} />
            <Route path="/order/:orderId/failed" element={<PaymentFailure />} />
            <Route path="/payment/callback/:orderId" element={<PaymentCallback />} />
            <Route path="/payment/success/:orderId" element={<PaymentSuccess />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/failed/:orderId" element={<PaymentFailure />} />
            <Route path="/payment/failed" element={<PaymentFailure />} />
            
            {/* Admin Dashboard Routes */}
            <Route path="/admin" element={
              <RoleBasedRoute requiredRole={ROLES.ADMIN} fallbackPath="/" showUnauthorized={true}>
                <AdminLayout />
              </RoleBasedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="orders" element={<OrderManager />} />
              <Route path="users" element={<UserManager />} />
              <Route path="products" element={<ProductManager />} />
             
              <Route path="analytics" element={<AnalyticsPanel />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            {/* 404 Route - Keep this last */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <ConditionalLayout />
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <CategoryProvider>
            <AppContent />
          </CategoryProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;