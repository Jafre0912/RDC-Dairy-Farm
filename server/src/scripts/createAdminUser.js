// Try to load environment variables but fall back to hardcoded values if not available
require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const User = require('../models/userSchema');

// Connection URI - use environment variable if available, otherwise use default local connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dairyManagement';

console.log('Connecting to MongoDB...');
console.log(`Using MongoDB URI: ${MONGODB_URI}`);

// Database connection
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected...'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@farmflow.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      
      // Update to admin role if not already
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('Updated existing user to admin role');
      }
    } else {
      // Create new admin user
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@farmflow.com',
        password: 'admin123', // This will be hashed by the pre-save hook
        role: 'admin',
      });
      
      await adminUser.save();
      console.log('Admin user created successfully');
    }
    
    console.log('Admin credentials:');
    console.log('Email: admin@farmflow.com');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser(); 