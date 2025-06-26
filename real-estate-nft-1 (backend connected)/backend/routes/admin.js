// routes/admin.js or wherever your admin routes are defined
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Property = require('../models/PropertyModel');
const Transaction = require('../models/TransactionModel');
const authMiddleware = require('../middleware/auth'); // Your auth middleware

// GET /admin/stats - Get platform statistics
router.get('/stats', authMiddleware.verifyAdmin, async (req, res) => {
  try {
    console.log('🔍 Admin stats endpoint called');

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ 
      $or: [
        { status: 'verified' },
        { isVerified: true }
      ]
    });
    const pendingUsers = await User.countDocuments({ 
      $or: [
        { status: 'pending' },
        { status: 'registered' },
        { $and: [{ isVerified: { $ne: true } }, { status: { $exists: false } }] }
      ]
    });
    const rejectedUsers = await User.countDocuments({ status: 'rejected' });

    // Get property statistics (if you have a Property model)
    let totalProperties = 0;
    let approvedProperties = 0;
    let pendingProperties = 0;

    try {
      totalProperties = await Property.countDocuments();
      approvedProperties = await Property.countDocuments({ status: 'approved' });
      pendingProperties = await Property.countDocuments({ status: 'pending' });
    } catch (error) {
      console.log('Property model not found, skipping property stats');
    }

    // Get transaction statistics (if you have a Transaction model)
    let totalTransactions = 0;
    let totalVolume = 0;

    try {
      totalTransactions = await Transaction.countDocuments();
      const volumeResult = await Transaction.aggregate([
        {
          $group: {
            _id: null,
            totalVolume: { $sum: '$amount' }
          }
        }
      ]);
      totalVolume = volumeResult.length > 0 ? volumeResult[0].totalVolume : 0;
    } catch (error) {
      console.log('Transaction model not found, skipping transaction stats');
    }

    // Prepare response
    const stats = {
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        pending: pendingUsers,
        rejected: rejectedUsers
      },
      properties: {
        total: totalProperties,
        approved: approvedProperties,
        pending: pendingProperties
      },
      transactions: {
        total: totalTransactions,
        volume: totalVolume
      },
      // For compatibility with your frontend
      totalUsers,
      verifiedUsers,
      pendingUsers,
      mintedProperties: approvedProperties,
      generatedAt: new Date().toISOString()
    };

    console.log('📊 Stats generated:', stats);

    res.status(200).json(stats);
  } catch (error) {
    console.error('❌ Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch platform statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;