import { useState, useEffect } from 'react';
import { useCategory } from '../context/CategoryContext';

/**
 * Custom hook to handle category filtering logic
 * @param {Array} items - Array of items to filter
 * @param {string} categoryField - The field name in items that contains the category
 * @returns {Object} Filtered items and loading state
 */
const useCategoryFilter = (items = [], categoryField = 'category') => {
  const { selectedCategory } = useCategory();
  const [filteredItems, setFilteredItems] = useState(items);
  const [isFiltering, setIsFiltering] = useState(false);

  useEffect(() => {
    const filterItems = async () => {
      if (!selectedCategory) {
        setFilteredItems(items);
        return;
      }

      setIsFiltering(true);
      
      // Simulate API call delay for better UX
      const timer = setTimeout(() => {
        const filtered = items.filter(item => {
          const itemCategory = item[categoryField];
          if (!itemCategory) return false;
          
          // Handle array of cuisines
          if (Array.isArray(itemCategory)) {
            return itemCategory.some(cuisine => 
              cuisine.toLowerCase().includes(selectedCategory.toLowerCase())
            );
          }
          
          // Handle string cuisine
          return itemCategory.toLowerCase().includes(selectedCategory.toLowerCase());
        });
        setFilteredItems(filtered);
        setIsFiltering(false);
      }, 300);

      return () => clearTimeout(timer);
    };

    filterItems();
  }, [selectedCategory, items, categoryField]);

  return {
    filteredItems,
    isFiltering,
    activeCategory: selectedCategory
  };
};

export default useCategoryFilter;
