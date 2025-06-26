// routes/escrow.js - Backend Escrow Routes
const express = require('express');
const router = express.Router();
const escrowService = require('../services/EscrowService');
const Property = require('../models/Property');
const EscrowTransaction = require('../models/EscrowTransaction');
const auth = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');

/**
 * @route   GET /api/escrow/stats
 * @desc    Get escrow contract statistics
 * @access  Public
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await escrowService.getEscrowStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting escrow stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get escrow statistics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/escrow/requirements
 * @desc    Get escrow requirements and fees
 * @access  Public
 */
router.get('/requirements', async (req, res) => {
  try {
    const requirements = await escrowService.getEscrowRequirements();
    res.json({
      success: true,
      data: requirements
    });
  } catch (error) {
    console.error('Error getting escrow requirements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get escrow requirements',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/escrow/deal/:tokenId
 * @desc    Get escrow deal details by token ID
 * @access  Public
 */
router.get('/deal/:tokenId', [
  param('tokenId').isNumeric().withMessage('Token ID must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { tokenId } = req.params;
    const deal = await escrowService.getEscrowDeal(tokenId);
    
    // Get property details if available
    let property = null;
    try {
      property = await Property.findOne({ tokenId: tokenId });
    } catch (err) {
      console.log('Property not found in database for token:', tokenId);
    }

    res.json({
      success: true,
      data: {
        escrow: deal,
        property: property
      }
    });
  } catch (error) {
    console.error('Error getting escrow deal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get escrow deal',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/escrow/user/:address
 * @desc    Get all escrows for a user
 * @access  Public
 */
router.get('/user/:address', [
  param('address').isEthereumAddress().withMessage('Invalid Ethereum address')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { address } = req.params;
    
    // Get token IDs from database where user is involved
    const properties = await Property.find({
      $or: [
        { owner: address.toLowerCase() },
        { 'escrowDetails.buyer': address.toLowerCase() },
        { 'escrowDetails.seller': address.toLowerCase() }
      ]
    });

    const tokenIds = properties.map(p => p.tokenId).filter(Boolean);
    
    if (tokenIds.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    const escrows = await escrowService.getUserEscrows(address, tokenIds);
    
    // Enhance with property details
    const enhancedEscrows = await Promise.all(
      escrows.map(async (escrow) => {
        const property = properties.find(p => p.tokenId.toString() === escrow.tokenId);
        return {
          ...escrow,
          property: property ? {
            title: property.title,
            description: property.description,
            location: property.location,
            propertyType: property.propertyType,
            images: property.images
          } : null
        };
      })
    );

    res.json({
      success: true,
      data: enhancedEscrows
    });
  } catch (error) {
    console.error('Error getting user escrows:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user escrows',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/escrow/calculate-cost
 * @desc    Calculate total cost including fees
 * @access  Public
 */
router.post('/calculate-cost', [
  body('price').isNumeric().withMessage('Price must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { price } = req.body;
    const costBreakdown = await escrowService.calculateTotalCost(price);

    res.json({
      success: true,
      data: costBreakdown
    });
  } catch (error) {
    console.error('Error calculating cost:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate cost',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/escrow/validate
 * @desc    Validate escrow transaction data
 * @access  Public
 */
router.post('/validate', [
  body('tokenId').isNumeric().withMessage('Token ID must be a number'),
  body('buyer').isEthereumAddress().withMessage('Invalid buyer address'),
  body('seller').isEthereumAddress().withMessage('Invalid seller address'),
  body('price').isNumeric().withMessage('Price must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const validation = escrowService.validateEscrowData(req.body);
    
    // Additional business logic validation
    const { tokenId, buyer, seller } = req.body;
    
    // Check if property exists
    const property = await Property.findOne({ tokenId });
    if (!property) {
      validation.errors.push('Property not found');
      validation.isValid = false;
    }

    // Check if property is available for escrow
    if (property && property.status !== 'available') {
      validation.errors.push('Property is not available for sale');
      validation.isValid = false;
    }

    // Check if escrow already exists
    const escrowExists = await escrowService.escrowExists(tokenId);
    if (escrowExists) {
      validation.errors.push('Escrow already exists for this property');
      validation.isValid = false;
    }

    // Check if buyer and seller are different
    if (buyer.toLowerCase() === seller.toLowerCase()) {
      validation.errors.push('Buyer and seller cannot be the same');
      validation.isValid = false;
    }

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Error validating escrow data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate escrow data',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/escrow/transaction
 * @desc    Record escrow transaction in database
 * @access  Private
 */
router.post('/transaction', auth, [
  body('tokenId').isNumeric().withMessage('Token ID must be a number'),
  body('transactionHash').isLength({ min: 66, max: 66 }).withMessage('Invalid transaction hash'),
  body('eventType').isIn(['created', 'funded', 'completed', 'cancelled', 'refunded']).withMessage('Invalid event type'),
  body('buyer').optional().isEthereumAddress().withMessage('Invalid buyer address'),
  body('seller').optional().isEthereumAddress().withMessage('Invalid seller address'),
  body('price').optional().isNumeric().withMessage('Price must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { tokenId, transactionHash, eventType, buyer, seller, price, amount } = req.body;

    // Create transaction record
    const transaction = new EscrowTransaction({
      tokenId,
      transactionHash,
      eventType,
      buyer,
      seller,
      price,
      amount,
      userAddress: req.user.walletAddress,
      timestamp: new Date()
    });

    await transaction.save();

    // Update property status if applicable
    if (eventType === 'created') {
      await Property.findOneAndUpdate(
        { tokenId },
        { 
          status: 'in_escrow',
          'escrowDetails.buyer': buyer,
          'escrowDetails.seller': seller,
          'escrowDetails.status': 'pending',
          'escrowDetails.createdAt': new Date()
        }
      );
    } else if (eventType === 'completed') {
      await Property.findOneAndUpdate(
        { tokenId },
        { 
          status: 'sold',
          owner: buyer,
          'escrowDetails.status': 'completed',
          'escrowDetails.completedAt': new Date()
        }
      );
    } else if (eventType === 'cancelled') {
      await Property.findOneAndUpdate(
        { tokenId },
        { 
          status: 'available',
          'escrowDetails.status': 'cancelled',
          'escrowDetails.cancelledAt': new Date()
        }
      );
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error recording escrow transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record escrow transaction',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/escrow/transactions/:tokenId
 * @desc    Get transaction history for a property
 * @access  Public
 */
router.get('/transactions/:tokenId', [
  param('tokenId').isNumeric().withMessage('Token ID must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { tokenId } = req.params;
    
    const transactions = await EscrowTransaction.find({ tokenId })
      .sort({ timestamp: -1 })
      .populate('userAddress', 'walletAddress')
      .exec();

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error getting escrow transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get escrow transactions',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/escrow/events
 * @desc    Get historical escrow events from blockchain
 * @access  Public
 */
router.get('/events', async (req, res) => {
  try {
    const { fromBlock = 0, toBlock = 'latest' } = req.query;
    
    const events = await escrowService.getEscrowEvents(fromBlock, toBlock);
    
    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Error getting escrow events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get escrow events',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/escrow/exists/:tokenId
 * @desc    Check if escrow exists for a token
 * @access  Public
 */
router.get('/exists/:tokenId', [
  param('tokenId').isNumeric().withMessage('Token ID must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { tokenId } = req.params;
    const exists = await escrowService.escrowExists(tokenId);
    
    res.json({
      success: true,
      data: { exists }
    });
  } catch (error) {
    console.error('Error checking escrow existence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check escrow existence',
      error: error.message
    });
  }
});

module.exports = router;