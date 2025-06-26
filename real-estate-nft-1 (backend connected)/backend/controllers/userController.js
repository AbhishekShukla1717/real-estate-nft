// controllers/userController.js
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

const userController = {
  // Register new user with KYC documents
  registerUser: async (req, res) => {
    try {
      const { walletAddress, fullName, email } = req.body;
      const files = req.files;
      
      console.log('📝 Registration attempt:', { walletAddress, fullName, email });
      console.log('📎 Files received:', files ? Object.keys(files) : 'No files');
      
      // Validate required fields
      if (!walletAddress || !fullName || !email) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
      }

      // Check if we have all required documents
      if (!files || !files.governmentId || !files.proofOfAddress || !files.selfieWithId) {
        const missing = [];
        if (!files) {
          missing.push('No files uploaded');
        } else {
          if (!files.governmentId) missing.push('Government ID');
          if (!files.proofOfAddress) missing.push('Proof of Address');
          if (!files.selfieWithId) missing.push('Selfie with ID');
        }
        
        return res.status(400).json({
          success: false,
          message: `Missing required documents: ${missing.join(', ')}`
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [
          { walletAddress: walletAddress.toLowerCase() },
          { email: email.toLowerCase() }
        ]
      });

      if (existingUser) {
        // If user was rejected, allow re-registration
        if (existingUser.status === 'rejected') {
          existingUser.fullName = fullName;
          existingUser.email = email.toLowerCase();
          existingUser.status = 'pending';
          existingUser.documents = [
            {
              type: 'governmentId',
              filename: files.governmentId[0].filename,
              path: files.governmentId[0].path,
              uploadDate: new Date(),
              verified: false
            },
            {
              type: 'proofOfAddress',
              filename: files.proofOfAddress[0].filename,
              path: files.proofOfAddress[0].path,
              uploadDate: new Date(),
              verified: false
            },
            {
              type: 'selfieWithId',
              filename: files.selfieWithId[0].filename,
              path: files.selfieWithId[0].path,
              uploadDate: new Date(),
              verified: false
            }
          ];
          
          await existingUser.save();
          
          return res.status(201).json({
            success: true,
            message: 'KYC re-submitted successfully. Awaiting verification.',
            userId: existingUser._id
          });
        } else {
          return res.status(400).json({
            success: false,
            message: `User already exists with status: ${existingUser.status}`
          });
        }
      }

      // Create new user
      const newUser = new User({
        walletAddress: walletAddress.toLowerCase(),
        fullName,
        email: email.toLowerCase(),
        status: 'pending',
        registrationDate: new Date(),
        documents: [
          {
            type: 'governmentId',
            filename: files.governmentId[0].filename,
            path: files.governmentId[0].path,
            uploadDate: new Date(),
            verified: false
          },
          {
            type: 'proofOfAddress',
            filename: files.proofOfAddress[0].filename,
            path: files.proofOfAddress[0].path,
            uploadDate: new Date(),
            verified: false
          },
          {
            type: 'selfieWithId',
            filename: files.selfieWithId[0].filename,
            path: files.selfieWithId[0].path,
            uploadDate: new Date(),
            verified: false
          }
        ]
      });

      await newUser.save();

      console.log('✅ User registered successfully:', newUser._id);
      
      return res.status(201).json({
        success: true,
        message: 'KYC submitted successfully. Awaiting admin verification.',
        userId: newUser._id
      });

    } catch (error) {
      console.error('❌ Registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error registering user',
        error: error.message
      });
    }
  },

  // Get user status by wallet address
  getUserStatus: async (req, res) => {
    try {
      const { walletAddress } = req.params;
      
      console.log('🔍 Getting status for wallet:', walletAddress);
      
      const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          data: null
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          status: user.status,
          documents: user.documents.map(doc => ({
            type: doc.type,
            uploaded: true,
            verified: doc.verified,
            uploadDate: doc.uploadDate
          })),
          blockchainVerified: user.blockchainVerified,
          verificationDetails: user.verificationDetails,
          registrationDate: user.registrationDate,
          fullName: user.fullName,
          email: user.email
        }
      });

    } catch (error) {
      console.error('❌ Error getting user status:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving user status',
        error: error.message
      });
    }
  },

  // Get all users with proper categorization
  getAllUsers: async (req, res) => {
    try {
      console.log('📋 Fetching all users...');
      
      const users = await User.find().select('-__v').sort('-registrationDate');
      
      // Categorize users
      const pendingUsers = users.filter(user => user.status === 'pending');
      const verifiedUsers = users.filter(user => user.status === 'verified');
      const rejectedUsers = users.filter(user => user.status === 'rejected');
      
      console.log(`📊 Found: ${pendingUsers.length} pending, ${verifiedUsers.length} verified, ${rejectedUsers.length} rejected`);
      
      return res.status(200).json({
        success: true,
        data: {
          pendingUsers: pendingUsers.map(user => ({
            _id: user._id,
            id: user._id, // Include both _id and id for compatibility
            walletAddress: user.walletAddress,
            fullName: user.fullName,
            email: user.email,
            status: user.status,
            registrationDate: user.registrationDate,
            documents: user.documents.length,
            hasAllDocuments: user.documents.length >= 3
          })),
          verifiedUsers: verifiedUsers.map(user => ({
            _id: user._id,
            id: user._id,
            walletAddress: user.walletAddress,
            fullName: user.fullName,
            email: user.email,
            status: user.status,
            registrationDate: user.registrationDate,
            verificationDate: user.verificationDetails?.verificationDate,
            blockchainVerified: user.blockchainVerified
          })),
          rejectedUsers: rejectedUsers.map(user => ({
            _id: user._id,
            id: user._id,
            walletAddress: user.walletAddress,
            fullName: user.fullName,
            email: user.email,
            status: user.status,
            registrationDate: user.registrationDate,
            rejectionReason: user.verificationDetails?.rejectionReason
          })),
          totalUsers: users.length
        }
      });
    } catch (error) {
      console.error('❌ Error getting users:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving users',
        error: error.message
      });
    }
  },

  // Get user documents for viewing
  getUserDocuments: async (req, res) => {
    try {
      const { userId } = req.params;
      
      console.log('📄 Fetching documents for user:', userId);
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const documents = {};
      user.documents.forEach(doc => {
        documents[doc.type] = {
          type: doc.type,
          uploadDate: doc.uploadDate,
          filename: doc.filename,
          url: `/api/documents/${userId}/${doc.type}`
        };
      });

      console.log('📄 Documents found:', Object.keys(documents));

      return res.status(200).json({
        success: true,
        data: documents
      });
    } catch (error) {
      console.error('❌ Error getting user documents:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving documents',
        error: error.message
      });
    }
  },

  // Upload documents
  uploadDocuments: async (req, res) => {
    try {
      const { walletAddress } = req.body;

      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          message: 'Wallet address is required'
        });
      }

      // Find user by wallet address
      const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user is already verified
      if (user.status === 'verified') {
        return res.status(400).json({
          success: false,
          message: 'User is already verified'
        });
      }

      // Process uploaded files
      const documents = [];

      if (req.files.governmentId) {
        documents.push({
          type: 'governmentId',
          filename: req.files.governmentId[0].filename,
          path: req.files.governmentId[0].path,
          uploadDate: new Date(),
          verified: false
        });
      }

      if (req.files.proofOfAddress) {
        documents.push({
          type: 'proofOfAddress',
          filename: req.files.proofOfAddress[0].filename,
          path: req.files.proofOfAddress[0].path,
          uploadDate: new Date(),
          verified: false
        });
      }

      if (req.files.selfieWithId) {
        documents.push({
          type: 'selfieWithId',
          filename: req.files.selfieWithId[0].filename,
          path: req.files.selfieWithId[0].path,
          uploadDate: new Date(),
          verified: false
        });
      }

      // Update user with documents
      user.documents = documents;
      user.status = 'pending';
      await user.save();

      res.json({
        success: true,
        message: 'Documents uploaded successfully',
        user: {
          walletAddress: user.walletAddress,
          status: user.status,
          documents: user.documents.map(doc => ({
            type: doc.type,
            uploadDate: doc.uploadDate
          }))
        }
      });

    } catch (error) {
      console.error('Error uploading documents:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading documents',
        error: error.message
      });
    }
  },

  // Verify user (admin only) - FIXED VERSION
  verifyUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const { verificationNotes } = req.body;
      const adminUsername = req.user?.username || req.admin?.username || 'admin';

      console.log('✅ Attempting to verify user:', userId);

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update user status
      user.status = 'verified';
      user.verificationDetails = {
        verifiedBy: adminUsername,
        verificationDate: new Date(),
        verificationNotes: verificationNotes || 'Verified by admin'
      };

      // Mark all documents as verified
      user.documents = user.documents.map(doc => ({
        ...doc.toObject ? doc.toObject() : doc,
        verified: true
      }));

      await user.save();

      console.log('✅ User verified successfully:', user.walletAddress);

      return res.status(200).json({
        success: true,
        message: 'User verified successfully',
        data: {
          userId: user._id,
          walletAddress: user.walletAddress,
          status: user.status
        }
      });

    } catch (error) {
      console.error('❌ Error verifying user:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verifying user',
        error: error.message
      });
    }
  },

  // Reject user (admin only)
  rejectUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const { rejectionReason } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      user.status = 'rejected';
      user.verificationDetails = {
        ...user.verificationDetails,
        rejectionReason: rejectionReason || 'Documents not satisfactory',
        rejectionDate: new Date()
      };

      await user.save();

      console.log('❌ User rejected:', userId);

      return res.status(200).json({
        success: true,
        message: 'User application rejected'
      });

    } catch (error) {
      console.error('❌ Error rejecting user:', error);
      return res.status(500).json({
        success: false,
        message: 'Error rejecting user',
        error: error.message
      });
    }
  },

  // Update blockchain verification status
  updateBlockchainStatus: async (req, res) => {
    try {
      const { userId } = req.params;
      const { blockchainVerified, blockchainTransactionHash } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      user.blockchainVerified = blockchainVerified;
      if (blockchainTransactionHash) {
        user.blockchainTransactionHash = blockchainTransactionHash;
      }

      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Blockchain status updated successfully'
      });

    } catch (error) {
      console.error('❌ Error updating blockchain status:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating blockchain status',
        error: error.message
      });
    }
  }
};

// Export the userController object with all functions
module.exports = userController;
