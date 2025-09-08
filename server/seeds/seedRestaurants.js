//name
//cuisine
//rating
//deliveryTime
//menuItems
//image
//isOpen
//location

const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const { connectDB } = require('../utils/db');

const restaurants = [
  // USA Restaurants (4)
  {
      name: 'Burger King',
      cuisine: 'Fast Food',
      rating: 4.2,
      deliveryTime: 25,
      menuItems: [],
      image: 'https://images.unsplash.com/photo-1716825340559-0242482f7dd1?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8YnVyZ2VyJTIwa2luZ3xlbnwwfHwwfHx8MA%3D%3D',
      isOpen: true,
      isPopular: true,
      location: '123 Main St, New York, USA',
      country: 'USA',
      promo: '20% off on Whoppers this weekend',
      minOrder: 10,
      deliveryFee: 50,
      tags: ['burgers', 'fast food', 'american']
  },
  {
      name: 'Smokehouse BBQ',
      cuisine: 'American',
      rating: 4.9,
      deliveryTime: 60,
      menuItems: [],
      image: 'https://www.shutterstock.com/shutterstock/photos/2344596997/display_1500/stock-vector-barbeque-smokehouse-bbq-barbecue-bar-and-grill-logo-design-with-fork-and-fire-2344596997.jpg',
      isOpen: true,
      isPopular: true,
      location: '987 Grill Road, Austin, USA',
      country: 'USA',
      promo: 'Free coleslaw with rib orders',
      minOrder: 30,
      deliveryFee: 50,
      tags: ['barbecue', 'smoked meats', 'southern']
  },
  {
      name: 'Ocean Grill',
      cuisine: 'Seafood',
      rating: 4.7,
      deliveryTime: 45,
      menuItems: [],
      image: 'https://plus.unsplash.com/premium_photo-1675344317761-3ace7cf2362a?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8b2NlYW4lMjBncmlsbCUyMHJlc3RhdXJhbnR8ZW58MHx8MHx8fDA%3D',
      isOpen: true,
      isPopular: false,
      location: '357 Harbor View, Seattle, USA',
      country: 'USA',
      promo: 'Lobster special - 2 for $50',
      minOrder: 25,
      deliveryFee: 50,
      tags: ['fresh seafood', 'grilled fish', 'oysters']
  },
  {
      name: 'Taco Fiesta',
      cuisine: 'Mexican',
      rating: 4.4,
      deliveryTime: 30,
      menuItems: [],
      image: 'https://images.unsplash.com/photo-1645083031812-d4a06a48b4d4?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8VGFjbyUyMEZpZXN0YSUyMHJlc3RhdXJhbnR8ZW58MHx8MHx8fDA%3D',
      isOpen: true,
      isPopular: true,
      location: '159 South St, Los Angeles, USA',
      country: 'USA',
      promo: 'Taco Tuesday - $1 tacos',
      minOrder: 12,
      deliveryFee: 20,
      tags: ['tacos', 'mexican', 'street food']
  },

  // Ethiopia Restaurants (4)
  {
      name: 'Habesha Restaurant',
      cuisine: 'Ethiopian',
      rating: 4.8,
      deliveryTime: 40,
      menuItems: [],
      image: 'https://media-cdn.tripadvisor.com/media/photo-m/1280/19/d3/10/a9/habesha-restaurant.jpg',
      isOpen: true,
      isPopular: true,
      location: 'Bole Road, Addis Ababa, Ethiopia',
      country: 'Ethiopia',
      promo: 'Free traditional coffee with orders over 200 birr',
      minOrder: 150,
      deliveryFee: 25,
      tags: ['injera', 'traditional', 'coffee ceremony']
  },
  {
      name: 'Yod Abyssinia',
      cuisine: 'Ethiopian',
      rating: 4.7,
      deliveryTime: 45,
      menuItems: [],
      image:'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/13/47/19/9a/interior-decor.jpg?w=900&h=500&s=1',
      isOpen: true,
      isPopular: false,
      location: 'Kazanchis, Addis Ababa, Ethiopia',
      country: 'Ethiopia',
      promo: 'Cultural dinner show on weekends',
      minOrder: 180,
      deliveryFee: 30,
      tags: ['cultural', 'live music', 'traditional']
  },
  {
      name: 'Kategna Restaurant',
      cuisine: 'Ethiopian',
      rating: 4.5,
      deliveryTime: 35,
      menuItems: [],
      image:'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/15/de/30/d7/kategna-branch-laphto.jpg?w=900&h=500&s=1',
      isOpen: true,
      isPopular: true,
      location: 'Sarbet, Addis Ababa, Ethiopia',
      country: 'Ethiopia',
      promo: '10% off on fasting days',
      minOrder: 120,
      deliveryFee: 20,
      tags: ['fasting food', 'vegetarian', 'traditional']
  },
  {
      name: 'Lucy Lounge',
      cuisine: 'International',
      rating: 4.6,
      deliveryTime: 50,
      menuItems: [],
      image: 'https://media-cdn.tripadvisor.com/media/photo-s/0c/5b/7e/a3/restaurant.jpg',
      isOpen: true,
      isPopular: false,
      location: 'Old Airport, Addis Ababa, Ethiopia',
      country: 'Ethiopia',
      promo: 'Happy hour 5-7PM daily',
      minOrder: 200,
      deliveryFee: 35,
      tags: ['bar', 'international', 'fusion']
  },

  // Italy Restaurants (4)
  {
      name: 'Trattoria Romana',
      cuisine: 'Italian',
      rating: 4.9,
      deliveryTime: 40,
      menuItems: [],
      image: 'https://images.unsplash.com/photo-1592861956120-e524fc739696?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aXRhbGlhbiUyMHJlc3RhdXJhbnR8ZW58MHx8MHx8fDA%3D',
      isOpen: true,
      isPopular: true,
      location: 'Via del Corso, Rome, Italy',
      country: 'Italy',
      promo: 'Authentic Roman pasta dishes',
      minOrder: 25,
      deliveryFee: 30,
      tags: ['pasta', 'roman', 'authentic']
  },
  {
      name: 'Pizza Napoletana',
      cuisine: 'Italian',
      rating: 4.8,
      deliveryTime: 35,
      menuItems: [],
      image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8bmFwbGVzJTIwcGl6emF8ZW58MHx8MHx8fDA%3D',
      isOpen: true,
      isPopular: true,
      location: 'Via Toledo, Naples, Italy',
      country: 'Italy',
      promo: 'Wood-fired oven pizza',
      minOrder: 20,
      deliveryFee: 20,
      tags: ['pizza', 'neapolitan', 'traditional']
  },
  {
      name: 'Gelateria Fiorentina',
      cuisine: 'Dessert',
      rating: 4.7,
      deliveryTime: 25,
      menuItems: [],
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Z2VsYXRvfGVufDB8fDB8fHww',
      isOpen: true,
      isPopular: false,
      location: 'Piazza del Duomo, Florence, Italy',
      country: 'Italy',
      promo: '2 scoops for the price of 1',
      minOrder: 10,
      deliveryFee: 15,
      tags: ['gelato', 'dessert', 'ice cream']
  },
  {
      name: 'Ristorante Venezia',
      cuisine: 'Italian',
      rating: 4.6,
      deliveryTime: 45,
      menuItems: [],
      image: 'https://images.unsplash.com/photo-1600348328773-643277fc1d0d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8UmlzdG9yYW50ZSUyMFZlbmV6aWElMjByZXN0YXVyYW50fGVufDB8fDB8fHww',
      isOpen: true,
      isPopular: false,
      location: 'Canal Grande, Venice, Italy',
      country: 'Italy',
      promo: 'Seafood specials daily',
      minOrder: 30,
      deliveryFee: 40,
      tags: ['seafood', 'venetian', 'canal view']
  },

  // India Restaurants (4)
  {
      name: 'Spice Route',
      cuisine: 'Indian',
      rating: 4.6,
      deliveryTime: 50,
      menuItems: [],
      image: 'https://images.unsplash.com/photo-1733622352160-8074a570af6c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fHNwaWNlJTIwcm91dGUlMjByZXN0YXVyYW50fGVufDB8fDB8fHww',
      isOpen: true,
      isPopular: false,
      location: 'Connaught Place, New Delhi, India',
      country: 'India',
      promo: '10% off on first order',
      minOrder: 500,
      deliveryFee: 40,
      tags: ['curry', 'tandoori', 'spicy']
  },
  {
      name: 'Bombay Brasserie',
      cuisine: 'Indian',
      rating: 4.8,
      deliveryTime: 45,
      menuItems: [],
      image: 'https://images.unsplash.com/photo-1738045226713-a78c11c4fe57?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Qm9tYmF5JTIwQnJhc3NlcmllJTIwcmVzdGF1cmFudHxlbnwwfHwwfHx8MA%3D%3D',
      isOpen: true,
      isPopular: true,
      location: 'Colaba, Mumbai, India',
      country: 'India',
      promo: 'Street food platter special',
      minOrder: 600,
      deliveryFee: 50,
      tags: ['street food', 'mumbai', 'chaat']
  },
  {
      name: 'Dum Pukht',
      cuisine: 'Indian',
      rating: 4.9,
      deliveryTime: 60,
      menuItems: [],
      image: 'https://images.unsplash.com/photo-1695576634252-584e5988976d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8RHVtJTIwUHVraHQlMjByZXN0YXVyYW50fGVufDB8fDB8fHww',
      isOpen: true,
      isPopular: true,
      location: 'ITC Maurya, New Delhi, India',
      country: 'India',
      promo: 'Royal dining experience',
      minOrder: 800,
      deliveryFee: 60,
      tags: ['royal', 'biryani', 'awadhi']
  },
  {
      name: 'Paradise Biryani',
      cuisine: 'Indian',
      rating: 4.5,
      deliveryTime: 40,
      menuItems: [],
      image: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aHlkZXJhYmFkJTIwZm9vZHxlbnwwfHwwfHx8MA%3D%3Dhttps://images.unsplash.com/photo-1651126179043-f94b62006243?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8UGFyYWRpc2UlMjBCaXJ5YW5pJTIwcmVzdGF1cmFudHxlbnwwfHwwfHx8MA%3D%3D',
      isPopular: false,
      location: 'Secunderabad, Hyderabad, India',
      country: 'India',
      promo: 'Famous Hyderabadi biryani',
      minOrder: 400,
      deliveryFee: 30,
      tags: ['biryani', 'hyderabadi', 'spicy']
  },

  // Japan Restaurants (4)
  {
      name: 'Sushi Zen',
      cuisine: 'Japanese',
      rating: 4.8,
      deliveryTime: 45,
      menuItems: [],
      image: 'https://images.unsplash.com/photo-1620505251384-af3c31f90ef9?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fHN1c2hpJTIwemVufGVufDB8fDB8fHww',
      isOpen: true,
      isPopular: false,
      location: 'Ginza, Tokyo, Japan',
      country: 'Japan',
      promo: 'Free miso soup with every order',
      minOrder: 3000,
      deliveryFee: 50,
      tags: ['sushi', 'fresh fish', 'japanese']
  },
  {
      name: 'Ramen Street',
      cuisine: 'Japanese',
      rating: 4.7,
      deliveryTime: 30,
      menuItems: [],
      image: 'https://images.unsplash.com/photo-1617093727343-374698b1b188?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cmFtZW58ZW58MHx8MHx8fDA%3Dhttps://images.unsplash.com/photo-1683431686868-bdb1c683cc6d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8UmFtZW4lMjBTdHJlZXQlMjByZXN0YXVyYW50fGVufDB8fDB8fHww',
      isPopular: true,
      location: 'Shinjuku, Tokyo, Japan',
      country: 'Japan',
      promo: 'Late night ramen special',
      minOrder: 2000,
      deliveryFee: 30,
      tags: ['ramen', 'noodles', 'comfort food']
  },
  {
      name: 'Izakaya Torii',
      cuisine: 'Japanese',
      rating: 4.6,
      deliveryTime: 40,
      menuItems: [],
      image: 'https://images.unsplash.com/photo-1729699081925-eb8057c17da8?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8SXpha2F5YSUyMFRvcmlpJTIwcmVzdGF1cmFudHxlbnwwfHwwfHx8MA%3D%3D',
      isOpen: true,
      isPopular: false,
      location: 'Shibuya, Tokyo, Japan',
      country: 'Japan',
      promo: 'Happy hour 5-7PM',
      minOrder: 2500,
      deliveryFee: 40,
      tags: ['izakaya', 'small plates', 'sake']
  },
  {
      name: 'Okonomiyaki House',
      cuisine: 'Japanese',
      rating: 4.5,
      deliveryTime: 35,
      menuItems: [],
      image: 'https://images.unsplash.com/photo-1593676867590-59e0a8b37b54?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8T2tvbm9taXlha2klMjBIb3VzZXxlbnwwfHwwfHx8MA%3D%3D',
      isOpen: true,
      isPopular: true,
      location: 'Osaka, Japan',
      country: 'Japan',
      promo: 'Osaka-style savory pancakes',
      minOrder: 1800,
      deliveryFee: 35,
      tags: ['okonomiyaki', 'osaka', 'savory']
  },

  // Mexico Restaurants (4)
  {
      name: 'Taqueria El Pastor',
      cuisine: 'Mexican',
      rating: 4.7,
      deliveryTime: 25,
      menuItems: [],
      image: 'https://images.unsplash.com/photo-1756272985663-a19ccd31f2c9?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8VGFxdWVyaWElMjBFbCUyMFBhc3RvciUyMHJlc3RhdXJhbnR8ZW58MHx8MHx8fDA%3D',
      isOpen: true,
      isPopular: true,
      location: 'Condesa, Mexico City, Mexico',
      country: 'Mexico',
      promo: 'Al pastor tacos special',
      minOrder: 150,
      deliveryFee: 30,
      tags: ['tacos', 'street food', 'authentic']
  },
  {
      name: 'La Casa de las Enchiladas',
      cuisine: 'Mexican',
      rating: 4.6,
      deliveryTime: 30,
      menuItems: [],
      image: 'https://images.unsplash.com/photo-1642409523356-ff231c1783ce?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8TGElMjBDYXNhJTIwZGUlMjBsYXMlMjBFbmNoaWxhZGFzJTIwcmVzdGF1cmFudHxlbnwwfHwwfHx8MA%3D%3D',
      isOpen: true,
      isPopular: false,
      location: 'Roma Norte, Mexico City, Mexico',
      country: 'Mexico',
      promo: 'Mole enchiladas special',
      minOrder: 200,
      deliveryFee: 35,
      tags: ['enchiladas', 'mole', 'traditional']
  },
  {
      name: 'Mariscos Jalisco',
      cuisine: 'Mexican',
      rating: 4.8,
      deliveryTime: 40,
      menuItems: [],
      image: 'https://images.unsplash.com/photo-1642409523356-ff231c1783ce?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8TWFyaXNjb3MlMjBKYWxpc2NvJTIwcmVzdGF1cmFudHxlbnwwfHwwfHx8MA%3D%3D',
      isOpen: true,
      isPopular: true,
      location: 'Guadalajara, Jalisco, Mexico',
      country: 'Mexico',
      promo: 'Shrimp tacos special',
      minOrder: 250,
      deliveryFee: 40,
      tags: ['seafood', 'shrimp', 'coastal']
  },
  {
      name: 'Pujol',
      cuisine: 'Mexican',
      rating: 4.9,
      deliveryTime: 60,
      menuItems: [],
      image: 'https://images.unsplash.com/photo-1708517194326-6077b788f04b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8UHVqb2wlMjByZXN0YXVyYW50fGVufDB8fDB8fHww',
      isOpen: true,
      isPopular: false,
      location: 'Polanco, Mexico City, Mexico',
      country: 'Mexico',
      promo: 'Modern Mexican cuisine',
      minOrder: 500,
      deliveryFee: 60,
      tags: ['gourmet', 'modern', 'fine dining']
  }
];

async function seedRestaurants() {
  const connection = await connectDB();
  
  try {
    // Clear existing data
    await Restaurant.deleteMany({});
    console.log('Cleared existing restaurants');
    
    // Insert new data
    const createdRestaurants = await Restaurant.insertMany(restaurants);
    console.log(`Successfully seeded ${createdRestaurants.length} restaurants`);
    return createdRestaurants;
  } catch (error) {
    console.error('Error seeding restaurants:', error);
    throw error;
  } finally {
    // Only close the connection if this script is run directly
    if (process.argv[1].includes('seedRestaurants.js')) {
      await connection.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  seedRestaurants()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { restaurants, seedRestaurants };
