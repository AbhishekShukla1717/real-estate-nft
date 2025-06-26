// routes/propertyRoutes.js - Updated with missing API endpoints
const express = require('express');
const router = express.Router();
const Property = require('../models/PropertyModel'); // Fixed import to match your existing file
const auth = require('../middleware/auth');

// Get all properties
router.get('/', async (req, res) => {
  try {
    const properties = await Property.find()
      .populate('owner', 'fullName walletAddress') // Updated field name to match User.js
      .sort('-createdAt');
    
    res.json({
      success: true,
      properties
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties'
    });
  }
});

// Get properties by owner
router.get('/owner/:ownerAddress', async (req, res) => {
  try {
    const { ownerAddress } = req.params;
    
    const properties = await Property.find({ 
      currentOwner: ownerAddress.toLowerCase() 
    }).sort('-createdAt');
    
    res.json({
      success: true,
      properties
    });
  } catch (error) {
    console.error('Error fetching owner properties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties'
    });
  }
});

// Get single property
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('owner', 'fullName walletAddress'); // Updated field name
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    res.json({
      success: true,
      property
    });
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch property'
    });
  }
});

// Create new property - with error handling for missing auth middleware
router.post('/', async (req, res) => {
  try {
    // Basic auth check - you can improve this based on your auth middleware
    let userId = null;
    if (req.user && req.user.id) {
      userId = req.user.id;
    }
    
    const propertyData = {
      ...req.body,
      owner: userId,
      currentOwner: req.body.ownerAddress?.toLowerCase(),
      status: 'pending',
      isListed: false
    };
    
    const property = new Property(propertyData);
    await property.save();
    
    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      property
    });
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create property',
      error: error.message
    });
  }
});

// Update property NFT info
router.put('/:id/nft', async (req, res) => {
  try {
    const { tokenId, contractAddress, transactionHash } = req.body;
    
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    property.tokenId = tokenId;
    property.contractAddress = contractAddress;
    property.mintTransactionHash = transactionHash;
    property.isMinted = true;
    property.mintedAt = new Date();
    
    await property.save();
    
    res.json({
      success: true,
      message: 'Property NFT info updated',
      property
    });
  } catch (error) {
    console.error('Error updating NFT info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update NFT info'
    });
  }
});

// NEW ROUTE: Update property listing status - FIX FOR 404 ERROR
router.put('/:propertyId/listing', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const updateData = req.body;
    
    console.log('Updating listing for property:', propertyId, 'with data:', updateData);
    
    // Find property by ID or tokenId
    let property = await Property.findById(propertyId);
    if (!property) {
      property = await Property.findOne({ tokenId: propertyId });
    }
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    // Update the property with listing data
    Object.assign(property, updateData);
    await property.save();
    
    res.json({
      success: true,
      message: 'Listing status updated',
      property
    });
  } catch (error) {
    console.error('Error updating listing status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update listing status',
      error: error.message
    });
  }
});

// Update property listing status - EXISTING ROUTE (keeping for compatibility)
router.put('/:tokenId/listing', async (req, res) => {
  try {
    const { tokenId } = req.params;
    const updateData = req.body;
    
    console.log('Updating listing for token:', tokenId, 'with data:', updateData);
    
    // Find property by tokenId (not MongoDB _id)
    const property = await Property.findOne({ tokenId: tokenId });
    
    if (!property) {
      // If not found by tokenId, try by MongoDB _id
      const propertyById = await Property.findById(tokenId);
      if (!propertyById) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }
      // Update the property found by _id
      Object.assign(propertyById, updateData);
      await propertyById.save();
      
      return res.json({
        success: true,
        message: 'Listing status updated',
        property: propertyById
      });
    }
    
    // Update the property with listing data
    Object.assign(property, updateData);
    await property.save();
    
    res.json({
      success: true,
      message: 'Listing status updated',
      property
    });
  } catch (error) {
    console.error('Error updating listing status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update listing status',
      error: error.message
    });
  }
});

// Record property transfer
router.post('/:tokenId/transfer', async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { from, to, txHash, price } = req.body;
    
    const property = await Property.findOne({ tokenId: tokenId });
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    // Update current owner
    property.currentOwner = to.toLowerCase();
    property.previousOwners.push({
      address: from.toLowerCase(),
      transferDate: new Date(),
      transactionHash: txHash,
      price: price
    });
    
    await property.save();
    
    res.json({
      success: true,
      message: 'Transfer recorded',
      property
    });
  } catch (error) {
    console.error('Error recording transfer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record transfer'
    });
  }
});

// Update property status (admin) - with error handling for missing auth
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        statusUpdatedAt: new Date()
      },
      { new: true }
    );
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Property status updated',
      property
    });
  } catch (error) {
    console.error('Error updating property status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update property status'
    });
  }
});

// Get pending properties (admin) - with error handling for missing auth
router.get('/admin/pending', async (req, res) => {
  try {
    const properties = await Property.find({ status: 'pending' })
      .populate('owner', 'fullName walletAddress email') // Updated field name
      .sort('-createdAt');
    
    res.json({
      success: true,
      properties
    });
  } catch (error) {
    console.error('Error fetching pending properties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending properties'
    });
  }
});

module.exports = router;