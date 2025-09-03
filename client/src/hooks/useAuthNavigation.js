import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const useAuthNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [authState, setAuthState] = useState(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return {
      isLoggedIn: Boolean(token),
      isAdmin: user?.role === 'admin',
      user
    };
  });

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthState({ isLoggedIn: false, isAdmin: false, user: {} });
    navigate('/login');
  }, [navigate]);



  return {
    ...authState,
    handleLogout
  };
};
