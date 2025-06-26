const jwt = require('jsonwebtoken');
const User = require('../models/User');

const adminController = {
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password required'
        });
      }

      // Hardcoded admin credentials for development
      if (username === 'admin' && password === 'admin123') {
        const token = jwt.sign(
          { id: 'admin-1', username, role: 'admin' },
          process.env.JWT_SECRET || 'your_jwt_secret',
          { expiresIn: '24h' }
        );

        return res.json({
          success: true,
          token,
          admin: { id: 'admin-1', username, role: 'admin' }
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Login error'
      });
    }
  },

  getStats: async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();
      const verifiedUsers = await User.countDocuments({ status: 'verified' });
      const pendingUsers = await User.countDocuments({ status: 'pending' });
      const rejectedUsers = await User.countDocuments({ status: 'rejected' });
      
      return res.json({
        success: true,
        totalUsers,
        verifiedUsers,
        pendingUsers,
        rejectedUsers,
        mintedProperties: 0
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error getting stats'
      });
    }
  }
};

module.exports = adminController;