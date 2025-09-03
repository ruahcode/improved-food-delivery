import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
// import {
//   useReactTable,
//   getCoreRowModel,
//   getFilteredRowModel,
//   getPaginationRowModel,
//   getSortedRowModel,
//   flexRender,
// } from '@tanstack/react-table';

const ProductManager = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [isRestaurantModal, setIsRestaurantModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    cuisine: '',
    rating: 0,
    deliveryTime: '',
    image: '',
    isOpen: true,
    isPopular: false,
    location: '',
    description: ''
  });

  // Fetch products on component mount
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/restaurants');
      if (response.ok) {
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  // Fetch restaurants on component mount
  const fetchRestaurants = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/restaurants');
      if (response.ok) {
        const data = await response.json();
        setRestaurants(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast.error('Failed to load restaurants');
    }
  };

  // Initial data fetching
  useEffect(() => {
    fetchProducts();
    fetchRestaurants();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = currentProduct ? 'PUT' : 'POST';
      const url = currentProduct 
        ? `http://localhost:5000/api/restaurants/${currentProduct._id}`
        : 'http://localhost:5000/api/restaurants';
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          rating: parseFloat(formData.rating),
          deliveryTime: parseInt(formData.deliveryTime)
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(currentProduct ? 'Restaurant updated successfully' : 'Restaurant added successfully');
        setIsModalOpen(false);
        // Refresh restaurants
        const restaurantsResponse = await fetch('http://localhost:5000/api/restaurants');
        if (restaurantsResponse.ok) {
          const restaurantsData = await restaurantsResponse.json();
          setProducts(Array.isArray(restaurantsData) ? restaurantsData : []);
        }
      } else {
        throw new Error(data.message || 'Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Failed to save product');
    }
  };

  const handleEdit = (restaurant) => {
    setCurrentProduct(restaurant);
    setFormData({
      name: restaurant.name || '',
      cuisine: restaurant.cuisine || '',
      rating: restaurant.rating || 0,
      deliveryTime: restaurant.deliveryTime || '',
      image: restaurant.image || '',
      isOpen: restaurant.isOpen ?? true,
      isPopular: restaurant.isPopular || false,
      location: restaurant.location || '',
      description: restaurant.description || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this restaurant?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/restaurants/${id}`, { 
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          toast.success('Restaurant deleted successfully');
          // Refresh restaurants
          const restaurantsResponse = await fetch('http://localhost:5000/api/restaurants');
          if (restaurantsResponse.ok) {
            const restaurantsData = await restaurantsResponse.json();
            setProducts(Array.isArray(restaurantsData) ? restaurantsData : []);
          }
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete restaurant');
        }
      } catch (error) {
        console.error('Error deleting restaurant:', error);
        toast.error('Failed to delete restaurant');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      cuisine: '',
      rating: 0,
      deliveryTime: '',
      image: '',
      isOpen: true,
      isPopular: false,
      location: '',
      description: ''
    });
    setCurrentProduct(null);
  };

  const handleRestaurantSubmit = async (e) => {
    e.preventDefault();
    try {
      // Add your restaurant submission logic here
      // const response = await fetch('/api/restaurants', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(restaurantFormData)
      // });
      // 
      // const data = await response.json();
      // 
      // if (response.ok) {
      //   toast.success('Restaurant created successfully');
      //   setIsRestaurantModal(false);
      // } else {
      //   throw new Error(data.message || 'Failed to create restaurant');
      // }
    } catch (error) {
      console.error('Error creating restaurant:', error);
      toast.error('Error creating restaurant: ' + (error.message || 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Restaurants</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your restaurants and their details
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto"
          >
            Add Restaurant
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gradient-to-r from-red-600 to-red-800">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Restaurant
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Cuisine
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Rating
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="relative px-6 py-4">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {!products || !Array.isArray(products) || products.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No restaurants found</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Get started by adding a new restaurant.
                          </p>
                          <div className="mt-6">
                            <button
                              type="button"
                              onClick={() => {
                                resetForm();
                                setIsModalOpen(true);
                              }}
                              className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                              <svg
                                className="-ml-1 mr-2 h-5 w-5"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              New Restaurant
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    products.map((restaurant) => (
                      <tr key={restaurant._id}>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <img className="h-10 w-10 rounded-full object-cover" src={restaurant.image} alt={restaurant.name} />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{restaurant.name}</div>
                              <div className="text-sm text-gray-500">{restaurant.location}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm text-gray-900">{restaurant.cuisine}</div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`h-4 w-4 ${i < Math.floor(restaurant.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            <span className="ml-1 text-sm text-gray-500">
                              {restaurant.rating ? restaurant.rating.toFixed(1) : 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            restaurant.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {restaurant.isOpen ? 'Open Now' : 'Closed'}
                            {restaurant.isPopular && (
                              <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                Popular
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(restaurant)}
                            className="text-red-600 hover:text-red-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(restaurant._id)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Restaurant Modal */}
      {isModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {currentProduct ? 'Edit Restaurant' : 'Add New Restaurant'}
                </h3>
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-6">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Restaurant Name
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          required
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="cuisine" className="block text-sm font-medium text-gray-700">
                        Cuisine Type
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="cuisine"
                          id="cuisine"
                          value={formData.cuisine}
                          onChange={handleInputChange}
                          className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          required
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="rating" className="block text-sm font-medium text-gray-700">
                        Rating (0-5)
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          name="rating"
                          id="rating"
                          min="0"
                          max="5"
                          step="0.1"
                          value={formData.rating}
                          onChange={handleInputChange}
                          className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          required
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="deliveryTime" className="block text-sm font-medium text-gray-700">
                        Delivery Time (minutes)
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          name="deliveryTime"
                          id="deliveryTime"
                          min="1"
                          value={formData.deliveryTime}
                          onChange={handleInputChange}
                          className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          required
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                        Location
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="location"
                          id="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          required
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="description"
                          name="description"
                          rows={3}
                          value={formData.description}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                        Image URL
                      </label>
                      <div className="mt-1">
                        <input
                          type="url"
                          name="image"
                          id="image"
                          value={formData.image}
                          onChange={handleInputChange}
                          className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          required
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <div className="mt-2">
                        <div className="flex items-center">
                          <input
                            id="isOpen"
                            name="isOpen"
                            type="checkbox"
                            checked={formData.isOpen}
                            onChange={handleInputChange}
                            className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300 rounded"
                          />
                          <label htmlFor="isOpen" className="ml-2 block text-sm text-gray-700">
                            Currently Open
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Popular
                      </label>
                      <div className="mt-2">
                        <div className="flex items-center">
                          <input
                            id="isPopular"
                            name="isPopular"
                            type="checkbox"
                            checked={formData.isPopular}
                            onChange={handleInputChange}
                            className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300 rounded"
                          />
                          <label htmlFor="isPopular" className="ml-2 block text-sm text-gray-700">
                            Mark as Popular
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                    >
                      {currentProduct ? 'Update' : 'Add'} Restaurant
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        resetForm();
                      }}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Restaurant Modal - You can implement this similar to the product modal */}
      {isRestaurantModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Restaurant</h3>
                <div className="mt-6">
                  <form onSubmit={handleRestaurantSubmit}>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-700">
                          Restaurant Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="restaurantName"
                          required
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                        />
                      </div>
                      {/* Add more restaurant fields as needed */}
                    </div>

                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                      <button
                        type="submit"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                      >
                        Add Restaurant
                      </button>
                      <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                        onClick={() => setIsRestaurantModal(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;
