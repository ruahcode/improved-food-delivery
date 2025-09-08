require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const testAdmin = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
        await mongoose.connect(mongoUri);
        
        // Find admin user with password field
        const admin = await User.findOne({ email: 'admin@example.com' }).select('+password');
        if (!admin) {
            console.log('Admin user not found');
            return;
        }
        
        console.log('Admin user found:');
        console.log('Email:', admin.email);
        console.log('Role:', admin.role);
        console.log('Active:', admin.isActive);
        
        // Generate and test token
        const token = admin.generateAuthToken();
        console.log('Generated token:', token);
        
        // Test password
        const isMatch = await admin.comparePassword('Admin@12345');
        console.log('Password match:', isMatch);
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        mongoose.connection.close();
    }
};

testAdmin();