// routes/propertyInterests.js - MongoDB-based routes for property interests
const express = require('express');
const router = express.Router();
const PropertyInterest = require('../models/PropertyInterest');
const Property = require('../models/Property'); // Assuming you have a Property model

// Get all interests for a specific property
router.get('/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    
    const interests = await PropertyInterest.getByProperty(tokenId);
    
    res.json({
      success: true,
      interests: interests.map(interest => ({
        id: interest._id,
        tokenId: interest.tokenId,
        buyerAddress: interest.buyerAddress,
        ownerAddress: interest.ownerAddress,
        status: interest.status,
        timestamp: interest.timestamp,
        approvedAt: interest.approvedAt
      }))
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
    
    // Get property owner from your properties collection
    // Adjust the field names based on your Property model
    const property = await Property.findOne({ 
      $or: [
        { nftTokenId: tokenId },
        { tokenId: tokenId }
      ],
      status: 'minted'
    });
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or not minted'
      });
    }
    
    const ownerAddress = property.ownerAddress || property.owner_address;
    
    // Check if buyer is trying to express interest in their own property
    if (buyerAddress.toLowerCase() === ownerAddress.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot express interest in your own property'
      });
    }
    
    // Check if buyer already expressed interest (handled by unique index)
    const existingInterest = await PropertyInterest.findOne({
      tokenId,
      buyerAddress: buyerAddress.toLowerCase()
    });
    
    if (existingInterest) {
      return res.status(409).json({
        success: false,
        message: 'You have already expressed interest in this property'
      });
    }
    
    // Create new interest
    const newInterest = new PropertyInterest({
      tokenId,
      buyerAddress: buyerAddress.toLowerCase(),
      ownerAddress: ownerAddress.toLowerCase(),
      status: 'pending'
    });
    
    await newInterest.save();
    
    res.status(201).json({
      success: true,
      message: 'Interest expressed successfully',
      interest: {
        id: newInterest._id,
        tokenId: newInterest.tokenId,
        buyerAddress: newInterest.buyerAddress,
        ownerAddress: newInterest.ownerAddress,
        status: newInterest.status,
        timestamp: newInterest.timestamp
      }
    });
    
  } catch (error) {
    console.error('Error creating interest:', error);
    
    // Handle duplicate key error (unique constraint violation)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already expressed interest in this property'
      });
    }
    
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
    
    // Get the interest
    const interest = await PropertyInterest.findById(interestId);
    
    if (!interest) {
      return res.status(404).json({
        success: false,
        message: 'Interest not found'
      });
    }
    
    // Check if the requester is the property owner
    if (ownerAddress.toLowerCase() !== interest.ownerAddress.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Only the property owner can approve buyers'
      });
    }
    
    // Approve this interest (this will also reset others)
    await interest.approve();
    
    res.json({
      success: true,
      message: 'Buyer approved successfully',
      interest: {
        id: interest._id,
        tokenId: interest.tokenId,
        buyerAddress: interest.buyerAddress,
        ownerAddress: interest.ownerAddress,
        status: interest.status,
        timestamp: interest.timestamp,
        approvedAt: interest.approvedAt
      }
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
    
    // Get interests with property details
    const interests = await PropertyInterest.aggregate([
      {
        $match: { buyerAddress: buyerAddress.toLowerCase() }
      },
      {
        $lookup: {
          from: 'properties', // Adjust collection name if different
          localField: 'tokenId',
          foreignField: 'nftTokenId', // Adjust field name if different
          as: 'property'
        }
      },
      {
        $unwind: {
          path: '$property',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $project: {
          id: '$_id',
          tokenId: 1,
          buyerAddress: 1,
          ownerAddress: 1,
          status: 1,
          timestamp: 1,
          approvedAt: 1,
          propertyTitle: '$property.title',
          propertyLocation: '$property.location',
          propertyPrice: '$property.price'
        }
      }
    ]);
    
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
    
    // Get interests with property details
    const interests = await PropertyInterest.aggregate([
      {
        $match: { ownerAddress: ownerAddress.toLowerCase() }
      },
      {
        $lookup: {
          from: 'properties', // Adjust collection name if different
          localField: 'tokenId',
          foreignField: 'nftTokenId', // Adjust field name if different
          as: 'property'
        }
      },
      {
        $unwind: {
          path: '$property',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $project: {
          id: '$_id',
          tokenId: 1,
          buyerAddress: 1,
          ownerAddress: 1,
          status: 1,
          timestamp: 1,
          approvedAt: 1,
          propertyTitle: '$property.title',
          propertyLocation: '$property.location',
          propertyPrice: '$property.price'
        }
      }
    ]);
    
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
    
    // Get interest
    const interest = await PropertyInterest.findById(interestId);
    
    if (!interest) {
      return res.status(404).json({
        success: false,
        message: 'Interest not found'
      });
    }
    
    // Check if the requester is the buyer
    if (buyerAddress.toLowerCase() !== interest.buyerAddress.toLowerCase()) {
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
    await PropertyInterest.findByIdAndDelete(interestId);
    
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
    const stats = await PropertyInterest.aggregate([
      {
        $group: {
          _id: null,
          total_interests: { $sum: 1 },
          pending_interests: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          approved_interests: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          properties_with_interest: { $addToSet: '$tokenId' },
          unique_interested_buyers: { $addToSet: '$buyerAddress' }
        }
      },
      {
        $project: {
          _id: 0,
          total_interests: 1,
          pending_interests: 1,
          approved_interests: 1,
          properties_with_interest: { $size: '$properties_with_interest' },
          unique_interested_buyers: { $size: '$unique_interested_buyers' }
        }
      }
    ]);
    
    const result = stats[0] || {
      total_interests: 0,
      pending_interests: 0,
      approved_interests: 0,
      properties_with_interest: 0,
      unique_interested_buyers: 0
    };
    
    res.json({
      success: true,
      stats: result
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