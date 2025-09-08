import React, { useState, useEffect, createContext } from 'react';

const CartContext = createContext();

// Provider component
const CartProvider = ({ children }) => {
  // Cart structure: { [restaurantId]: { items: [...], restaurant: {...} } }
  const [cart, setCart] = useState({});
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const { cart: savedCartData } = JSON.parse(savedCart);
        setCart(savedCartData || {});
      } catch (error) {
        console.error('Failed to parse cart from localStorage', error);
        setCart({});
      }
    }
    setIsLoading(false);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify({ cart }));
  }, [cart]);

  // Add item to cart
  const addToCart = (item, restaurantData) => {
    if (!item || !restaurantData || !restaurantData._id) {
      console.error('Invalid item or restaurant data');
      return;
    }

    const restaurantId = restaurantData._id;
    
    setCart(prevCart => {
      // Create a deep copy of the cart
      const newCart = { ...prevCart };
      
      // Initialize restaurant cart if it doesn't exist
      if (!newCart[restaurantId]) {
        newCart[restaurantId] = {
          items: [],
          restaurant: restaurantData,
          updatedAt: new Date().toISOString()
        };
      }

      // Check if item already exists in cart with same options
      const existingItemIndex = newCart[restaurantId].items.findIndex(cartItem => 
        cartItem._id === item._id && 
        JSON.stringify(cartItem.selectedOptions || {}) === JSON.stringify(item.selectedOptions || {})
      );

      if (existingItemIndex >= 0) {
        // Item exists, update quantity
        newCart[restaurantId].items[existingItemIndex].quantity += 1;
      } else {
        // Item doesn't exist, add new item
        newCart[restaurantId].items.push({ ...item, quantity: 1 });
      }

      return newCart;
    });
    
    setIsCartOpen(true);
  };

  // Update item quantity for a specific restaurant
  const updateQuantity = (restaurantId, itemId, newQuantity, selectedOptions) => {
    if (newQuantity < 1) return;
    
    setCart(prevCart => {
      const newCart = { ...prevCart };
      if (!newCart[restaurantId]) return prevCart;
      
      newCart[restaurantId] = {
        ...newCart[restaurantId],
        items: newCart[restaurantId].items.map(item => 
          item._id === itemId && 
          JSON.stringify(item.selectedOptions) === JSON.stringify(selectedOptions)
            ? { ...item, quantity: newQuantity }
            : item
        ),
        updatedAt: new Date().toISOString()
      };
      
      return newCart;
    });
  };

  // Remove item from a specific restaurant's cart
  const removeFromCart = (restaurantId, itemId, selectedOptions) => {
    setCart(prevCart => {
      const newCart = { ...prevCart };
      if (!newCart[restaurantId]) return prevCart;
      
      newCart[restaurantId] = {
        ...newCart[restaurantId],
        items: newCart[restaurantId].items.filter(item => 
          !(item._id === itemId && 
          JSON.stringify(item.selectedOptions) === JSON.stringify(selectedOptions))
        ),
        updatedAt: new Date().toISOString()
      };
      
      // If no more items for this restaurant, remove the restaurant entry
      if (newCart[restaurantId].items.length === 0) {
        delete newCart[restaurantId];
      }
      
      return newCart;
    });
  };

  // Remove an entire restaurant's cart
  const removeRestaurantFromCart = (restaurantId) => {
    setCart(prevCart => {
      const newCart = { ...prevCart };
      delete newCart[restaurantId];
      return newCart;
    });
  };

  // Clear the entire cart
  const clearCart = () => {
    setCart({});
  };

  // Get all restaurants in cart
  const getRestaurantsInCart = () => {
    return Object.values(cart).map(restaurantCart => restaurantCart.restaurant);
  };

  // Get cart items for a specific restaurant
  const getItemsForRestaurant = (restaurantId) => {
    return cart[restaurantId]?.items || [];
  };

  // Calculate total items in cart across all restaurants
  const totalItems = Object.values(cart).reduce(
    (total, restaurantCart) => 
      total + (restaurantCart.items?.reduce(
        (sum, item) => sum + (item.quantity || 0), 0
      ) || 0),
    0
  );

  // Calculate total price for the entire cart
  const totalPrice = Object.values(cart).reduce(
    (total, restaurantCart) => 
      total + (restaurantCart.items?.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0
      ) || 0),
    0
  );

  // Calculate total for a specific restaurant
  const getRestaurantTotal = (restaurantId) => {
    if (!cart[restaurantId]) return 0;
    return cart[restaurantId].items.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0
    );
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        removeRestaurantFromCart,
        clearCart,
        getRestaurantsInCart,
        getItemsForRestaurant,
        getRestaurantTotal,
        totalItems,
        totalPrice,
        deliveryAddress,
        setDeliveryAddress,
        deliveryInstructions,
        setDeliveryInstructions,
        isCartOpen,
        setIsCartOpen,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use the cart
const useCart = () => {
  const context = React.useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export { CartProvider, useCart };
export default CartContext;
