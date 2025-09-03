import axios from 'axios';

export const refreshToken = async () => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/user/refresh-token`,
      {},
      { withCredentials: true }
    );
    
    if (response.data.success && response.data.accessToken) {
      localStorage.setItem('token', response.data.accessToken);
      return response.data.accessToken;
    }
    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
};

export const makeAuthenticatedRequest = async (requestFn) => {
  try {
    return await requestFn();
  } catch (error) {
    if (error.response?.status === 401) {
      const newToken = await refreshToken();
      if (newToken) {
        return await requestFn();
      }
      throw new Error('Session expired. Please log in again.');
    }
    throw error;
  }
};