const axios = require('axios');

async function testRestaurantCreation() {
  try {
    const restaurantData = {
      name: 'Test Dragon Sushi',
      cuisine: 'Chinese',
      image: 'https://example.com/image.jpg',
      location: 'Chinatown',
      deliveryTime: 35,
      country: 'Ethiopia'
    };

    console.log('Testing restaurant creation...');
    console.log('Data:', restaurantData);

    const response = await axios.post('http://localhost:5000/api/restaurants', restaurantData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testRestaurantCreation();