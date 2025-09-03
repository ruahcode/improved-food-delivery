// Role-based access control utilities

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  RESTAURANT_OWNER: 'restaurant_owner'
};

export const PERMISSIONS = {
  // Admin permissions
  MANAGE_USERS: 'manage_users',
  MANAGE_RESTAURANTS: 'manage_restaurants',
  MANAGE_ORDERS: 'manage_orders',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_SYSTEM: 'manage_system',
  
  // User permissions
  PLACE_ORDERS: 'place_orders',
  VIEW_ORDERS: 'view_orders',
  MANAGE_PROFILE: 'manage_profile',
  
  // Restaurant owner permissions
  MANAGE_OWN_RESTAURANT: 'manage_own_restaurant',
  MANAGE_OWN_MENU: 'manage_own_menu',
  VIEW_OWN_ORDERS: 'view_own_orders'
};

// Role to permissions mapping
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_RESTAURANTS,
    PERMISSIONS.MANAGE_ORDERS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_SYSTEM,
    PERMISSIONS.PLACE_ORDERS,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.MANAGE_PROFILE
  ],
  [ROLES.USER]: [
    PERMISSIONS.PLACE_ORDERS,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.MANAGE_PROFILE
  ],
  [ROLES.RESTAURANT_OWNER]: [
    PERMISSIONS.MANAGE_OWN_RESTAURANT,
    PERMISSIONS.MANAGE_OWN_MENU,
    PERMISSIONS.VIEW_OWN_ORDERS,
    PERMISSIONS.PLACE_ORDERS,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.MANAGE_PROFILE
  ]
};

// Check if user has specific role
export const hasRole = (user, role) => {
  return user?.role === role;
};

// Check if user has specific permission
export const hasPermission = (user, permission) => {
  if (!user?.role) return false;
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  return rolePermissions.includes(permission);
};

// Check if user has any of the specified roles
export const hasAnyRole = (user, roles) => {
  return roles.some(role => hasRole(user, role));
};

// Check if user has all of the specified permissions
export const hasAllPermissions = (user, permissions) => {
  return permissions.every(permission => hasPermission(user, permission));
};

// Check if user has any of the specified permissions
export const hasAnyPermission = (user, permissions) => {
  return permissions.some(permission => hasPermission(user, permission));
};

// Get user's role-based redirect path
export const getRoleBasedRedirectPath = (user) => {
  if (!user) return '/login';
  
  switch (user.role) {
    case ROLES.ADMIN:
      return '/admin';
    case ROLES.RESTAURANT_OWNER:
      return '/restaurant/dashboard';
    case ROLES.USER:
    default:
      return '/home';
  }
};

// Check if route is accessible to user
export const canAccessRoute = (user, route) => {
  // Public routes accessible to all
  const publicRoutes = ['/', '/home', '/restaurants', '/about', '/contact', '/login', '/register'];
  if (publicRoutes.includes(route)) return true;
  
  // Protected routes require authentication
  if (!user) return false;
  
  // Admin routes
  if (route.startsWith('/admin')) {
    return hasRole(user, ROLES.ADMIN);
  }
  
  // Restaurant owner routes
  if (route.startsWith('/restaurant')) {
    return hasAnyRole(user, [ROLES.ADMIN, ROLES.RESTAURANT_OWNER]);
  }
  
  // User routes (accessible to all authenticated users)
  const userRoutes = ['/profile', '/orders', '/cart', '/checkout', '/favorites'];
  if (userRoutes.some(userRoute => route.startsWith(userRoute))) {
    return true; // All authenticated users can access these
  }
  
  return true; // Default allow for other routes
};