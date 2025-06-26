// Add this to your routes/index.js or create a new file routes/documents.js

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { verifyAdmin } = require('../middleware/auth');

// Route to serve uploaded documents (admin only)
router.get('/documents/:userId/:documentType', verifyAdmin, async (req, res) => {
  try {
    const { userId, documentType } = req.params;
    
    // Get user from database
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Find the document
    const document = user.documents.find(doc => doc.type === documentType);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Get the file path
    let filePath;
    if (document.path) {
      // If full path is stored
      filePath = document.path;
    } else if (document.filename) {
      // If only filename is stored
      filePath = path.join(__dirname, '..', 'uploads', 'kyc', document.filename);
    } else {
      return res.status(404).json({
        success: false,
        message: 'Document file path not found'
      });
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      return res.status(404).json({
        success: false,
        message: 'Document file not found on server'
      });
    }
    
    // Get file extension to set correct content type
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
    }
    
    // Set headers for inline viewing (not download)
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${document.filename || documentType + ext}"`);
    
    // Send the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error serving document:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving document',
      error: error.message
    });
  }
});

// Alternative route using document ID
router.get('/document/:documentId', verifyAdmin, async (req, res) => {
  try {
    const { documentId } = req.params;
    
    // Find user with this document
    const User = require('../models/User');
    const user = await User.findOne({
      'documents._id': documentId
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Find the specific document
    const document = user.documents.id(documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Get the file path
    let filePath;
    if (document.path) {
      filePath = document.path;
    } else if (document.filename) {
      filePath = path.join(__dirname, '..', 'uploads', 'kyc', document.filename);
    }
    
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Document file not found'
      });
    }
    
    // Send file
    res.sendFile(filePath);
    
  } catch (error) {
    console.error('Error serving document:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving document'
    });
  }
});

module.exports = router;