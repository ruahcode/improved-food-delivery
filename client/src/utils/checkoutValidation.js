export const validateCheckoutData = (data) => {
  const errors = [];
  
  if (!data.user || !data.user._id) {
    errors.push('User authentication required');
  }
  
  if (!data.cart || !Array.isArray(data.cart) || data.cart.length === 0) {
    errors.push('Cart is empty');
  }
  
  if (!data.restaurant || !data.restaurant._id) {
    errors.push('Restaurant information missing');
  }
  
  if (!data.deliveryAddress || data.deliveryAddress.trim().length < 1) {
    errors.push('Valid delivery address required');
  }
  
  if (!data.paymentMethod) {
    errors.push('Payment method required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateCartItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return { isValid: false, error: 'No items in cart' };
  }
  
  for (const item of items) {
    if (!item.menuItemId && !item._id) {
      return { isValid: false, error: 'Invalid item: missing ID' };
    }
    if (!item.name) {
      return { isValid: false, error: 'Invalid item: missing name' };
    }
    if (!item.quantity || item.quantity < 1) {
      return { isValid: false, error: `Invalid quantity for ${item.name}` };
    }
    if (item.price === undefined || item.price < 0) {
      return { isValid: false, error: `Invalid price for ${item.name}` };
    }
  }
  
  return { isValid: true };
};