import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaStar, FaPlus } from 'react-icons/fa';
import useCart from '../hooks/useCart';
import { getApiUrl } from '../utils/api';

const CategoryResults = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchCategoryItems = async () => {
      try {
        const [menuResponse, restaurantResponse] = await Promise.all([
          axios.get(getApiUrl('menuitem')),
          axios.get(getApiUrl('restaurant/all'))
        ]);
        
        const restaurants = restaurantResponse.data;
        const filteredItems = menuResponse.data.filter(item => 
          (item.category && item.category.toLowerCase().includes(category.toLowerCase())) ||
          (item.name && item.name.toLowerCase().includes(category.toLowerCase()))
        );
        
        const itemsWithRestaurant = filteredItems.map(item => {
          const restaurant = restaurants.find(r => r._id === item.restaurant);
          return {
            ...item,
            restaurant: restaurant ? {
              _id: restaurant._id,
              name: restaurant.name,
              address: restaurant.address || '',
              cuisine: restaurant.cuisine || [],
              rating: restaurant.rating || 0,
              deliveryTime: restaurant.deliveryTime || '30-45 min',
              image: restaurant.image || ''
            } : {
              _id: item.restaurant,
              name: 'Unknown Restaurant',
              address: '',
              cuisine: [],
              rating: 0,
              deliveryTime: '30-45 min',
              image: ''
            }
          };
        });
        
        // Remove duplicates based on item name and price
        const uniqueItems = itemsWithRestaurant.filter((item, index, self) => 
          index === self.findIndex(i => i.name === item.name && i.price === item.price)
        );
        
        setMenuItems(uniqueItems);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching menu items:', err);
        console.log('Category being searched:', category);
        setError('Failed to load menu items. Please try again later.');
        setLoading(false);
      }
    };

    if (category) {
      fetchCategoryItems();
    }
  }, [category]);

  const handleAddToCart = (item) => {
    addToCart(
      {
        _id: item._id,
        name: item.name,
        price: item.price,
        quantity: 1,
      },
      item.restaurant
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading {category} items...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back to Home
            </button>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-orange-600 font-bold">{category.charAt(0)}</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{category} Items</h1>
                <p className="text-gray-600 text-sm">{menuItems.length} items found</p>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {menuItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {menuItems.map((item) => (
              <div
                key={`${item.restaurant._id}-${item._id}`}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="w-full h-48 bg-gray-100 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://source.unsplash.com/400x300/?${encodeURIComponent(item.name)},food`;
                    }}
                  />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{item.name}</h3>
                    <span className="text-lg font-bold text-green-600">${item.price}</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    From: {item.restaurant.name}
                  </p>
                  <p className="text-gray-500 text-xs mb-3">
                    {item.description || 'Delicious food item'}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-sm text-gray-500">
                      <FaStar className="mr-1 text-yellow-400" />
                      {typeof item.restaurant.rating === 'number' && !isNaN(item.restaurant.rating)
                        ? item.restaurant.rating.toFixed(1)
                        : 'N/A'}
                    </div>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                    >
                      <FaPlus className="mr-1" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {category} items found
              </h3>
              <p className="text-gray-500 mb-4">
                We couldn't find any {category} items available right now.
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Browse All Categories
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryResults;