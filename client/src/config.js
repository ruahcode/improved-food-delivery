const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD ? 'https://food-delivery-y96l.onrender.com/api' : 'http://localhost:5000/api');

export default API_BASE_URL;
