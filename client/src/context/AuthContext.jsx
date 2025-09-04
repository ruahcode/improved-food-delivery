import React, { useState, useEffect, useCallback, useRef, useMemo, createContext } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import API_BASE_URL from '../config';
import { getApiUrl } from '../utils/api';
import TokenManager from '../utils/tokenManager';

// Create the auth context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isInitialMount = useRef(true);

  // Set axios defaults for credentials
  axios.defaults.withCredentials = true;

  // Clear authentication data
  const clearAuthData = useCallback(() => {
    // Clear tokens using TokenManager
    TokenManager.clearAll();
    
    // Clear any pending redirects
    sessionStorage.removeItem('pendingPath');
    sessionStorage.removeItem('pendingState');
    
    // Reset user state
    setUser(null);
    setError(null);
    
    // Don't redirect if we're already on a public page or during initial load
    const publicPaths = ['/login', '/register', '/', '/about', '/contact'];
    if (!publicPaths.includes(location.pathname) && !isInitialMount.current) {
      navigate('/login', {
        state: {
          from: location.pathname,
          message: 'Please log in to continue.'
        }
      });
    }
  }, [navigate, location.pathname]);

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    // Skip if we already have user data
    if (user) return;
    
    try {
      // Check if we have a valid token
      const token = TokenManager.getToken();
      
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      // Make API request to get user data
      const response = await axios.get(getApiUrl('user/me'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = response.data;
      const status = response.status;

      if (status !== 200) {
        console.log('API Request failed with status:', status);
        if (status === 401) {
          // Token is invalid, expired - clear auth data
          console.log('Authentication failed - clearing auth data');
          clearAuthData();
        }
        return;
      }

      // If we get here, the request was successful
      setUser(data.user);
      setError(null);
      
      // Check for pending redirect after login
      const pendingPath = sessionStorage.getItem('pendingPath');
      const pendingState = sessionStorage.getItem('pendingState');
      
      if (pendingPath) {
        sessionStorage.removeItem('pendingPath');
        if (pendingState) {
          navigate(pendingPath, { state: JSON.parse(pendingState) });
          sessionStorage.removeItem('pendingState');
        } else {
          navigate(pendingPath);
        }
      }
    } catch (err) {
      if (err.response?.status === 401) {
        // Token is invalid/expired - clear auth data (this is expected)
        clearAuthData();
      } else {
        console.log('Error fetching user data:', err.message);
        if (err.response?.status === 500) {
          clearAuthData();
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user, clearAuthData, navigate]);

  // Check for existing user data in localStorage on initial mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      
      // Try to load user from storage first
      const savedUser = TokenManager.getUser();
      const token = TokenManager.getToken();
      
      if (savedUser && token) {
        // Optimistically set user for faster UX, then validate with server
        setUser(savedUser);
      }
      
      // Always validate token with the server on load to prevent stale client state
      fetchUserData();
    }
  }, [fetchUserData]);

  // Require authentication for protected routes
  const requireAuth = useCallback((path, state = {}) => {
    if (!user) {
      // Store the current path and state so we can redirect back after login
      sessionStorage.setItem('pendingPath', path);
      if (state) {
        sessionStorage.setItem('pendingState', JSON.stringify(state));
      }
      navigate('/login');
      return false;
    }
    return true;
  }, [user, navigate]);

  // Login function
  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      console.log('Attempting login for:', email);
      
      const response = await axios.post(getApiUrl('user/login'), { email, password });
      const data = response.data;
      const status = response.status;

      console.log('Login API response:', { data, error, status });

      if (!data || !data.success) {
        const errorMessage = data?.message || 'Login failed';
        console.error('Login failed:', errorMessage);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      const { token, user: userData } = data;
      
      if (!token || !userData) {
        const errorMessage = 'Invalid response from server';
        console.error('Login failed:', errorMessage);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
      
      console.log('Login successful, storing user data:', userData);
      
      // Store the token and user data using TokenManager
      TokenManager.setToken(token);
      TokenManager.setUser(userData);
      
      // Update the user state
      setUser(userData);
      setError(null);
      
      // Check for pending redirect first
      const pendingPath = sessionStorage.getItem('pendingPath');
      const pendingState = sessionStorage.getItem('pendingState');
      
      if (pendingPath) {
        sessionStorage.removeItem('pendingPath');
        if (pendingState) {
          navigate(pendingPath, { state: JSON.parse(pendingState) });
          sessionStorage.removeItem('pendingState');
        } else {
          navigate(pendingPath);
        }
      } else {
        // Role-based redirect after login
        if (userData.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/home');
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.response?.status === 429) {
        errorMessage = 'Too many login attempts. Please wait before trying again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Register function
  const register = useCallback(async (userData) => {
    setLoading(true);
    try {
      // Map the userData to match server expectations
      const registrationData = {
        name: userData.name || userData.fullName,
        email: userData.email,
        password: userData.password,
        role: userData.role || 'user'
      };
      
      console.log('Registration data being sent:', registrationData);
      console.log('API base URL:', import.meta.env.VITE_API_BASE_URL);
      
      const response = await axios.post(getApiUrl('user/register'), registrationData);
      const data = response.data;

      console.log('Registration response:', { data, error });
      console.log('Full response data:', data);
      console.log('Error details:', error);


      
      if (!data || !data.success) {
        console.log('Registration failed - no success in response:', data);
        throw new Error(data?.message || 'Registration failed');
      }

      const { token, user: userDataResponse } = data;
      
      // Store the token and user data using TokenManager
      TokenManager.setToken(token);
      TokenManager.setUser(userDataResponse);
      
      // Update the user state
      setUser(userDataResponse);
      setError(null);
      
      // Role-based redirect after registration
      if (userDataResponse.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/home');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response?.status === 429) {
        errorMessage = 'Too many registration attempts. Please wait before trying again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const validationErrors = error.response.data.errors.map(err => err.msg).join(', ');
        errorMessage = `Validation failed: ${validationErrors}`;
      }
      
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Clear local auth data immediately for better UX
      clearAuthData();
      
      // Try to call the server-side logout endpoint if possible
      await axios.post(
        `${API_BASE_URL}/api/user/logout`,
        {},
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
          // Don't throw on network errors to ensure we always clear local state
          validateStatus: () => true,
        }
      );
      
      // Redirect to landing page after logout
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, we still want to clear the local auth state
      clearAuthData();
    }
  }, [clearAuthData, navigate]);

  // Update user data
  const updateUser = useCallback((userData) => {
    setUser(prev => ({ ...prev, ...userData }));
    // Update localStorage if needed
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
  }, []);

  // Refresh user data from server
  const refreshUser = useCallback(async () => {
    return fetchUserData();
  }, [fetchUserData]);

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  // Check if user has required role
  const hasRole = useCallback((requiredRole) => {
    if (!user || !user.role) return false;
    if (requiredRole === 'admin') return user.role === 'admin';
    return true; // For any other role or no specific role required
  }, [user]);

  const value = useMemo(() => ({
    user,
    loading,
    error,
    login,
    logout,
    register,
    requireAuth,
    clearError,
    updateUser,
    refreshUser,
    hasRole,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  }), [user, loading, error, login, logout, register, requireAuth, clearError, updateUser, refreshUser, hasRole]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export the provider as default and the context for components that need it
export { AuthContext, AuthProvider as default };
