const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'kyc');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Validate file type
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const mimeType = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimeType && extname) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, JPG, PNG, PDF allowed'));
    }
  }
});

// Public Routes
// User registration with KYC documents
router.post('/register', 
  upload.fields([
    { name: 'governmentId', maxCount: 1 },
    { name: 'proofOfAddress', maxCount: 1 },
    { name: 'selfieWithId', maxCount: 1 }
  ]), 
  userController.registerUser
);

// Get user verification status
router.get('/status/:walletAddress', userController.getUserStatus);

// Admin Routes (require authentication)
// Get all users
router.get('/all', authMiddleware.verifyAdmin, userController.getAllUsers);

// Get user documents
router.get('/:userId/documents', authMiddleware.verifyAdmin, userController.getUserDocuments);

// Verify user
router.put('/verify/:userId', authMiddleware.verifyAdmin, userController.verifyUser);

// Reject user
router.put('/reject/:userId', authMiddleware.verifyAdmin, userController.rejectUser);

// Update blockchain verification status
router.put('/:userId/blockchain-status', authMiddleware.verifyAdmin, userController.updateBlockchainStatus);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${error.message}`
    });
  } else if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  next();
});

module.exports = router;
