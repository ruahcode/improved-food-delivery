// Route guard utilities for role-based access control

export const canAccessRoute = (userRole, routePath) => {
  // Admin routes - only accessible by admin users
  const adminRoutes = ['/admin', '/admin/dashboard', '/admin/users', '/admin/orders', '/admin/analytics', '/admin/settings'];
  
  // User routes - accessible by all authenticated users
  const userRoutes = ['/', '/restaurants', '/favorites', '/contact', '/orders', '/cart', '/checkout'];
  
  // Public routes - accessible by everyone
  const publicRoutes = ['/', '/restaurants', '/contact', '/login', '/signup', '/auth'];

  // Check if route starts with admin path
  if (adminRoutes.some(route => routePath.startsWith(route))) {
    return userRole === 'admin';
  }

  // All other routes are accessible based on authentication status
  return true;
};

export const getRedirectPath = (userRole) => {
  return userRole === 'admin' ? '/admin' : '/';
};

export const shouldShowNavigation = (userRole, currentPath) => {
  // Hide navigation on auth pages
  const authPages = ['/login', '/signup', '/auth'];
  return !authPages.includes(currentPath);
};