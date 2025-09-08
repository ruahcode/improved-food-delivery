import api from '../utils/api';

export const menuService = {
  // Get all restaurants
  getRestaurants: async () => {
    try {
      const response = await api.get('/api/admin/restaurants');
      return response.data;
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      throw error;
    }
  },

  // Get menu items for a restaurant
  getMenuItems: async (restaurantId) => {
    try {
      const response = await api.get(`/api/admin/restaurants/${restaurantId}/menu-items`);
      return response.data;
    } catch (error) {
      console.error('Error fetching menu items:', error);
      throw error;
    }
  },

  // Create new menu item
  createMenuItem: async (restaurantId, itemData) => {
    try {
      const response = await api.post(
        `/api/admin/restaurants/${restaurantId}/menu-items`,
        itemData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating menu item:', error);
      throw error;
    }
  },

  // Update menu item
  updateMenuItem: async (itemId, updates) => {
    try {
      const response = await api.put(`/api/admin/menu-items/${itemId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating menu item:', error);
      throw error;
    }
  },

  // Delete menu item
  deleteMenuItem: async (itemId) => {
    try {
      await api.delete(`/api/admin/menu-items/${itemId}`);
      return itemId; // Return the deleted item ID for state updates
    } catch (error) {
      console.error('Error deleting menu item:', error);
      throw error;
    }
  },

  // Toggle item availability
  toggleItemAvailability: async (itemId, currentStatus) => {
    try {
      const response = await api.patch(`/api/admin/menu-items/${itemId}`, {
        isAvailable: !currentStatus
      });
      return response.data;
    } catch (error) {
      console.error('Error toggling item availability:', error);
      throw error;
    }
  }
};
