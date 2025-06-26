// setup-backend-complete.js
// Run this script to set up your complete backend

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up complete backend structure...\n');

// Create directory structure
const directories = [
  'controllers',
  'models',
  'routes',
  'middleware',
  'config',
  'uploads/kyc',
  'uploads/properties'
];

directories.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// 1. Create .env file
const envContent = `PORT=5000
MONGODB_URI=mongodb://localhost:27017/real-estate-nft
JWT_SECRET=your_jwt_secret_key_change_this_in_production
NODE_ENV=development`;

fs.writeFileSync('.env', envContent);
console.log('✅ Created .env file');

// 2. Create package.json if it doesn't exist
const packageJson = {
  "name": "real-estate-nft-backend",
  "version": "1.0.0",
  "description": "Backend for NFT Real Estate Platform",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "multer": "^1.4.5-lts.1",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
};

if (!fs.existsSync('package.json')) {
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  console.log('✅ Created package.json');
}

// 3. Create server.js
const serverContent = `require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5000;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/real-estate-nft', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  
  // Start server
  app.listen(PORT, () => {
    console.log(\`🚀 Server is running on port \${PORT}\`);
    console.log(\`📍 API Base URL: http://localhost:\${PORT}/api\`);
    console.log(\`🏥 Health check: http://localhost:\${PORT}/api/health\`);
  });
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});`;

fs.writeFileSync('server.js', serverContent);
console.log('✅ Created server.js');

// 4. Create app.js
const appContent = `const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const app = express();

// Import routes
const routes = require('./routes');

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Debug middleware
app.use((req, res, next) => {
  console.log(\`📍 \${req.method} \${req.url}\`);
  next();
});

// Mount API routes
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'NFT Real Estate API',
    status: 'running',
    version: '1.0.0'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

module.exports = app;`;

fs.writeFileSync('app.js', appContent);
console.log('✅ Created app.js');

// 5. Create models/User.js
const userModelContent = `const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  documents: [{
    type: {
      type: String,
      enum: ['governmentId', 'proofOfAddress', 'selfieWithId']
    },
    filename: String,
    path: String,
    uploadDate: {
      type: Date,
      default: Date.now
    },
    verified: {
      type: Boolean,
      default: false
    }
  }],
  verificationDetails: {
    verifiedBy: String,
    verificationDate: Date,
    verificationNotes: String,
    rejectionReason: String,
    rejectionDate: Date
  },
  blockchainVerified: {
    type: Boolean,
    default: false
  },
  blockchainTransactionHash: String,
  registrationDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);`;

fs.writeFileSync('models/User.js', userModelContent);
console.log('✅ Created models/User.js');

// 6. Create middleware/auth.js
const authMiddlewareContent = `const jwt = require('jsonwebtoken');

const verifyAdmin = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    req.user = decoded;
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

module.exports = { verifyAdmin };`;

fs.writeFileSync('middleware/auth.js', authMiddlewareContent);
console.log('✅ Created middleware/auth.js');

// 7. Create routes/index.js
const routesContent = `const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const adminController = require('../controllers/adminController');
const { verifyAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'kyc'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Public routes
router.post('/users/register', 
  upload.fields([
    { name: 'governmentId', maxCount: 1 },
    { name: 'proofOfAddress', maxCount: 1 },
    { name: 'selfieWithId', maxCount: 1 }
  ]), 
  userController.registerUser
);
router.get('/users/status/:walletAddress', userController.getUserStatus);
router.post('/admin/login', adminController.login);

// Protected routes
router.get('/users/all', verifyAdmin, userController.getAllUsers);
router.put('/users/verify/:userId', verifyAdmin, userController.verifyUser);
router.put('/users/reject/:userId', verifyAdmin, userController.rejectUser);
router.get('/admin/stats', verifyAdmin, adminController.getStats);

module.exports = router;`;

fs.writeFileSync('routes/index.js', routesContent);
console.log('✅ Created routes/index.js');

