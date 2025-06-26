// controllers/propertyInterestsController.js - MongoDB controller for property interests
const PropertyInterest = require('../models/PropertyInterest');
const Property = require('../models/Property'); // Adjust based on your Property model name

// Get all interests for a specific property
const getPropertyInterests = async (req, res) => {
  try {
    const { tokenId } = req.params;
    
    const interests = await PropertyInterest.find({ tokenId }).sort({ timestamp: 1 });
    
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
};

// Express interest in a property
const expressInterest = async (req, res) => {
  try {
    const { tokenId, buyerAddress } = req.body;
    
    // Validate required fields
    if (!tokenId || !buyerAddress) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: tokenId, buyerAddress'
      });
    }
    
    // Get property owner - adjust field names based on your Property model
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
    
    // Get owner address - adjust field name based on your Property model
    const ownerAddress = property.ownerAddress || property.owner_address || property.owner;
    
    // Check if buyer is trying to express interest in their own property
    if (buyerAddress.toLowerCase() === ownerAddress.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot express interest in your own property'
      });
    }
    
    // Check if buyer already expressed interest
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
    
    // Handle duplicate key error
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
};

// Approve a buyer (owner only)
const approveBuyer = async (req, res) => {
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
    
    // Use the model's approve method (resets others and approves this one)
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
};

// Get interests by buyer (optional)
const getInterestsByBuyer = async (req, res) => {
  try {
    const { buyerAddress } = req.params;
    
    const interests = await PropertyInterest.aggregate([
      {
        $match: { buyerAddress: buyerAddress.toLowerCase() }
      },
      {
        $lookup: {
          from: 'properties', // Adjust collection name if needed
          localField: 'tokenId',
          foreignField: 'nftTokenId', // Adjust field name if needed
          as: 'property'
        }
      },
      {
        $sort: { timestamp: -1 }
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
};

// Get interests by owner (optional)
const getInterestsByOwner = async (req, res) => {
  try {
    const { ownerAddress } = req.params;
    
    const interests = await PropertyInterest.aggregate([
      {
        $match: { ownerAddress: ownerAddress.toLowerCase() }
      },
      {
        $lookup: {
          from: 'properties', // Adjust collection name if needed
          localField: 'tokenId',
          foreignField: 'nftTokenId', // Adjust field name if needed
          as: 'property'
        }
      },
      {
        $sort: { timestamp: -1 }
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
};

// Remove interest (buyer cancels)
const removeInterest = async (req, res) => {
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
};

// Get statistics (for admin dashboard)
const getInterestStats = async (req, res) => {
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
};

module.exports = {
  getPropertyInterests,
  expressInterest,
  approveBuyer,
  getInterestsByBuyer,
  getInterestsByOwner,
  removeInterest,
  getInterestStats
};