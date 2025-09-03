import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCheckCircle, FaClock, FaTimesCircle, FaBoxOpen, FaTrash, FaTrashAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';

const statusStyles = {
  new: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  confirmed: 'bg-green-100 text-green-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusLabels = {
  new: 'New',
  in_progress: 'In Progress',
  completed: 'Completed',
  confirmed: 'Confirmed',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

const statusIcons = {
  new: <FaBoxOpen className="text-blue-400 text-xl mr-2" />,
  in_progress: <FaClock className="text-yellow-400 text-xl mr-2" />,
  completed: <FaCheckCircle className="text-green-500 text-xl mr-2" />,
  confirmed: <FaCheckCircle className="text-green-500 text-xl mr-2" />,
  paid: <FaCheckCircle className="text-green-500 text-xl mr-2" />,
  cancelled: <FaTimesCircle className="text-red-400 text-xl mr-2" />,
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No authentication token found');
          setError('Please log in to view your orders');
          setLoading(false);
          return;
        }
        
        console.log('Fetching orders with token:', token.substring(0, 10) + '...');
        
        const response = await axios.get('http://localhost:5000/api/order', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          withCredentials: true
        });
        
        console.log('Orders API response:', response.data);
        
        if (!Array.isArray(response.data)) {
          throw new Error('Invalid response format from server');
        }
        
        const ordersData = response.data;
        console.log(`Received ${ordersData.length} orders`);
        console.log('Order statuses:', ordersData.map(o => ({
          id: o._id,
          status: o.status,
          paymentStatus: o.paymentStatus
        })));
        
        setOrders(ordersData);
      } catch (error) {
        console.error('Error fetching orders:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        if (error.response?.status === 401) {
          setError('Please log in to view your orders');
        } else if (error.response?.status === 404) {
          setError('No orders found');
        } else {
          setError('Failed to load orders. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <FaClock className="animate-spin text-3xl text-red-500 mr-2" />
      <span className="text-lg text-gray-600">Loading your orders...</span>
    </div>
  );
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh]">
      <FaTimesCircle className="text-4xl text-red-500 mb-2" />
      <span className="text-lg text-gray-600">{error}</span>
    </div>
  );

  // Show orders with various statuses that indicate they're valid orders
  const validOrderStatuses = ['paid', 'completed', 'confirmed', 'pending_payment', 'processing'];
  
  const paidOrders = orders
    .filter(order => {
      const status = order.status?.toLowerCase();
      const paymentStatus = order.paymentStatus?.toLowerCase();
      
      const isIncluded = validOrderStatuses.includes(status) || 
                        validOrderStatuses.includes(paymentStatus) ||
                        status === 'pending' && paymentStatus === 'paid';
      
      console.log(`Order ${order._id} - Status: ${status}, Payment: ${paymentStatus}, Included: ${isIncluded}`);
      return isIncluded;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleDeleteOrder = async (orderId) => {
    const orderToDelete = orders.find(order => order._id === orderId);
    const orderNumber = orderToDelete?._id.slice(-5) || '';
    
    const result = await new Promise((resolve) => {
      const toastId = toast.info(
        <div className="text-center">
          <p className="font-medium mb-2">Delete Order #{orderNumber}?</p>
          <div className="flex justify-center gap-3 mt-3">
            <button 
              onClick={() => {
                toast.dismiss(toastId);
                resolve(false);
              }}
              className="px-4 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                toast.dismiss(toastId);
                resolve(true);
              }}
              className="px-4 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
            >
              Delete
            </button>
          </div>
        </div>,
        {
          autoClose: false,
          closeButton: false,
          closeOnClick: false,
          draggable: false,
          position: 'top-center',
          className: 'w-full max-w-md',
        }
      );
    });
    
    if (!result) return;
    
    try {
      setIsDeleting(true);
      setOrderToDelete(orderId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await axios.delete(`http://localhost:5000/api/order/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        withCredentials: true
      });
      
      if (response.data?.success) {
        setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
        toast.success(response.data.message || 'Order deleted successfully');
      } else {
        throw new Error(response.data?.message || 'Failed to delete order');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    } finally {
      setIsDeleting(false);
      setOrderToDelete(null);
    }
  };

  const handleClearAllOrders = async () => {
    const result = await new Promise((resolve) => {
      toast.info(
        <div className="text-center">
          <p className="font-medium mb-2">Delete all {paidOrders.length} orders?</p>
          <p className="text-sm text-gray-600 mb-3">This action cannot be undone.</p>
          <div className="flex justify-center gap-3 mt-3">
            <button 
              onClick={() => resolve(false)}
              className="px-4 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
            >
              Cancel
            </button>
            <button 
              onClick={() => resolve(true)}
              className="px-4 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
            >
              Delete All
            </button>
          </div>
        </div>,
        {
          autoClose: false,
          closeButton: false,
          closeOnClick: false,
          draggable: false,
          position: 'top-center',
          className: 'w-full max-w-md',
        }
      );
    });
    
    if (!result) return;
    
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('token');
      
      // Get all order IDs to delete
      const orderIds = paidOrders.map(order => order._id);
      
      // Delete all orders in parallel
      await Promise.all(
        orderIds.map(orderId => 
          axios.delete(`http://localhost:5000/api/order/${orderId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        )
      );
      
      // Clear all orders from state
      setOrders(orders.filter(order => !orderIds.includes(order._id)));
      toast.success('All orders have been deleted');
    } catch (error) {
      console.error('Error clearing orders:', error);
      toast.error('Failed to clear orders');
    } finally {
      setIsDeleting(false);
    }
  };
  
  console.log('Filtered orders:', paidOrders.map(o => ({
    id: o._id,
    status: o.status,
    paymentStatus: o.paymentStatus,
    createdAt: o.createdAt
  })));

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-red-700">My Orders</h2>
          {paidOrders.length > 0 && (
            <button
              onClick={handleClearAllOrders}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaTrashAlt />
              {isDeleting ? 'Deleting...' : 'Clear All'}
            </button>
          )}
        </div>
        {paidOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-md">
            <FaBoxOpen className="text-5xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-4">You haven't placed any orders yet. Start exploring delicious food now!</p>
            <a href="/restaurants" className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition">Order Now</a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paidOrders.map(order => (
              <div key={order._id} className="bg-white rounded-xl shadow-md p-6 flex flex-col gap-2 border border-gray-100 hover:shadow-lg transition relative group">
                <button
                  onClick={() => handleDeleteOrder(order._id)}
                  disabled={isDeleting && orderToDelete === order._id}
                  className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete order"
                >
                  {isDeleting && orderToDelete === order._id ? (
                    <FaClock className="animate-spin" />
                  ) : (
                    <FaTrash className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
                <div className="flex items-center mb-2">
                  {statusIcons[order.status] || <FaBoxOpen className="text-gray-400 text-xl mr-2" />}
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ml-2 ${statusStyles[order.status] || 'bg-gray-100 text-gray-700'}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                  <span className="ml-auto text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm text-gray-500">Order #{order._id.slice(-5)}</span>
                </div>
                <div className="mb-2">
                  <span className="block text-gray-700 font-semibold mb-1">Items:</span>
                  <ul className="list-disc list-inside text-gray-600 text-sm">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <li key={idx}>{item.name} <span className="text-gray-400">x{item.quantity}</span></li>
                      ))
                    ) : (
                      <li className="italic text-gray-400">No items</li>
                    )}
                  </ul>
                </div>
                {order.deliveryAddress && (
                  <div className="mb-1">
                    <span className="block text-gray-700 font-semibold">Delivery Address:</span>
                    <span className="text-gray-600 text-sm">{order.deliveryAddress}</span>
                  </div>
                )}
                {order.specialInstructions && (
                  <div className="mb-1">
                    <span className="block text-gray-700 font-semibold">Instructions:</span>
                    <span className="text-gray-600 text-sm">{order.specialInstructions}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
