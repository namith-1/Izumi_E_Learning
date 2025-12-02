#!/usr/bin/env node

/**
 * Admin Login Troubleshooting Guide
 * 
 * Run this to verify your setup and create test admin account
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/izumi3';

// Define Admin Schema
const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  hashed_password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  is_deleted: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
});

const Admin = mongoose.model('Admin', adminSchema);

async function setupTestAdmin() {
  try {
    console.log('\n🔧 Admin Login Setup Guide\n');
    console.log('Connecting to MongoDB:', uri);
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB\n');

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ email: 'admin@test.com' });
    
    if (existingAdmin) {
      console.log('📋 Test admin account already exists:');
      console.log('   Email: admin@test.com');
      console.log('   Name:', existingAdmin.name);
      console.log('   Created:', existingAdmin.created_at);
    } else {
      console.log('Creating test admin account...\n');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = new Admin({
        name: 'Test Admin',
        email: 'admin@test.com',
        hashed_password: hashedPassword,
        role: 'admin',
        is_deleted: 0,
      });
      
      await admin.save();
      
      console.log('✅ Test admin created successfully!\n');
      console.log('📝 Login Credentials:');
      console.log('   Email: admin@test.com');
      console.log('   Password: admin123');
    }

    // List all admins
    const allAdmins = await Admin.find({ is_deleted: 0 }).select('_id name email created_at');
    console.log('\n📊 All Active Admins:');
    if (allAdmins.length === 0) {
      console.log('   (None found)');
    } else {
      allAdmins.forEach((admin, idx) => {
        console.log(`   ${idx + 1}. ${admin.name} (${admin.email})`);
      });
    }

    console.log('\n✅ Setup complete!\n');
    console.log('🔑 Troubleshooting checklist:');
    console.log('   □ Verify admin account exists in DB');
    console.log('   □ Check browser console for API errors');
    console.log('   □ Verify /admin/auth/login returns 200');
    console.log('   □ Ensure session cookies are enabled');
    console.log('   □ Check that CORS is properly configured');
    console.log('   □ Verify MongoDB connection in server logs');
    console.log();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

setupTestAdmin();
