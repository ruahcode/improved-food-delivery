require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@test.com' });
        if (existingAdmin) {
            console.log('Admin user already exists');
            console.log('Email:', existingAdmin.email);
            console.log('Role:', existingAdmin.role);
            
            // Generate token for existing admin
            const token = existingAdmin.generateAuthToken();
            console.log('Admin token:', token);
            
            process.exit(0);
        }

        // Create new admin user
        const admin = new User({
            fullName: 'Admin User',
            email: 'admin@test.com',
            password: 'Admin123!',
            role: 'admin'
        });

        await admin.save();
        console.log('Admin user created successfully!');
        console.log('Email: admin@test.com');
        console.log('Password: Admin123!');
        
        // Generate token
        const token = admin.generateAuthToken();
        console.log('Admin token:', token);
        
    } catch (error) {
        console.error('Error creating admin:', error.message);
    } finally {
        mongoose.connection.close();
    }
};

createAdmin();