/**
 * Filters items by category on the client side
 * @param {Array} items - Array of items to filter
 * @param {string} category - Category to filter by
 * @param {string} categoryField - Field name containing the category
 * @returns {Array} Filtered items
 */
export const filterByCategory = (items = [], category = '', categoryField = 'category') => {
  if (!category) return items;
  return items.filter(
    item => item[categoryField]?.toLowerCase() === category.toLowerCase()
  );
};

/**
 * Fetches filtered items from the server
 * @param {string} endpoint - API endpoint
 * @param {string} category - Category to filter by
 * @returns {Promise<Array>} Promise resolving to filtered items
 */
export const fetchFilteredItems = async (endpoint, category) => {
  try {
    const url = category ? `${endpoint}?category=${encodeURIComponent(category)}` : endpoint;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch filtered items');
    return await response.json();
  } catch (error) {
    console.error('Error fetching filtered items:', error);
    throw error;
  }
};

/**
 * Determines whether to use client-side or server-side filtering
 * @param {number} itemCount - Total number of items
 * @param {number} threshold - Threshold for server-side filtering
 * @returns {boolean} True if should use server-side filtering
 */
export const shouldUseServerFiltering = (itemCount, threshold = 100) => {
  return itemCount > threshold;
};
