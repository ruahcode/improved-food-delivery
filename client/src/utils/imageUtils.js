// Image utility functions for consistent placeholder handling

export const PLACEHOLDER_IMAGES = {
  restaurant: '/placeholder-restaurant.svg',
  food: '/placeholder-food.svg',
  // Fallback external URLs if local files fail
  restaurantFallback: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  foodFallback: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
};

export const handleImageError = (e, type = 'restaurant') => {
  const img = e.target;
  
  // If already showing placeholder, don't retry
  if (img.src.includes('placeholder-') || img.dataset.fallbackAttempted) {
    return;
  }
  
  // Mark as fallback attempted
  img.dataset.fallbackAttempted = 'true';
  
  // Set appropriate placeholder
  img.src = PLACEHOLDER_IMAGES[type] || PLACEHOLDER_IMAGES.restaurant;
};

export const getImageWithFallback = (imageUrl, type = 'restaurant') => {
  return imageUrl || PLACEHOLDER_IMAGES[type];
};