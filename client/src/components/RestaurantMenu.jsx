import { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useParams, useNavigate } from 'react-router-dom';
import { FaStar, FaClock, FaMapMarkerAlt, FaPlus, FaMinus, FaUtensils, FaShoppingCart } from 'react-icons/fa';
import axios from 'axios';
import useCart from '../hooks/useCart';
import API_BASE_URL from '../config';
import { handleImageError, getImageWithFallback } from '../utils/imageUtils';

// Default restaurant data structure
const defaultRestaurant = {
  _id: '',
  name: 'Loading...',
  rating: 0,
  reviewCount: 0,
  cuisine: 'Loading...',
  deliveryFee: '$0.00',
  minOrder: '$0',
  deliveryTime: '--',
  address: 'Loading...',
  location: 'Loading...',
  hours: '--',
  isOpen: false,
  image: null,
  menu: {
    categories: []
  }
};

const RestaurantMenu = () => {
  const { id } = useParams();
  const _navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(defaultRestaurant);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('');
  const { cart, addToCart: addToCartContext } = useCart();

  useEffect(() => {
    if (!id) {
      setError('No restaurant selected.');
      setLoading(false);
      return;
    }
    const fetchRestaurantAndMenu = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First, try to get the restaurant details
        const restaurantRes = await axios.get(`${API_BASE_URL}/restaurant/${id}`);
        
        if (!restaurantRes.data) {
          throw new Error('Restaurant not found');
        }
        
        // Then get the menu items for this restaurant
        const menuRes = await axios.get(`${API_BASE_URL}/menuItem/restaurant/${id}`);
        
        // Update restaurant state with fetched data
        const restaurantData = restaurantRes.data;
        const updatedRestaurant = {
          ...restaurantData,
          deliveryFee: `$${(restaurantData.deliveryFee ?? 0).toFixed(2)}`,
          minOrder: `$${(restaurantData.minOrder ?? 0).toFixed(2)}`,
          isOpen: restaurantData.isOpen ?? true, // Use the isOpen status from the database
          location: restaurantData.location || 'Location not available', // Ensure location is included
          menu: { categories: [] },
          rating: restaurantData.rating ?? 0,
          reviewCount: restaurantData.reviewCount ?? 0,
          cuisine: restaurantData.cuisine || 'Various',
          address: restaurantData.location || 'Address not available' // For backward compatibility
        };
        
        // Group menu items by category
        const categories = {};
        menuRes.data.forEach(item => {
          if (!categories[item.category]) {
            categories[item.category] = [];
          }
          categories[item.category].push({
            ...item,
            id: item._id,
            isVegetarian: item.tags?.includes('vegetarian') || false,
            isSpicy: item.tags?.includes('spicy') || false,
            customizations: item.options?.map((custGroup, index) => ({
              id: custGroup.name?.toLowerCase().replace(/\s+/g, '-') || `cust-${index}`,
              name: custGroup.name || 'Customization',
              isMultiSelect: custGroup.isMultiSelect || false,
              options: custGroup.options?.map((opt, optIndex) => ({
                id: opt.name?.toLowerCase().replace(/\s+/g, '-') || `opt-${optIndex}`,
                name: opt.name || 'Option',
                price: opt.price || 0,
              })) || []
            })) || []
          });
        });
        
        // Convert to array format expected by the component
        const menuCategories = Object.entries(categories).map(([category, items]) => ({
          id: category.toLowerCase().replace(/\s+/g, '-'),
          name: category,
          items: items
        }));
        
        // Set the first category as active if available
        if (menuCategories.length > 0) {
          setActiveCategory(menuCategories[0].id);
        }
        
        setRestaurant({
          ...updatedRestaurant,
          menu: { categories: menuCategories }
        });
        
      } catch (err) {
        console.error('Error fetching data:', err);
        const errorMessage = err.response?.data?.message || 
                           err.message || 
                           'Failed to load restaurant data. Please try again later.';
        
        setError(errorMessage);
        setRestaurant({
          ...defaultRestaurant,
          name: err.response?.status === 404 ? 'Restaurant Not Found' : 'Error Loading Restaurant',
          description: errorMessage,
          image: 'https://via.placeholder.com/800x400?text=Restaurant+Not+Found'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantAndMenu();
  }, [id]);
  const [quantities, setQuantities] = useState({});
  const [customizations, setCustomizations] = useState({});
  
  // Initialize customizations with empty arrays for each item to prevent uncontrolled to controlled warning
  useEffect(() => {
    if (restaurant.menu?.categories) {
      const initialCustomizations = {};
      restaurant.menu.categories.forEach(category => {
        category.items.forEach(item => {
          if (!initialCustomizations[item.id]) {
            initialCustomizations[item.id] = {};
            if (item.customizations) {
              item.customizations.forEach(cust => {
                initialCustomizations[item.id][cust.id] = [];
              });
            }
          }
        });
      });
      setCustomizations(prev => ({
        ...initialCustomizations,
        ...prev
      }));
    }
  }, [restaurant.menu?.categories]);

  // Initialize quantities from cart when component loads or cart changes
  useEffect(() => {
    if (cart[id]?.items) {
      const cartQuantities = {};
      cart[id].items.forEach(item => {
        cartQuantities[item._id] = item.quantity;
      });
      setQuantities(prev => ({ ...prev, ...cartQuantities }));
    }
  }, [cart, id]);

  const handleQuantityChange = (itemId, change) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + change)
    }));
  };

  const handleCustomizationChange = (itemId, customizationId, optionId, isMultiSelect = false) => {
    setCustomizations(prev => {
      const itemCustomizations = { ...(prev[itemId] || {}) };

      // Ensure the customization array exists and is always an array
      if (!Array.isArray(itemCustomizations[customizationId])) {
        itemCustomizations[customizationId] = [];
      }

      if (isMultiSelect) {
        // Toggle the selected state for multi-select options
        const optionIndex = itemCustomizations[customizationId].indexOf(optionId);
        if (optionIndex === -1) {
          itemCustomizations[customizationId] = [...itemCustomizations[customizationId], optionId];
        } else {
          itemCustomizations[customizationId] = itemCustomizations[customizationId].filter(id => id !== optionId);
        }
      } else {
        // For single select, replace the current selection
        itemCustomizations[customizationId] = [optionId];
      }

      return {
        ...prev,
        [itemId]: itemCustomizations
      };
    });
  };

  const addToCart = (item) => {
    const quantity = quantities[item.id] || 1;
    if (quantity < 1) return;

    const itemCustomizations = customizations[item.id] || {};
    const selectedCustomizations = [];
    
    // Process customizations
    if (item.customizations) {
      item.customizations.forEach(customization => {
        const selectedOptions = itemCustomizations[customization.id] || [];
        
        if (customization.options) {
          // For options with predefined choices
          const options = customization.options.filter(opt => 
            selectedOptions.includes(opt.id)
          );
          
          if (options.length > 0) {
            selectedCustomizations.push({
              id: customization.id,
              name: customization.name,
              isMultiSelect: customization.isMultiSelect,
              options: options.map(opt => ({
                id: opt.id,
                name: opt.name,
                price: opt.price
              }))
            });
          }
        } else {
          // For simple customizations (like checkboxes)
          if (selectedOptions.length > 0) {
            selectedCustomizations.push({
              id: customization.id,
              name: customization.name,
              price: customization.price || 0
            });
          }
        }
      });
    }

    // Calculate the total price including customizations
    const customizationPrice = selectedCustomizations.reduce((total, cust) => {
      if (cust.options) {
        return total + cust.options.reduce((sum, opt) => sum + (opt.price || 0), 0);
      }
      return total + (cust.price || 0);
    }, 0);

    const itemToAdd = {
      ...item,
      quantity,
      customizations: selectedCustomizations,
      price: item.price + customizationPrice,
      restaurantId: id, // Add restaurant ID
      restaurantName: restaurant.name // Add restaurant name
    };

    // Add to cart using the context
    addToCartContext(itemToAdd, {
      _id: id,
      name: restaurant.name,
      address: restaurant.address || '',
      cuisine: restaurant.cuisine || [],
      rating: restaurant.rating || 0,
      deliveryTime: restaurant.deliveryTime || '30-45 min',
      image: restaurant.image || ''
    });

    // Show success message
    toast.success(`${item.name} added to cart!`, {
      position: 'top-right',
      autoClose: 2000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });

    // Reset quantity and customizations for this item
    setQuantities(prev => ({
      ...prev,
      [item.id]: 0
    }));
    
    setCustomizations(prev => ({
      ...prev,
      [item.id]: {}
    }));
  };

  // const removeFromCart = (itemId) => {
  //   removeFromCartContext(itemId);
  // };

  // const updateCartItemQuantity = (itemId, change) => {
  //   updateCartItemQuantityContext(itemId, change);
  // };

  const calculateItemTotal = (item) => {
    let total = item.price * item.quantity;
    
    // Add customization prices
    item.customizations?.forEach(customization => {
      if (customization.options) {
        customization.options.forEach(option => {
          total += option.price * item.quantity;
        });
      } else {
        total += customization.price * item.quantity;
      }
    });
    
    return total.toFixed(2);
  };

  const _calculateCartTotal = () => {
    if (!cart[id]?.items) return '0.00';
    return cart[id].items.reduce((total, item) => {
      return total + parseFloat(calculateItemTotal(item));
    }, 0).toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Loading menu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg max-w-md w-full">
          <h3 className="font-bold">Error Loading Restaurant</h3>
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => window.history.back()} 
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            &larr; Back to Restaurants
          </button>
          <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-600">
            <p>If you're seeing this error, it might be because:</p>
            <ul className="list-disc pl-5 mt-1">
              <li>The restaurant doesn't exist</li>
              <li>The server might be down</li>
              <li>There might be a network issue</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Restaurant Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3 lg:w-1/4">
              <div className="bg-gray-200 rounded-lg overflow-hidden shadow-md">
                <div className="w-full h-48 md:h-56 lg:h-64">
                  <img 
                    src={getImageWithFallback(restaurant.image, 'restaurant')} 
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                    onError={(e) => handleImageError(e, 'restaurant')}
                  />
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
                  <div className="flex items-center mb-2">
                    <div className="flex items-center bg-yellow-50 px-2 py-1 rounded">
                      <FaStar className="text-yellow-400 mr-1" />
                      <span className="font-medium">{restaurant.rating}</span>
                      <span className="text-gray-500 text-sm ml-1">({restaurant.reviewCount})</span>
                    </div>
                    <span className="mx-2 text-gray-400">•</span>
                    <span className="text-gray-600">{restaurant.cuisine}</span>
                  </div>
                  <p className="text-gray-600 mb-4">{restaurant.description}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  <div className="flex items-center">
                    <FaMapMarkerAlt className="text-red-500 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="text-sm font-medium">{restaurant.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FaClock className="text-blue-500 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Hours</p>
                      <p className="text-sm font-medium">{restaurant.hours}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm font-medium text-green-600">
                      {restaurant.isOpen ? 'Open Now' : 'Closed'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Categories Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
              <h2 className="text-lg font-semibold mb-4">Menu Categories</h2>
              <nav className="space-y-2">
                {restaurant.menu.categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => {
                      document.getElementById(category.id)?.scrollIntoView({ behavior: 'smooth' });
                      setActiveCategory(category.id);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      activeCategory === category.id
                        ? 'bg-red-50 text-red-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Menu Items */}
          <div className="lg:w-3/4 space-y-8">
            {restaurant.menu.categories.map(category => (
              <section key={category.id} id={category.id} className="scroll-mt-20">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">{category.name}</h2>
                <div className="space-y-6">
                  {category.items.map(item => (
                    <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
                      <div className="p-4">
                        <div className="flex justify-between">
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                              <span className="ml-4 font-medium text-gray-900">${item.price.toFixed(2)}</span>
                            </div>
                            {item.description && (
                              <p className="mt-1 text-gray-600 text-sm">{item.description}</p>
                            )}
                            
                            {/* Dietary Info */}
                            <div className="flex items-center mt-2 space-x-3">
                              {item.isVegetarian && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  Vegetarian
                                </span>
                              )}
                              {item.isSpicy && (
                                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                  Spicy
                                </span>
                              )}
                            </div>

                            {/* Customizations */}
                            {item.customizations?.map(customization => (
                              <div key={customization.id} className="mt-3">
                                <p className="text-sm font-medium text-gray-700 mb-1">{customization.name}:</p>
                                
                                {customization.options ? (
                                  <div className="space-y-2">
                                    {customization.options.map((option, optionIndex) => {
                                      const isSelected = customizations[item.id]?.[customization.id]?.includes(option.id);
                                      return (
                                        <label 
                                          key={`${item.id}-${customization.id}-${option.id || optionIndex}`}
                                          className={`flex items-center space-x-2 text-sm cursor-pointer ${
                                            isSelected ? 'text-red-600' : 'text-gray-700'
                                          }`}
                                        >
                                          <input
                                            type={customization.isMultiSelect ? 'checkbox' : 'radio'}
                                            name={`${item.id}-${customization.id}`}
                                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                            checked={isSelected || false}
                                            onChange={() =>
                                              handleCustomizationChange(
                                                item.id,
                                                customization.id,
                                                option.id,
                                                customization.isMultiSelect
                                              )
                                            }
                                          />
                                          <span>{option.name}</span>
                                          {option.price > 0 && (
                                            <span className="text-gray-500">+${option.price.toFixed(2)}</span>
                                          )}
                                        </label>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`${item.id}-${customization.id}`}
                                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                      checked={(customizations[item.id]?.[customization.id]?.length > 0) || false}
                                      onChange={() =>
                                        handleCustomizationChange(
                                          item.id,
                                          customization.id,
                                          'selected',
                                          false
                                        )
                                      }
                                    />
                                    <label 
                                      htmlFor={`${item.id}-${customization.id}`}
                                      className="text-sm text-gray-700"
                                    >
                                      {customization.name} 
                                      {customization.price > 0 && (
                                        <span className="text-gray-500"> (+${customization.price.toFixed(2)})</span>
                                      )}
                                    </label>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          <div className="ml-4 w-24 h-24 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                            <img 
                              src={getImageWithFallback(item.image, 'food')} 
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => handleImageError(e, 'food')}
                            />
                          </div>
                        </div>
                        
                        {/* Add to Cart */}
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                            <button 
                              className="px-3 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                              onClick={() => handleQuantityChange(item.id, -1)}
                              type="button"
                            >
                              <FaMinus className="w-3 h-3" />
                            </button>
                            <span className="px-3 py-1 w-10 text-center">
                              {quantities[item.id] || 0}
                            </span>
                            <button 
                              className="px-3 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                              onClick={() => handleQuantityChange(item.id, 1)}
                              type="button"
                            >
                              <FaPlus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => addToCart(item)}
                            disabled={(quantities[item.id] || 0) < 1}
                            className={`px-4 py-2 rounded-lg font-medium flex items-center ${
                              (quantities[item.id] || 0) > 0
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            <FaShoppingCart className="mr-2" />
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default RestaurantMenu;
