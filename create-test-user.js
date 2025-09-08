require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const User = require('./server/models/User');

async function createTestUser() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Delete existing test user
    await User.deleteOne({ email: 'test@gmail.com' });
    console.log('Deleted existing test user');

    // Create new test user
    const user = new User({
      name: 'Test User',
      email: 'test@gmail.com',
      password: 'test123',
      role: 'user'
    });

    await user.save();
    console.log('✅ Test user created successfully');
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('ID:', user._id);

    // Test login
    const foundUser = await User.findOne({ email: 'test@gmail.com' }).select('+password');
    console.log('✅ User found for login test');
    
    const isMatch = await foundUser.comparePassword('test123');
    console.log('✅ Password comparison result:', isMatch);

    if (isMatch) {
      const token = foundUser.generateAuthToken();
      console.log('✅ Token generated successfully');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestUser();