import React, { createContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Return children directly without any theme context
  return children;
};

// No-op implementation of useTheme
export const useTheme = () => ({
  theme: 'light',
  toggleTheme: () => {}
});

export default ThemeContext;