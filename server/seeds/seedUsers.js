const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { connectDB } = require('../utils/db');

// Sample users data
const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'Admin@12345', // Strong password with uppercase, lowercase, number and special character
    role: 'admin',
    isEmailVerified: true // Skip email verification for admin
  }
];

async function seedUsers() {
  const connection = await connectDB();
  
  try {
    // Clear existing data
    await User.deleteMany({});
    console.log('Cleared existing users');
    
    // Create users one by one to trigger password hashing
    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
    }
    
    console.log(`Successfully seeded ${createdUsers.length} users`);
    
    return createdUsers;
  } catch (error) {
    console.error('Error seeding users:', error);
    return [];
  } finally {
    // Only close the connection if this script is run directly
    if (process.argv[1].includes('seedUsers.js')) {
      await connection.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  seedUsers()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { users, seedUsers };