// controllers/propertyController.js - Enhanced with comprehensive error handling
const Property = require('../models/PropertyModel');
const User = require('../models/User');
const Transaction = require('../models/TransactionModel');
const path = require('path');
const fs = require('fs');

const propertyController = {
  // Submit property for approval and minting - ENHANCED
  submitProperty: async (req, res) => {
    try {
      console.log('🏢 Property submission request received');
      console.log('📝 Request method:', req.method);
      console.log('📝 Content-Type:', req.headers['content-type']);
      console.log('📝 Body:', req.body);
      console.log('📎 Files:', req.files ? Object.keys(req.files) : 'No files');

      // ENHANCED: Handle both multer array and object formats
      let files = [];
      if (req.files) {
        if (Array.isArray(req.files)) {
          files = req.files;
        } else if (req.files.images) {
          files = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
        } else {
          // Handle single file upload or other field names
          files = Object.values(req.files).flat();
        }
      }

      console.log('📎 Processed files:', files.length);

      const { 
        name, 
        description, 
        physicalAddress, 
        areaInSqFt, 
        propertyType,
        price,
        owner 
      } = req.body;

      // ENHANCED: Comprehensive validation with detailed error messages
      const validationErrors = [];
      
      if (!name || name.trim() === '') {
        validationErrors.push({ field: 'name', message: 'Property name is required' });
      }
      
      if (!description || description.trim() === '') {
        validationErrors.push({ field: 'description', message: 'Property description is required' });
      }
      
      if (!physicalAddress || physicalAddress.trim() === '') {
        validationErrors.push({ field: 'physicalAddress', message: 'Physical address is required' });
      }
      
      if (!owner || owner.trim() === '') {
        validationErrors.push({ field: 'owner', message: 'Owner wallet address is required' });
      }

      // Validate wallet address format
      if (owner && !/^0x[a-fA-F0-9]{40}$/.test(owner)) {
        validationErrors.push({ field: 'owner', message: 'Invalid wallet address format' });
      }

      // Validate file upload
      if (!files || files.length === 0) {
        validationErrors.push({ field: 'images', message: 'At least one property image is required' });
      }

      if (validationErrors.length > 0) {
        console.log('❌ Validation errors:', validationErrors);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors,
          missingFields: validationErrors.map(e => e.field)
        });
      }

      // ENHANCED: Check if user exists and is verified with better error handling
      let user;
      try {
        console.log('👤 Looking up user:', owner);
        user = await User.findOne({ walletAddress: owner.toLowerCase() });
        console.log('👤 User lookup result:', user ? `Found user: ${user.walletAddress}, status: ${user.status}` : 'User not found');
      } catch (userError) {
        console.error('❌ Database error during user lookup:', userError);
        return res.status(500).json({
          success: false,
          message: 'Database error during user verification',
          error: userError.message,
          code: 'USER_LOOKUP_ERROR'
        });
      }

      if (!user) {
        console.log('❌ User not found for address:', owner);
        return res.status(404).json({
          success: false,
          message: 'User not found. Please register first.',
          needsRegistration: true,
          code: 'USER_NOT_FOUND'
        });
      }

      if (user.status !== 'verified') {
        console.log('❌ User not verified. Status:', user.status);
        return res.status(403).json({
          success: false,
          message: `User verification required. Current status: ${user.status}`,
          userStatus: user.status,
          needsVerification: true,
          code: 'USER_NOT_VERIFIED'
        });
      }

      // ENHANCED: Process uploaded images with comprehensive error handling
      let images = [];
      if (files && files.length > 0) {
        try {
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            console.log(`📸 Processing file ${i + 1}:`, {
              filename: file.filename,
              originalname: file.originalname,
              size: file.size,
              mimetype: file.mimetype,
              path: file.path
            });

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(file.mimetype)) {
              throw new Error(`Invalid file type: ${file.mimetype}. Only JPEG and PNG images are allowed.`);
            }

            // Validate file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
              throw new Error(`File ${file.originalname} is too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 10MB.`);
            }

            // Check if file exists on disk
            if (!fs.existsSync(file.path)) {
              throw new Error(`File ${file.originalname} was not saved properly.`);
            }

            images.push({
              filename: file.filename,
              originalName: file.originalname,
              path: file.path,
              size: file.size,
              mimetype: file.mimetype,
              uploadDate: new Date()
            });
          }
        } catch (imageError) {
          console.error('❌ Error processing images:', imageError);
          return res.status(400).json({
            success: false,
            message: 'Error processing uploaded images',
            error: imageError.message,
            code: 'IMAGE_PROCESSING_ERROR'
          });
        }
      }

      // Generate unique property ID with better randomness
      const timestamp = Date.now();
      const randomPart = Math.random().toString(36).substr(2, 9);
      const propertyId = `PROP_${timestamp}_${randomPart}`;

      // Validate and sanitize numeric fields
      let validatedAreaInSqFt = 1000; // default
      if (areaInSqFt) {
        const parsedArea = parseInt(areaInSqFt);
        if (!isNaN(parsedArea) && parsedArea > 0) {
          validatedAreaInSqFt = parsedArea;
        } else {
          console.warn('⚠️ Invalid area provided, using default:', areaInSqFt);
        }
      }

      // Validate property type
      const validPropertyTypes = ['Residential', 'Commercial', 'Industrial', 'Land', 'Villa', 'Apartment'];
      const validatedPropertyType = validPropertyTypes.includes(propertyType) ? propertyType : 'Residential';

      // ENHANCED: Create property document with comprehensive error handling
      let newProperty;
      try {
        console.log('💾 Creating property document...');
        newProperty = new Property({
          propertyId,
          name: name.trim(),
          description: description.trim(),
          physicalAddress: physicalAddress.trim(),
          areaInSqFt: validatedAreaInSqFt,
          propertyType: validatedPropertyType,
          price: price ? price.trim() : 'Not specified',
          owner: owner.toLowerCase(),
          status: 'pending',
          images,
          submissionDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });

        console.log('💾 Saving property to database...');
        await newProperty.save();
        console.log('✅ Property saved successfully with ID:', propertyId);

      } catch (saveError) {
        console.error('❌ Database save error:', saveError);
        
        // ENHANCED: Handle specific MongoDB errors
        if (saveError.code === 11000) {
          const duplicateField = Object.keys(saveError.keyValue)[0];
          return res.status(409).json({
            success: false,
            message: `Property with this ${duplicateField} already exists`,
            error: 'DUPLICATE_KEY_ERROR',
            duplicateField
          });
        }

        if (saveError.name === 'ValidationError') {
          const validationErrors = Object.keys(saveError.errors).map(key => ({
            field: key,
            message: saveError.errors[key].message
          }));

          return res.status(400).json({
            success: false,
            message: 'Property validation failed',
            validationErrors,
            code: 'SCHEMA_VALIDATION_ERROR'
          });
        }

        if (saveError.name === 'MongoNetworkError' || saveError.name === 'MongoServerError') {
          return res.status(503).json({
            success: false,
            message: 'Database connection error. Please try again.',
            error: 'DATABASE_UNAVAILABLE',
            code: 'DB_CONNECTION_ERROR'
          });
        }

        return res.status(500).json({
          success: false,
          message: 'Database error while saving property',
          error: saveError.message,
          code: 'DB_SAVE_ERROR'
        });
      }

      // Success response with comprehensive data
      console.log('✅ Property submission completed successfully');
      res.status(201).json({
        success: true,
        message: 'Property submitted successfully and is pending admin approval',
        data: {
          propertyId,
          status: 'pending',
          submissionDate: newProperty.submissionDate,
          imagesUploaded: images.length,
          owner: owner.toLowerCase(),
          name: name.trim()
        }
      });

    } catch (error) {
      console.error('❌ Unexpected error in submitProperty:', error);
      console.error('❌ Error stack:', error.stack);

      // ENHANCED: Handle different types of unexpected errors
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid data format provided',
          error: error.message,
          code: 'CAST_ERROR'
        });
      }

      if (error.name === 'MongoNetworkError' || error.name === 'MongoServerError') {
        return res.status(503).json({
          success: false,
          message: 'Database connection error. Please try again.',
          error: 'DATABASE_UNAVAILABLE',
          code: 'DB_NETWORK_ERROR'
        });
      }

      if (error.message && error.message.includes('ENOENT')) {
        return res.status(500).json({
          success: false,
          message: 'File system error. Please try again.',
          error: 'FILE_SYSTEM_ERROR',
          code: 'FS_ERROR'
        });
      }

      // Generic error response
      res.status(500).json({
        success: false,
        message: 'Internal server error during property submission',
        error: process.env.NODE_ENV === 'development' ? error.message : 'SERVER_ERROR',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  },

  // Get all properties with filtering - ENHANCED ERROR HANDLING
  getAllProperties: async (req, res) => {
    try {
      const { status, owner, propertyType, page = 1, limit = 20 } = req.query;
      
      // Build filter query with validation
      let filter = {};
      if (status && status !== 'all') {
        const validStatuses = ['pending', 'approved', 'rejected', 'minted'];
        if (validStatuses.includes(status)) {
          filter.status = status;
        }
      }
      
      if (owner && /^0x[a-fA-F0-9]{40}$/.test(owner)) {
        filter.owner = owner.toLowerCase();
      }
      
      if (propertyType) {
        const validTypes = ['Residential', 'Commercial', 'Industrial', 'Land', 'Villa', 'Apartment'];
        if (validTypes.includes(propertyType)) {
          filter.propertyType = propertyType;
        }
      }

      // Pagination validation
      const pageNumber = Math.max(1, parseInt(page));
      const limitNumber = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 per page
      const skip = (pageNumber - 1) * limitNumber;

      console.log('📊 Fetching properties with filter:', filter);
      
      const [properties, totalCount] = await Promise.all([
        Property.find(filter)
          .sort('-createdAt')
          .skip(skip)
          .limit(limitNumber)
          .lean(),
        Property.countDocuments(filter)
      ]);

      console.log(`📊 Found ${properties.length} properties (${totalCount} total)`);
      
      res.json({
        success: true,
        data: properties,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNumber)
        },
        count: properties.length
      });

    } catch (error) {
      console.error('❌ Error fetching properties:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching properties',
        error: error.message,
        code: 'FETCH_ERROR'
      });
    }
  },

  // KEEP ALL YOUR EXISTING METHODS WITH ENHANCED ERROR HANDLING
  getPendingProperties: async (req, res) => {
    try {
      console.log('📋 Fetching pending properties...');
      const pendingProperties = await Property.find({ status: 'pending' })
        .sort('-submissionDate')
        .lean();

      console.log(`📋 Found ${pendingProperties.length} pending properties`);
      
      res.json({
        success: true,
        properties: pendingProperties,
        count: pendingProperties.length
      });

    } catch (error) {
      console.error('❌ Error fetching pending properties:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching pending properties',
        error: error.message,
        code: 'FETCH_PENDING_ERROR'
      });
    }
  },

  approveProperty: async (req, res) => {
    try {
      const { propertyId } = req.params;
      const { approvalNotes } = req.body;

      if (!propertyId) {
        return res.status(400).json({
          success: false,
          message: 'Property ID is required',
          code: 'MISSING_PROPERTY_ID'
        });
      }

      const property = await Property.findOne({ propertyId });
      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found',
          code: 'PROPERTY_NOT_FOUND'
        });
      }

      if (property.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Property is already ${property.status}`,
          currentStatus: property.status,
          code: 'INVALID_STATUS'
        });
      }

      property.status = 'approved';
      property.approvalDate = new Date();
      property.approvalNotes = approvalNotes || 'Approved by admin';
      property.updatedAt = new Date();
      
      await property.save();

      console.log('✅ Property approved:', propertyId);
      
      res.json({
        success: true,
        message: 'Property approved successfully. Owner can now mint NFT.',
        data: {
          propertyId,
          status: 'approved',
          approvalDate: property.approvalDate
        }
      });

    } catch (error) {
      console.error('❌ Error approving property:', error);
      res.status(500).json({
        success: false,
        message: 'Error approving property',
        error: error.message,
        code: 'APPROVE_ERROR'
      });
    }
  },

  rejectProperty: async (req, res) => {
    try {
      const { propertyId } = req.params;
      const { rejectionReason } = req.body;

      if (!propertyId) {
        return res.status(400).json({
          success: false,
          message: 'Property ID is required',
          code: 'MISSING_PROPERTY_ID'
        });
      }

      const property = await Property.findOne({ propertyId });
      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found',
          code: 'PROPERTY_NOT_FOUND'
        });
      }

      if (property.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Property is already ${property.status}`,
          currentStatus: property.status,
          code: 'INVALID_STATUS'
        });
      }

      property.status = 'rejected';
      property.rejectionDate = new Date();
      property.rejectionReason = rejectionReason || 'Rejected by admin';
      property.updatedAt = new Date();
      
      await property.save();

      console.log('❌ Property rejected:', propertyId);
      
      res.json({
        success: true,
        message: 'Property rejected',
        data: {
          propertyId,
          status: 'rejected',
          rejectionReason: property.rejectionReason
        }
      });

    } catch (error) {
      console.error('❌ Error rejecting property:', error);
      res.status(500).json({
        success: false,
        message: 'Error rejecting property',
        error: error.message,
        code: 'REJECT_ERROR'
      });
    }
  },

  updatePropertyWithNFT: async (req, res) => {
    try {
      const { propertyId } = req.params;
      const { 
        tokenId, 
        contractAddress, 
        transactionHash, 
        tokenURI, 
        blockNumber,
        gasUsed 
      } = req.body;

      if (!propertyId) {
        return res.status(400).json({
          success: false,
          message: 'Property ID is required',
          code: 'MISSING_PROPERTY_ID'
        });
      }

      const property = await Property.findOne({ propertyId });
      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found',
          code: 'PROPERTY_NOT_FOUND'
        });
      }

      property.tokenId = tokenId;
      property.contractAddress = contractAddress;
      property.transactionHash = transactionHash;
      property.tokenURI = tokenURI;
      property.status = 'minted';
      property.mintDate = new Date();
      property.updatedAt = new Date();
      
      await property.save();

      // Create transaction record with error handling
      try {
        if (Transaction) {
          const transaction = new Transaction({
            propertyId: property._id,
            from: '0x0000000000000000000000000000000000000000',
            to: property.owner,
            transactionHash,
            blockNumber,
            gasUsed: gasUsed || '0',
            transactionType: 'mint',
            status: 'confirmed'
          });
          
          await transaction.save();
        }
      } catch (txError) {
        console.error('⚠️ Error creating transaction record:', txError);
        // Don't fail the main operation
      }

      console.log('✅ Property updated with NFT data:', { propertyId, tokenId });
      
      res.json({
        success: true,
        message: 'Property NFT data updated successfully',
        data: {
          propertyId,
          tokenId,
          status: 'minted',
          transactionHash
        }
      });

    } catch (error) {
      console.error('❌ Error updating property with NFT data:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating property with NFT data',
        error: error.message,
        code: 'UPDATE_NFT_ERROR'
      });
    }
  },

  // Add the remaining methods from your original controller with enhanced error handling...
  getPropertyById: async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Property ID is required',
          code: 'MISSING_ID'
        });
      }

      let property = await Property.findOne({ propertyId: id });
      if (!property) {
        property = await Property.findOne({ tokenId: id });
      }
      if (!property) {
        property = await Property.findById(id);
      }

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found',
          code: 'PROPERTY_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: property
      });

    } catch (error) {
      console.error('❌ Error fetching property:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching property',
        error: error.message,
        code: 'FETCH_PROPERTY_ERROR'
      });
    }
  },

  getPropertiesByOwner: async (req, res) => {
    try {
      const { ownerAddress } = req.params;
      
      if (!ownerAddress || !/^0x[a-fA-F0-9]{40}$/.test(ownerAddress)) {
        return res.status(400).json({
          success: false,
          message: 'Valid wallet address is required',
          code: 'INVALID_ADDRESS'
        });
      }
      
      const properties = await Property.find({ 
        owner: ownerAddress.toLowerCase() 
      }).sort('-createdAt');

      res.json({
        success: true,
        data: properties,
        count: properties.length
      });

    } catch (error) {
      console.error('❌ Error fetching owner properties:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching properties',
        error: error.message,
        code: 'FETCH_OWNER_PROPERTIES_ERROR'
      });
    }
  },

  updateListingStatus: async (req, res) => {
    try {
      const { propertyId } = req.params;
      const { isListed, listingPrice, marketplaceTransactionHash } = req.body;

      const property = await Property.findOne({ propertyId });
      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found',
          code: 'PROPERTY_NOT_FOUND'
        });
      }

      property.isListed = isListed;
      if (isListed) {
        property.listingPrice = listingPrice;
        property.listingDate = new Date();
        if (marketplaceTransactionHash) {
          property.marketplaceTransactionHash = marketplaceTransactionHash;
        }
      } else {
        property.listingPrice = null;
        property.listingDate = null;
      }

      await property.save();

      res.json({
        success: true,
        message: `Property ${isListed ? 'listed' : 'unlisted'} successfully`,
        data: {
          propertyId,
          isListed,
          listingPrice
        }
      });

    } catch (error) {
      console.error('❌ Error updating listing status:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating listing status',
        error: error.message,
        code: 'UPDATE_LISTING_ERROR'
      });
    }
  },

  recordTransfer: async (req, res) => {
    try {
      const { propertyId } = req.params;
      const { 
        from, 
        to, 
        transactionHash, 
        blockNumber, 
        gasUsed, 
        transferType = 'transfer' 
      } = req.body;

      if (!propertyId) {
        return res.status(400).json({
          success: false,
          message: 'Property ID is required',
          code: 'MISSING_PROPERTY_ID'
        });
      }

      if (!from || !to || !transactionHash) {
        return res.status(400).json({
          success: false,
          message: 'Missing required transfer data: from, to, transactionHash',
          code: 'MISSING_TRANSFER_DATA'
        });
      }

      const property = await Property.findOne({ propertyId });
      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found',
          code: 'PROPERTY_NOT_FOUND'
        });
      }

      // Update property owner
      property.owner = to.toLowerCase();
      property.lastTransferDate = new Date();
      property.updatedAt = new Date();
      await property.save();

      // Create transaction record with error handling
      try {
        if (Transaction) {
          const transaction = new Transaction({
            propertyId: property._id,
            from: from.toLowerCase(),
            to: to.toLowerCase(),
            transactionHash,
            blockNumber,
            gasUsed: gasUsed || '0',
            transactionType: transferType,
            status: 'confirmed'
          });
          
          await transaction.save();
          console.log('✅ Transaction record created');
        }
      } catch (txError) {
        console.error('⚠️ Error creating transaction record:', txError);
        // Don't fail the main operation
      }

      res.json({
        success: true,
        message: 'Property transfer recorded successfully',
        data: {
          propertyId,
          newOwner: to,
          transactionHash
        }
      });

    } catch (error) {
      console.error('❌ Error recording transfer:', error);
      res.status(500).json({
        success: false,
        message: 'Error recording transfer',
        error: error.message,
        code: 'RECORD_TRANSFER_ERROR'
      });
    }
  }
};

module.exports = propertyController;