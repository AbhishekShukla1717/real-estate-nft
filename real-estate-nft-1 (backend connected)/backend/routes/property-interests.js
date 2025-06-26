// backend/routes/property-interests.js - Simple interest system
const express = require('express');
const router = express.Router();
// Adjust this import based on your database setup
// const pool = require('../config/database'); // or your database connection

// Simple database table for property interests
/*
CREATE TABLE IF NOT EXISTS property_interests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token_id VARCHAR(255) NOT NULL,
  buyer_address VARCHAR(42) NOT NULL,
  owner_address VARCHAR(42) NOT NULL,
  status ENUM('pending', 'approved') DEFAULT 'pending',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP NULL,
  
  INDEX idx_token_id (token_id),
  INDEX idx_buyer (buyer_address),
  INDEX idx_owner (owner_address),
  INDEX idx_status (status),
  
  -- One interest per buyer per property
  UNIQUE KEY unique_buyer_property (token_id, buyer_address)
);
*/

// Get all interests for a specific property
router.get('/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    
    const query = `
      SELECT 
        id,
        token_id as tokenId,
        buyer_address as buyerAddress,
        owner_address as ownerAddress,
        status,
        timestamp,
        approved_at as approvedAt
      FROM property_interests 
      WHERE token_id = ? 
      ORDER BY timestamp ASC
    `;
    
    // Adjust this based on your database setup
    const interests = await db.query(query, [tokenId]);
    // For MySQL: const [interests] = await pool.execute(query, [tokenId]);
    
    res.json({
      success: true,
      interests: interests
    });
    
  } catch (error) {
    console.error('Error fetching property interests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interests'
    });
  }
});

// Express interest in a property
router.post('/', async (req, res) => {
  try {
    const { tokenId, buyerAddress } = req.body;
    
    // Validate required fields
    if (!tokenId || !buyerAddress) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: tokenId, buyerAddress'
      });
    }
    
    // Get property owner from your properties table
    const propertyQuery = `
      SELECT owner_address 
      FROM properties 
      WHERE nft_token_id = ? AND status = 'minted'
    `;
    
    const propertyResult = await db.query(propertyQuery, [tokenId]);
    
    if (!propertyResult || propertyResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or not minted'
      });
    }
    
    const ownerAddress = propertyResult[0].owner_address;
    
    // Check if buyer is trying to express interest in their own property
    if (buyerAddress.toLowerCase() === ownerAddress.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot express interest in your own property'
      });
    }
    
    // Check if buyer already expressed interest
    const existingQuery = `
      SELECT id FROM property_interests 
      WHERE token_id = ? AND buyer_address = ?
    `;
    
    const existing = await db.query(existingQuery, [tokenId, buyerAddress.toLowerCase()]);
    
    if (existing && existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'You have already expressed interest in this property'
      });
    }
    
    // Insert new interest
    const insertQuery = `
      INSERT INTO property_interests 
      (token_id, buyer_address, owner_address, status, timestamp)
      VALUES (?, ?, ?, 'pending', NOW())
    `;
    
    const result = await db.query(insertQuery, [
      tokenId,
      buyerAddress.toLowerCase(),
      ownerAddress.toLowerCase()
    ]);
    
    // Get the created interest
    const interestId = result.insertId || result.lastID;
    
    const newInterest = await db.query(
      'SELECT * FROM property_interests WHERE id = ?',
      [interestId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Interest expressed successfully',
      interest: newInterest[0]
    });
    
  } catch (error) {
    console.error('Error creating interest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to express interest'
    });
  }
});

// Approve a buyer (owner only)
router.put('/:interestId/approve', async (req, res) => {
  try {
    const { interestId } = req.params;
    const { ownerAddress, tokenId } = req.body;
    
    // Get the interest details
    const getInterestQuery = `
      SELECT * FROM property_interests WHERE id = ?
    `;
    
    const interestResult = await db.query(getInterestQuery, [interestId]);
    
    if (!interestResult || interestResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Interest not found'
      });
    }
    
    const interest = interestResult[0];
    
    // Check if the requester is the property owner
    if (ownerAddress.toLowerCase() !== interest.owner_address.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Only the property owner can approve buyers'
      });
    }
    
    // First, reset all other interests for this property to pending
    const resetQuery = `
      UPDATE property_interests 
      SET status = 'pending', approved_at = NULL
      WHERE token_id = ? AND id != ?
    `;
    
    await db.query(resetQuery, [tokenId, interestId]);
    
    // Then approve this specific interest
    const approveQuery = `
      UPDATE property_interests 
      SET status = 'approved', approved_at = NOW()
      WHERE id = ?
    `;
    
    await db.query(approveQuery, [interestId]);
    
    // Get the updated interest
    const updatedInterest = await db.query(
      'SELECT * FROM property_interests WHERE id = ?',
      [interestId]
    );
    
    res.json({
      success: true,
      message: 'Buyer approved successfully',
      interest: updatedInterest[0]
    });
    
  } catch (error) {
    console.error('Error approving buyer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve buyer'
    });
  }
});

