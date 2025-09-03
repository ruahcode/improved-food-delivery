import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { hasRole, hasPermission, hasAnyRole, ROLES } from '../utils/roleUtils';

/**
 * Custom hook to access the auth context
 * @returns {Object} The auth context value
 * @throws {Error} If used outside of an AuthProvider
 */
const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined || context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  // Add role-based utility functions
  const extendedContext = {
    ...context,
    // Role checking functions
    hasRole: (role) => hasRole(context.user, role),
    hasPermission: (permission) => hasPermission(context.user, permission),
    hasAnyRole: (roles) => hasAnyRole(context.user, roles),
    
    // Convenience role checks
    isAdmin: () => hasRole(context.user, ROLES.ADMIN),
    isUser: () => hasRole(context.user, ROLES.USER),
    isRestaurantOwner: () => hasRole(context.user, ROLES.RESTAURANT_OWNER),
    
    // Role constants for easy access
    ROLES
  };
  
  return extendedContext;
};

export default useAuth;
