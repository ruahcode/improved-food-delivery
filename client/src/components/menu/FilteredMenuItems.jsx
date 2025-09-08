import React, { useState, useEffect } from 'react';
import useCategoryFilter from '../../hooks/useCategoryFilter';
import { filterByCategory, fetchFilteredItems, shouldUseServerFiltering } from '../../utils/filterUtils';
import LoadingSpinner from '../common/LoadingSpinner';

const FilteredMenuItems = ({ items = [], categoryField = 'category' }) => {
  const [menuItems, setMenuItems] = useState(items);
  const [isLoading, setIsLoading] = useState(false);
  const [useServerFiltering, setUseServerFiltering] = useState(false);
  
  const { filteredItems, isFiltering, activeCategory } = useCategoryFilter(menuItems, categoryField);
  
  // Determine if we should use server-side filtering
  useEffect(() => {
    setUseServerFiltering(shouldUseServerFiltering(items.length));
  }, [items.length]);
  
  // Handle server-side filtering
  useEffect(() => {
    if (!useServerFiltering || !activeCategory) return;
    
    const fetchItems = async () => {
      try {
        setIsLoading(true);
        // Replace with your actual API endpoint
        const endpoint = '/api/menu/items';
        const data = await fetchFilteredItems(endpoint, activeCategory);
        setMenuItems(data);
      } catch (error) {
        console.error('Error fetching filtered items:', error);
        // Fallback to client-side filtering if server fails
        setMenuItems(filterByCategory(items, activeCategory, categoryField));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchItems();
  }, [activeCategory, useServerFiltering, items, categoryField]);
  
  // Reset items when no category is selected and using server filtering
  useEffect(() => {
    if (useServerFiltering && !activeCategory) {
      // Replace with your actual API endpoint for all items
      const fetchAllItems = async () => {
        try {
          setIsLoading(true);
          const response = await fetch('/api/menu/items');
          const data = await response.json();
          setMenuItems(data);
        } catch (error) {
          console.error('Error fetching all items:', error);
          setMenuItems(items);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchAllItems();
    }
  }, [activeCategory, useServerFiltering, items]);
  
  if (isLoading || isFiltering) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredItems.length > 0 ? (
        filteredItems.map((item) => (
          <div 
            key={item.id} 
            className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1"
          >
            <div className="h-48 bg-gray-200 overflow-hidden">
              {item.image && (
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  {item[categoryField]}
                </span>
              </div>
              <p className="mt-2 text-gray-600">{item.description}</p>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">${item.price?.toFixed(2)}</span>
                <button 
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  onClick={() => console.log('Add to cart:', item.id)}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="col-span-full text-center py-12">
          <div className="text-gray-500 text-lg">
            No items found{activeCategory ? ` in ${activeCategory}` : ''}.
          </div>
          {activeCategory && (
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-red-600 hover:text-red-800 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FilteredMenuItems;
