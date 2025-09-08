import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useAdminData = (endpoint, dependencies = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/admin${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      if (response.data.success) {
        setData(response.data.data || response.data[Object.keys(response.data)[1]] || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
      console.error(`Error fetching ${endpoint}:`, err);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  const updateItem = useCallback(async (id, updateData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/admin${endpoint}/${id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setData(prevData => 
          prevData.map(item => 
            item._id === id ? { ...item, ...updateData } : item
          )
        );
        return { success: true };
      }
      throw new Error(response.data.message || 'Update failed');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Update failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [endpoint]);

  const deleteItem = useCallback(async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`/api/admin${endpoint}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setData(prevData => prevData.filter(item => item._id !== id));
        return { success: true };
      }
      throw new Error(response.data.message || 'Delete failed');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Delete failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, dependencies);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    updateItem,
    deleteItem,
    setError
  };
};

export default useAdminData;