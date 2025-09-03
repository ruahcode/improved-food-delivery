import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { hasRole, hasAnyRole, hasPermission, canAccessRoute } from '../utils/roleUtils';

const RoleBasedRoute = ({ 
  children, 
  requiredRole = null, 
  requiredRoles = [], 
  requiredPermission = null,
  fallbackPath = '/',
  showUnauthorized = false 
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Check if user can access the current route
  if (!canAccessRoute(user, location.pathname)) {
    return <Navigate to={fallbackPath} state={{ message: 'Access denied' }} replace />;
  }

  // Check specific role requirement
  if (requiredRole && !hasRole(user, requiredRole)) {
    if (showUnauthorized) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }
    return <Navigate to={fallbackPath} state={{ message: 'Insufficient permissions' }} replace />;
  }

  // Check multiple roles requirement
  if (requiredRoles.length > 0 && !hasAnyRole(user, requiredRoles)) {
    if (showUnauthorized) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }
    return <Navigate to={fallbackPath} state={{ message: 'Insufficient permissions' }} replace />;
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    if (showUnauthorized) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }
    return <Navigate to={fallbackPath} state={{ message: 'Insufficient permissions' }} replace />;
  }

  // User has required permissions, render the component
  return children;
};

export default RoleBasedRoute;