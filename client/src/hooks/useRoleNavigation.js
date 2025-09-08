import { useNavigate } from 'react-router-dom';
import { getRoleBasedRedirectPath } from '../utils/roleUtils';
import useAuth from './useAuth';

/**
 * Custom hook for role-based navigation
 */
const useRoleNavigation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  /**
   * Navigate to user's role-based default page
   */
  const navigateToRoleHome = () => {
    const path = getRoleBasedRedirectPath(user);
    navigate(path);
  };

  /**
   * Navigate with role-based fallback
   * @param {string} path - Desired path
   * @param {object} options - Navigation options
   */
  const navigateWithRoleFallback = (path, options = {}) => {
    if (!user) {
      navigate('/login', { state: { from: path }, ...options });
      return;
    }

    // Try to navigate to the desired path
    // If access is denied, the RoleBasedRoute component will handle the redirect
    navigate(path, options);
  };

  /**
   * Get the appropriate dashboard path for the user's role
   */
  const getDashboardPath = () => {
    if (!user) return '/login';
    
    switch (user.role) {
      case 'admin':
        return '/admin';
      case 'restaurant_owner':
        return '/restaurant/dashboard';
      default:
        return '/profile';
    }
  };

  return {
    navigateToRoleHome,
    navigateWithRoleFallback,
    getDashboardPath
  };
};

export default useRoleNavigation;