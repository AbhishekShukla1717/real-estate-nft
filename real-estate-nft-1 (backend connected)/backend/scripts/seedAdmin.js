const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const { Admin } = require('../models');
const connectDB = require('../config/database');

const seedAdmin = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('🌱 Starting database seeding...');
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      return;
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', saltRounds);
    
    // Create admin user
    const adminUser = new Admin({
      username: process.env.ADMIN_USERNAME || 'admin',
      password: hashedPassword,
      email: 'admin@realestatenft.com',
      isActive: true
    });
    
    await adminUser.save();
    
    console.log('✅ Admin user created successfully');
    console.log(`Username: ${adminUser.username}`);
    console.log(`Email: ${adminUser.email}`);
    console.log('Password: Use the password from your .env file');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the seed function
seedAdmin();