const AdminModel = require('../models/adminModel');
const bcrypt = require('bcrypt');

// Admin signup/registration
exports.signup = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  try {
    // Validate input
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // Check if email already exists
    const existingAdmin = await AdminModel.findByEmail(email);
    if (existingAdmin) {
      if (existingAdmin.is_deleted === 0) {
        return res.status(400).json({ message: 'Email already exists.' });
      }
    }

    // Create new admin
    const newAdmin = await AdminModel.create(name, email, password);

    // Set session
    req.session.admin = newAdmin._id;
    req.session.role = 'admin';
    
    // Save session before sending response
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
      }
    });

    res.status(201).json({
      message: 'Admin account created successfully',
      admin: {
        _id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('Admin signup error:', error);
    return res.status(500).json({ message: 'Error signing up: ' + error.message });
  }
};

// Admin login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('[AdminAuth] Login attempt for email:', email);
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find active admin by email
    const admin = await AdminModel.findActiveByEmail(email);
    if (!admin) {
      console.log('[AdminAuth] Admin not found:', email);
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    console.log('[AdminAuth] Admin found, verifying password...');
    
    // Verify password
    const match = await bcrypt.compare(password, admin.hashed_password);
    if (!match) {
      console.log('[AdminAuth] Password mismatch for:', email);
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    console.log('[AdminAuth] Password verified, setting session...');

    // Set session
    req.session.admin = admin._id.toString();
    req.session.role = 'admin';
    
    // Save session and respond
    req.session.save((err) => {
      if (err) {
        console.error('[AdminAuth] Session save error:', err);
        return res.status(500).json({ message: 'Session error: ' + err.message });
      }
      
      console.log('[AdminAuth] Session saved successfully for admin:', admin._id);
      res.json({
        message: 'Login successful',
        admin: {
          _id: admin._id.toString(),
          name: admin.name,
          email: admin.email,
          role: 'admin',
        },
      });
    });
  } catch (error) {
    console.error('[AdminAuth] Login error:', error);
    return res.status(500).json({ message: 'Error logging in: ' + error.message });
  }
};

// Get current admin
exports.getCurrentAdmin = async (req, res) => {
  try {
    console.log('[AdminAuth] getCurrentAdmin - session admin:', req.session.admin);
    
    if (!req.session.admin) {
      console.log('[AdminAuth] No session found');
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const admin = await AdminModel.getAdminById(req.session.admin);
    if (!admin) {
      console.log('[AdminAuth] Admin not found in DB:', req.session.admin);
      return res.status(404).json({ message: 'Admin not found' });
    }

    console.log('[AdminAuth] Admin found:', admin._id);
    res.json(admin);
  } catch (error) {
    console.error('[AdminAuth] Get current admin error:', error);
    res.status(500).json({ message: 'Error fetching admin info: ' + error.message });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error logging out' });
      }
      res.json({ message: 'Logout successful' });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Error logging out: ' + error.message });
  }
};
