import React, { createContext, useContext, useReducer, useCallback } from 'react';
import axios from 'axios';

const AdminContext = createContext();

const initialState = {
  users: [],
  orders: [],
  products: [],
  payments: [],
  analytics: null,
  loading: {
    users: false,
    orders: false,
    products: false,
    payments: false,
    analytics: false,
  },
  errors: {
    users: null,
    orders: null,
    products: null,
    payments: null,
    analytics: null,
  }
};

const adminReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, [action.resource]: action.loading }
      };
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.resource]: action.error }
      };
    case 'SET_DATA':
      return {
        ...state,
        [action.resource]: action.data,
        loading: { ...state.loading, [action.resource]: false },
        errors: { ...state.errors, [action.resource]: null }
      };
    case 'UPDATE_ITEM':
      return {
        ...state,
        [action.resource]: state[action.resource].map(item =>
          item._id === action.id ? { ...item, ...action.updates } : item
        )
      };
    case 'DELETE_ITEM':
      return {
        ...state,
        [action.resource]: state[action.resource].filter(item => item._id !== action.id)
      };
    case 'ADD_ITEM':
      return {
        ...state,
        [action.resource]: [...state[action.resource], action.item]
      };
    default:
      return state;
  }
};

export const AdminProvider = ({ children }) => {
  const [state, dispatch] = useReducer(adminReducer, initialState);

  const makeRequest = useCallback(async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    return axios({
      url: `/api/admin${endpoint}`,
      headers: { Authorization: `Bearer ${token}` },
      ...options
    });
  }, []);

  const fetchData = useCallback(async (resource, params = {}) => {
    dispatch({ type: 'SET_LOADING', resource, loading: true });
    try {
      const response = await makeRequest(`/${resource}`, { params });
      if (response.data.success) {
        const data = response.data[resource] || response.data.data || [];
        dispatch({ type: 'SET_DATA', resource, data });
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        resource, 
        error: error.response?.data?.message || error.message 
      });
    }
  }, [makeRequest]);

  const updateItem = useCallback(async (resource, id, updates) => {
    try {
      const response = await makeRequest(`/${resource}/${id}`, {
        method: 'PUT',
        data: updates
      });
      if (response.data.success) {
        dispatch({ type: 'UPDATE_ITEM', resource, id, updates });
        return { success: true };
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        resource, 
        error: error.response?.data?.message || error.message 
      });
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }, [makeRequest]);

  const deleteItem = useCallback(async (resource, id) => {
    try {
      const response = await makeRequest(`/${resource}/${id}`, {
        method: 'DELETE'
      });
      if (response.data.success) {
        dispatch({ type: 'DELETE_ITEM', resource, id });
        return { success: true };
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        resource, 
        error: error.response?.data?.message || error.message 
      });
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }, [makeRequest]);

  const addItem = useCallback(async (resource, itemData) => {
    try {
      const response = await makeRequest(`/${resource}`, {
        method: 'POST',
        data: itemData
      });
      if (response.data.success) {
        const newItem = response.data[resource.slice(0, -1)] || response.data.data;
        dispatch({ type: 'ADD_ITEM', resource, item: newItem });
        return { success: true, data: newItem };
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        resource, 
        error: error.response?.data?.message || error.message 
      });
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }, [makeRequest]);

  const clearError = useCallback((resource) => {
    dispatch({ type: 'SET_ERROR', resource, error: null });
  }, []);

  const value = {
    ...state,
    fetchData,
    updateItem,
    deleteItem,
    addItem,
    clearError
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export default AdminContext;