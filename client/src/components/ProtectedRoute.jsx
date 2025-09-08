import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false, requiredRole = null }) => {
  const auth = useContext(AuthContext);
  
  if (!auth) {
    return <Navigate to="/login" replace />;
  }
  
  const { user, loading } = auth;
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user) {
    const from = location.pathname + location.search;
    return <Navigate to="/login" state={{ from }} replace />;
  }

  // Check role requirements
  const roleRequired = requiredRole || (requireAdmin ? 'admin' : null);
  if (roleRequired && user.role !== roleRequired) {
    return <Navigate to="/" state={{ message: 'Unauthorized access' }} replace />;
  }

  return children;
};

export default ProtectedRoute;
