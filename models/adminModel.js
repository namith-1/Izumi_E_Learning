const bcrypt = require('bcrypt');
const { Admin } = require('../required/db.js');

const AdminModel = {
  // Find admin by email
  findByEmail: async (email) => {
    return await Admin.findOne({ email });
  },

  // Find active admin by email
  findActiveByEmail: async (email) => {
    return await Admin.findOne({ email, is_deleted: 0 });
  },

  // Find admin by ID
  findById: async (id) => {
    return await Admin.findById(id);
  },

  // Get admin profile
  getAdminById: async (id) => {
    return await Admin.findById(id).select('_id name email role created_at');
  },

  // Create new admin
  create: async (name, email, password) => {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const admin = new Admin({
        name,
        email,
        hashed_password: hashedPassword,
        role: 'admin',
        is_deleted: 0,
      });
      return await admin.save();
    } catch (error) {
      throw new Error('Error creating admin: ' + error.message);
    }
  },

  // Update admin field
  updateField: async (id, field, value) => {
    const allowedFields = ['name', 'email'];
    if (!allowedFields.includes(field)) {
      throw new Error('Invalid field');
    }

    try {
      const result = await Admin.updateOne({ _id: id }, { [field]: value });
      return result;
    } catch (error) {
      throw new Error('Error updating field: ' + error.message);
    }
  },

  // Soft delete admin
  softDelete: async (id) => {
    await Admin.updateOne({ _id: id }, { is_deleted: 1 });
  },

  // Count total admins
  countAdmins: async () => {
    return await Admin.countDocuments({ is_deleted: 0 });
  },

  // Get all admins
  getAllAdmins: async (skip = 0, limit = 10) => {
    return await Admin.find({ is_deleted: 0 })
      .select('_id name email role created_at')
      .skip(skip)
      .limit(limit)
      .lean();
  },
};

module.exports = AdminModel;
