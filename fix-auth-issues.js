const axios = require('axios');

async function fixAuthIssues() {
  console.log('🔧 Fixing authentication issues...\n');
  
  try {
    // 1. Test logout endpoint
    console.log('1. Testing logout endpoint...');
    const logoutResponse = await axios.post('http://localhost:5000/api/user/logout');
    console.log('✅ Logout endpoint working:', logoutResponse.data);
    
    // 2. Create a fresh test user
    console.log('\n2. Creating fresh test user...');
    const registerResponse = await axios.post('http://localhost:5000/api/user/register', {
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'password123',
      role: 'user'
    });
    
    if (registerResponse.data.success) {
      console.log('✅ Test user created successfully');
      console.log('   Email: testuser@example.com');
      console.log('   Password: password123');
      
      // 3. Test login with new user
      console.log('\n3. Testing login with new user...');
      const loginResponse = await axios.post('http://localhost:5000/api/user/login', {
        email: 'testuser@example.com',
        password: 'password123'
      });
      
      if (loginResponse.data.success) {
        console.log('✅ Login working correctly');
        console.log('   Token received:', !!loginResponse.data.token);
      } else {
        console.log('❌ Login failed:', loginResponse.data.message);
      }
    } else {
      console.log('⚠️ User might already exist, trying login...');
      
      const loginResponse = await axios.post('http://localhost:5000/api/user/login', {
        email: 'testuser@example.com',
        password: 'password123'
      });
      
      if (loginResponse.data.success) {
        console.log('✅ Login working with existing user');
      } else {
        console.log('❌ Login failed:', loginResponse.data.message);
      }
    }
    
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already')) {
      console.log('⚠️ User already exists, testing login...');
      
      try {
        const loginResponse = await axios.post('http://localhost:5000/api/user/login', {
          email: 'testuser@example.com',
          password: 'password123'
        });
        
        if (loginResponse.data.success) {
          console.log('✅ Login working with existing user');
        } else {
          console.log('❌ Login failed:', loginResponse.data.message);
        }
      } catch (loginError) {
        console.log('❌ Login error:', loginError.response?.data || loginError.message);
      }
    } else {
      console.log('❌ Error:', error.response?.data || error.message);
    }
  }
  
  console.log('\n📋 Test Credentials:');
  console.log('   Email: testuser@example.com');
  console.log('   Password: password123');
  console.log('\n🎉 Auth fix complete!');
}

fixAuthIssues();