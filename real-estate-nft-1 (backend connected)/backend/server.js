// server.js - Enhanced with better error handling and debugging
require('dotenv').config(); // Load environment variables
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');

const app = express();

// Environment variables
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/realestate';

// ENHANCED: Middleware with increased limits
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// CRITICAL: Increased payload limits to handle file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ENHANCED: Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  
  // Log file uploads
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    console.log('📎 File upload detected - Content-Length:', req.headers['content-length']);
  }
  
  next();
});

// Test route
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    database: MONGODB_URI.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ENHANCED: Health check endpoint
app.get('/api/health', (req, res) => {
  try {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB'
      },
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        name: mongoose.connection.name || 'Unknown'
      },
      version: '1.0.0'
    };
    
    console.log('✅ Health check requested - Server is healthy');
    res.status(200).json(health);
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ENHANCED: Property API request logging
app.use('/api/properties', (req, res, next) => {
  console.log('🏢 Property API Request:', {
    method: req.method,
    url: req.url,
    contentType: req.headers['content-type'],
    contentLength: req.headers['content-length'],
    userAgent: req.headers['user-agent']?.substring(0, 50) + '...',
    timestamp: new Date().toISOString()
  });
  next();
});

// API routes
app.use('/api', routes);

// ENHANCED: Comprehensive error handling middleware
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  
  console.error('🚨 Server Error Details:', {
    timestamp,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : 'Stack trace hidden in production',
    url: req.url,
    method: req.method,
    body: req.body ? Object.keys(req.body) : 'none',
    files: req.files ? (Array.isArray(req.files) ? req.files.length : Object.keys(req.files).length) : 'none',
    userAgent: req.headers['user-agent']?.substring(0, 50),
    contentType: req.headers['content-type'],
    contentLength: req.headers['content-length']
  });

  // Handle specific error types
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File too large',
      error: 'FILE_SIZE_LIMIT_EXCEEDED',
      maxSize: '50MB',
      timestamp
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request too large',
      error: 'REQUEST_TOO_LARGE',
      maxSize: '50MB',
      timestamp
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: err.message,
      details: err.errors,
      timestamp
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid data format',
      error: 'INVALID_FORMAT',
      details: err.message,
      timestamp
    });
  }

  // MongoDB errors
  if (err.name === 'MongoNetworkError') {
    return res.status(503).json({
      success: false,
      message: 'Database connection error',
      error: 'DATABASE_UNAVAILABLE',
      timestamp
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry',
      error: 'DUPLICATE_KEY',
      details: err.keyValue,
      timestamp
    });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      message: 'Too many files uploaded',
      error: 'FILE_COUNT_LIMIT_EXCEEDED',
      timestamp
    });
  }

  if (err.code === 'LIMIT_FIELD_KEY') {
    return res.status(400).json({
      success: false,
      message: 'Field name too long',
      error: 'FIELD_NAME_TOO_LONG',
      timestamp
    });
  }

  if (err.code === 'LIMIT_FIELD_VALUE') {
    return res.status(400).json({
      success: false,
      message: 'Field value too long',
      error: 'FIELD_VALUE_TOO_LONG',
      timestamp
    });
  }

  if (err.code === 'LIMIT_FIELD_COUNT') {
    return res.status(400).json({
      success: false,
      message: 'Too many fields',
      error: 'FIELD_COUNT_LIMIT_EXCEEDED',
      timestamp
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field',
      error: 'UNEXPECTED_FILE_FIELD',
      timestamp
    });
  }

  // JWT/Auth errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: 'INVALID_TOKEN',
      timestamp
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      error: 'TOKEN_EXPIRED',
      timestamp
    });
  }

  // Generic error response
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'SERVER_ERROR',
    timestamp,
    requestId: req.headers['x-request-id'] || 'none'
  });
});

// ENHANCED: Handle 404 for unmatched routes
app.use('*', (req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: 'NOT_FOUND',
    requestedUrl: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /api/health - Health check',
      'GET /test - Simple test endpoint',
      'POST /api/properties - Submit property',
      'GET /api/properties - Get all properties',
      'POST /api/user/register - User registration',
      'GET /api/user/status/:address - User status',
      'POST /api/admin/login - Admin login'
    ]
  });
});

// ENHANCED: Process error handlers for better debugging
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
  console.error('🔥 Server will exit...');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', {
    reason: reason,
    promise: promise,
    timestamp: new Date().toISOString()
  });
  console.error('🔥 Server will exit...');
  process.exit(1);
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('📊 MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('📊 MongoDB connection closed');
    process.exit(0);
  });
});

// ENHANCED: MongoDB connection with better error handling
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('==================================================');
  console.log('✅ Connected to MongoDB');
  console.log('📍 Database:', MONGODB_URI.includes('mongodb+srv') ? 'MongoDB Atlas ☁️' : 'Local MongoDB 💻');
  console.log('📊 Connection state:', mongoose.connection.readyState);
  console.log('==================================================');
  
  // Start server only after DB connection
  const server = app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 API available at http://localhost:${PORT}/api`);
    console.log(`📍 Test route: http://localhost:${PORT}/test`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📍 Debug routes: http://localhost:${PORT}/api/debug/routes`);
    console.log('==================================================');
  });

  // Handle server errors
  server.on('error', (error) => {
    console.error('❌ Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please use a different port.`);
      process.exit(1);
    }
  });

  // Monitor server connections
  server.on('connection', (socket) => {
    console.log('🔗 New connection established');
    socket.on('close', () => {
      console.log('🔗 Connection closed');
    });
  });
})
.catch(err => {
  console.error('==================================================');
  console.error('❌ MongoDB connection error:', err.message);
  console.error('==================================================');
  console.error('Possible issues:');
  console.error('1. Check your internet connection');
  console.error('2. Verify MongoDB Atlas credentials');
  console.error('3. Check IP whitelist in MongoDB Atlas');
  console.error('4. Ensure connection string is correct');
  console.error('5. Check if MongoDB service is running (local)');
  console.error('==================================================');
  process.exit(1);
});

// ENHANCED: MongoDB connection event handlers
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB');
});

// Monitor memory usage every 30 seconds
setInterval(() => {
  const memUsage = process.memoryUsage();
  const formatMB = (bytes) => Math.round(bytes / 1024 / 1024) + 'MB';
  
  console.log('🧠 Memory Usage:', {
    rss: formatMB(memUsage.rss),
    heapUsed: formatMB(memUsage.heapUsed),
    heapTotal: formatMB(memUsage.heapTotal),
    external: formatMB(memUsage.external)
  });
}, 30000);