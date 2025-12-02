// Script to create a test admin account
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const AdminModel = require('../models/adminModel');

// Use Atlas if available, else fallback to local MongoDB
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/izumi3';

async function createTestAdmin() {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await AdminModel.findByEmail('admin@example.com');
    if (existingAdmin) {
      console.log('⚠️  Admin account already exists:', existingAdmin.email);
      console.log('Admin ID:', existingAdmin._id);
      console.log('Name:', existingAdmin.name);
      process.exit(0);
    }

    // Create new admin
    console.log('📝 Creating admin account...');
    const newAdmin = await AdminModel.create(
      'System Administrator',
      'admin@example.com',
      'admin123456'
    );

    console.log('✅ Admin account created successfully!');
    console.log('');
    console.log('Admin Details:');
    console.log('  Email:', newAdmin.email);
    console.log('  Name:', newAdmin.name);
    console.log('  ID:', newAdmin._id);
    console.log('  Role:', newAdmin.role);
    console.log('');
    console.log('Login credentials:');
    console.log('  Email: admin@example.com');
    console.log('  Password: admin123456');
    console.log('');
    console.log('🔗 Admin Login URL: http://localhost:4000/admin/login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
}

createTestAdmin();