// 8. Create controllers/userController.js
const userControllerContent = `const User = require('../models/User');

const userController = {
  registerUser: async (req, res) => {
    try {
      const { walletAddress, fullName, email } = req.body;
      const files = req.files;
      
      console.log('Registration attempt:', { walletAddress, fullName, email });
      
      if (!walletAddress || !fullName || !email) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
      }

      if (!files || !files.governmentId || !files.proofOfAddress || !files.selfieWithId) {
        return res.status(400).json({
          success: false,
          message: 'All documents are required'
        });
      }

      const existingUser = await User.findOne({ 
        $or: [{ walletAddress: walletAddress.toLowerCase() }, { email }]
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists'
        });
      }

      const newUser = new User({
        walletAddress: walletAddress.toLowerCase(),
        fullName,
        email,
        status: 'pending',
        documents: [
          {
            type: 'governmentId',
            filename: files.governmentId[0].filename,
            path: files.governmentId[0].path
          },
          {
            type: 'proofOfAddress',
            filename: files.proofOfAddress[0].filename,
            path: files.proofOfAddress[0].path
          },
          {
            type: 'selfieWithId',
            filename: files.selfieWithId[0].filename,
            path: files.selfieWithId[0].path
          }
        ]
      });

      await newUser.save();
      
      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        userId: newUser._id
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error registering user',
        error: error.message
      });
    }
  },

  getUserStatus: async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      return res.json({
        success: true,
        data: {
          status: user.status,
          documents: user.documents,
          blockchainVerified: user.blockchainVerified
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error getting user status'
      });
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const users = await User.find().sort('-registrationDate');
      
      const pendingUsers = users.filter(u => u.status === 'pending');
      const verifiedUsers = users.filter(u => u.status === 'verified');
      const rejectedUsers = users.filter(u => u.status === 'rejected');
      
      return res.json({
        success: true,
        data: {
          pendingUsers,
          verifiedUsers,
          rejectedUsers
        }
      });
    } catch (error) {
      console.error('Error getting users:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving users'
      });
    }
  },

  verifyUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      user.status = 'verified';
      user.verificationDetails = {
        verifiedBy: req.admin.username,
        verificationDate: new Date()
      };
      
      await user.save();
      
      return res.json({
        success: true,
        message: 'User verified successfully'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error verifying user'
      });
    }
  },

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
        rejectionReason,
        rejectionDate: new Date()
      };
      
      await user.save();
      
      return res.json({
        success: true,
        message: 'User rejected'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error rejecting user'
      });
    }
  }
};

module.exports = userController;`;

fs.writeFileSync('controllers/userController.js', userControllerContent);
console.log('✅ Created controllers/userController.js');

// 9. Create controllers/adminController.js
const adminControllerContent = `const jwt = require('jsonwebtoken');
const User = require('../models/User');

const adminController = {
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password required'
        });
      }

      // Hardcoded admin credentials for development
      if (username === 'admin' && password === 'admin123') {
        const token = jwt.sign(
          { id: 'admin-1', username, role: 'admin' },
          process.env.JWT_SECRET || 'your_jwt_secret',
          { expiresIn: '24h' }
        );

        return res.json({
          success: true,
          token,
          admin: { id: 'admin-1', username, role: 'admin' }
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Login error'
      });
    }
  },

  getStats: async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();
      const verifiedUsers = await User.countDocuments({ status: 'verified' });
      const pendingUsers = await User.countDocuments({ status: 'pending' });
      const rejectedUsers = await User.countDocuments({ status: 'rejected' });
      
      return res.json({
        success: true,
        totalUsers,
        verifiedUsers,
        pendingUsers,
        rejectedUsers,
        mintedProperties: 0
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error getting stats'
      });
    }
  }
};

module.exports = adminController;`;

fs.writeFileSync('controllers/adminController.js', adminControllerContent);
console.log('✅ Created controllers/adminController.js');

console.log('\n✅ Backend setup complete!');
console.log('\nNext steps:');
console.log('1. Run: npm install');
console.log('2. Make sure MongoDB is running');
console.log('3. Run: npm run dev');
console.log('\nAdmin credentials:');
console.log('Username: admin');
console.log('Password: admin123');