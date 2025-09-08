import React, { useState, useContext } from 'react';
import { CategoryContext } from './category-context';

export const CategoryProvider = ({ children }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Function to update the selected category
  const selectCategory = (category) => {
    setSelectedCategory(category === selectedCategory ? null : category);
  };

  return (
    <CategoryContext.Provider value={{ selectedCategory, selectCategory }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategory = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategory must be used within a CategoryProvider');
  }
  return context;
};