// Get interests by buyer (optional - for user dashboard)
router.get('/buyer/:buyerAddress', async (req, res) => {
  try {
    const { buyerAddress } = req.params;
    
    const query = `
      SELECT 
        pi.id,
        pi.token_id as tokenId,
        pi.buyer_address as buyerAddress,
        pi.owner_address as ownerAddress,
        pi.status,
        pi.timestamp,
        pi.approved_at as approvedAt,
        p.title as propertyTitle,
        p.location as propertyLocation,
        p.price as propertyPrice
      FROM property_interests pi
      LEFT JOIN properties p ON pi.token_id = p.nft_token_id
      WHERE pi.buyer_address = ? 
      ORDER BY pi.timestamp DESC
    `;
    
    const interests = await db.query(query, [buyerAddress.toLowerCase()]);
    
    res.json({
      success: true,
      interests: interests
    });
    
  } catch (error) {
    console.error('Error fetching buyer interests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch buyer interests'
    });
  }
});

// Get interests by owner (optional - for owner dashboard)
router.get('/owner/:ownerAddress', async (req, res) => {
  try {
    const { ownerAddress } = req.params;
    
    const query = `
      SELECT 
        pi.id,
        pi.token_id as tokenId,
        pi.buyer_address as buyerAddress,
        pi.owner_address as ownerAddress,
        pi.status,
        pi.timestamp,
        pi.approved_at as approvedAt,
        p.title as propertyTitle,
        p.location as propertyLocation,
        p.price as propertyPrice
      FROM property_interests pi
      LEFT JOIN properties p ON pi.token_id = p.nft_token_id
      WHERE pi.owner_address = ? 
      ORDER BY pi.timestamp DESC
    `;
    
    const interests = await db.query(query, [ownerAddress.toLowerCase()]);
    
    res.json({
      success: true,
      interests: interests
    });
    
  } catch (error) {
    console.error('Error fetching owner interests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch owner interests'
    });
  }
});

// Remove interest (buyer cancels their interest)
router.delete('/:interestId', async (req, res) => {
  try {
    const { interestId } = req.params;
    const { buyerAddress } = req.body;
    
    // Get interest details
    const getInterestQuery = `
      SELECT * FROM property_interests WHERE id = ?
    `;
    
    const interestResult = await db.query(getInterestQuery, [interestId]);
    
    if (!interestResult || interestResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Interest not found'
      });
    }
    
    const interest = interestResult[0];
    
    // Check if the requester is the buyer
    if (buyerAddress.toLowerCase() !== interest.buyer_address.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Only the buyer can remove their interest'
      });
    }
    
    // Only allow removal if not approved
    if (interest.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove approved interest. Contact the property owner.'
      });
    }
    
    // Delete the interest
    const deleteQuery = `DELETE FROM property_interests WHERE id = ?`;
    await db.query(deleteQuery, [interestId]);
    
    res.json({
      success: true,
      message: 'Interest removed successfully'
    });
    
  } catch (error) {
    console.error('Error removing interest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove interest'
    });
  }
});

// Get statistics (optional - for admin dashboard)
router.get('/stats/overview', async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_interests,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_interests,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_interests,
        COUNT(DISTINCT token_id) as properties_with_interest,
        COUNT(DISTINCT buyer_address) as unique_interested_buyers
      FROM property_interests
    `;
    
    const stats = await db.query(statsQuery);
    
    res.json({
      success: true,
      stats: stats[0] || {}
    });
    
  } catch (error) {
    console.error('Error fetching interest stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interest statistics'
    });
  }
});

module.exports = router;

// INTEGRATION INSTRUCTIONS:
// 1. Add this file to your backend/routes/ directory as 'property-interests.js'
// 2. In your main app.js or server.js, add:
//    const interestsRoutes = require('./routes/property-interests');
//    app.use('/api/property-interests', interestsRoutes);
// 3. Create the property_interests table in your database using the SQL above
// 4. Adjust the database connection method (db.query) to match your existing setup
// 5. Make sure your properties table has the columns referenced (nft_token_id, owner_address, etc.)