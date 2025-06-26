// models/Admin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: false,
    unique: true,
    trim: true,
    lowercase: true,
    sparse: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'super_admin'],
    default: 'admin'
  },
  createdBy: {
    type: String,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Pre-save middleware to hash password (only if you want auto-hashing)
// Remove this if you're hashing passwords manually in controllers
adminSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 10
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Static method to find admin by credentials
adminSchema.statics.findByCredentials = async function(username, password) {
  const admin = await this.findOne({ username, isActive: true });
  
  if (!admin) {
    throw new Error('Invalid credentials');
  }
  
  const isMatch = await admin.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }
  
  return admin;
};

// Prevent model recompilation error
module.exports = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
