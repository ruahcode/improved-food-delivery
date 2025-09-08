import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, hasAnyRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Show a loading spinner or skeleton screen while checking authentication
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login page with the return URL
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles are specified, check if user has any of the required roles
  if (roles.length > 0 && !hasAnyRole(roles)) {
    // User is authenticated but doesn't have the required role
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  // User is authenticated and has the required role (if any)
  return children;
};

export default ProtectedRoute;
