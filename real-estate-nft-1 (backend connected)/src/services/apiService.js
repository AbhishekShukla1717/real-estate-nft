// services/apiService.js - Enhanced with better error handling and debugging
import axios from 'axios';

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

console.log('🔧 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 second timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor for auth token and debugging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    const fullUrl = config.baseURL + config.url;
    console.log('🌐 API Request:', config.method?.toUpperCase(), fullUrl);
    
    // Log FormData details for debugging
    if (config.data instanceof FormData) {
      console.log('📄 FormData fields:');
      for (let [key, value] of config.data.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with better error details
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    const fullUrl = error.config?.baseURL + error.config?.url;
    console.error('❌ API Error:', error.response?.status, fullUrl);
    
    // Enhanced error logging
    if (error.response) {
      console.error('❌ Error Details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      console.error('❌ Network Error:', error.request);
    } else {
      console.error('❌ Request Setup Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// ===================
// USER API
// ===================
export const userApi = {
  // Register user with KYC documents
  registerUser: async (formData) => {
    try {
      console.log('📤 Registering user...');
      const response = await api.post('/user/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error.response?.data || { 
        success: false,
        message: error.message || 'Failed to register user' 
      };
    }
  },

  // Get all users (for admin)
  getAllUsers: async () => {
    try {
      const response = await api.get('/admin/all-users');
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        throw new Error('Authentication expired. Please login again.');
      }
      throw error.response?.data || { 
        success: false,
        message: error.message || 'Failed to fetch users' 
      };
    }
  },

  // Check user verification status
  checkUserStatus: async (walletAddress) => {
    try {
      console.log('🔍 Checking status for wallet:', walletAddress);
      const response = await api.get(`/user/status/${walletAddress}`);
      return response.data;
    } catch (error) {
      console.error('Error checking user status:', error);
      if (error.response?.status === 404) {
        return {
          success: false,
          data: null,
          message: 'User not found'
        };
      }
      throw error.response?.data || error;
    }
  },

  // Alias for checkUserStatus
  getStatus: async (walletAddress) => {
    return userApi.checkUserStatus(walletAddress);
  },

  // Get user documents
  getUserDocuments: async (userId) => {
    try {
      const response = await api.get(`/admin/user-documents/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user documents:', error);
      throw error.response?.data || { 
        success: false,
        message: 'Failed to fetch documents' 
      };
    }
  },

  // Verify user (admin only)
  verifyUser: async (userId, notes = '') => {
    try {
      const response = await api.post(`/admin/verify-user/${userId}`, { 
        verificationNotes: notes 
      });
      return response.data;
    } catch (error) {
      console.error('Error verifying user:', error);
      throw error.response?.data || { 
        success: false,
        message: error.message || 'Failed to verify user' 
      };
    }
  },

  // Reject user (admin only)
  rejectUser: async (userId, reason = '') => {
    try {
      const response = await api.post(`/admin/reject-user/${userId}`, { 
        rejectionReason: reason 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { 
        success: false,
        message: 'Failed to reject user' 
      };
    }
  },

  // Update blockchain verification status
  updateBlockchainStatus: async (userId, data) => {
    try {
      const response = await api.put(`/admin/blockchain-status/${userId}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { 
        success: false,
        message: 'Failed to update blockchain status' 
      };
    }
  }
};

// ===================
// ENHANCED PROPERTY API WITH BETTER ERROR HANDLING
// ===================
export const propertyApi = {
  // Get all properties with filtering
  getAllProperties: async (params = {}) => {
    try {
      const response = await api.get('/properties', { params });
      return response.data;
    } catch (error) {
      console.warn('⚠️ Properties API unavailable, returning empty list');
      return { 
        success: true,
        data: [],
        message: 'Properties API unavailable' 
      };
    }
  },

  // Get property by ID
  getPropertyById: async (id) => {
    try {
      const response = await api.get(`/properties/${id}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { success: false, message: 'Property not found' };
      }
      throw error.response?.data || { 
        success: false,
        message: 'Failed to fetch property' 
      };
    }
  },

  // Get properties by owner
  getPropertiesByOwner: async (ownerAddress) => {
    try {
      const response = await api.get(`/properties/owner/${ownerAddress}`);
      return response.data;
    } catch (error) {
      console.warn('⚠️ Owner properties API unavailable');
      return { 
        success: true,
        data: [],
        message: 'Owner properties API unavailable' 
      };
    }
  },

  // Get user properties (for My Properties page)
  getUserProperties: async (userAddress) => {
    try {
      const response = await api.get(`/properties/user/${userAddress}`);
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch user properties from API:', error);
      return { 
        success: false, 
        data: [], 
        message: 'Failed to fetch user properties' 
      };
    }
  },

  // Enhanced property submission with better error handling
  submitProperty: async (formData) => {
    try {
      console.log('📤 Submitting property...');
      console.log('🔍 API Base URL:', API_BASE_URL);
      
      // Enhanced FormData logging
      if (formData instanceof FormData) {
        console.log('📋 FormData validation:');
        let totalSize = 0;
        for (let [key, value] of formData.entries()) {
          if (value instanceof File) {
            totalSize += value.size;
            console.log(`  ${key}: File(${value.name}, ${(value.size / 1024 / 1024).toFixed(2)}MB, ${value.type})`);
            
            // Check file type
            if (!value.type.startsWith('image/')) {
              throw new Error(`Invalid file type for ${key}: ${value.type}. Only images are allowed.`);
            }
            
            // Check file size (10MB limit)
            if (value.size > 10 * 1024 * 1024) {
              throw new Error(`File ${value.name} is too large: ${(value.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 10MB.`);
            }
          } else {
            console.log(`  ${key}: "${value}" (${typeof value})`);
          }
        }
        console.log(`📊 Total upload size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
      }
      
      // Validate required fields before sending
      const requiredFields = ['name', 'description', 'physicalAddress', 'owner'];
      const missingFields = [];
      
      for (const field of requiredFields) {
        const value = formData.get(field);
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          missingFields.push(field);
        }
      }
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      // Validate wallet address format
      const ownerAddress = formData.get('owner');
      if (!/^0x[a-fA-F0-9]{40}$/.test(ownerAddress)) {
        throw new Error('Invalid wallet address format');
      }
      
      // Check if image file exists
      const imageFile = formData.get('images');
      if (!imageFile || !(imageFile instanceof File)) {
        throw new Error('Property image is required');
      }
      
      console.log('✅ FormData validation passed');
      console.log('📤 Sending request to:', `${API_BASE_URL}/properties`);
      
      // Create request config with increased timeouts and better error handling
      const requestConfig = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes for file uploads
        maxContentLength: 50 * 1024 * 1024, // 50MB
        maxBodyLength: 50 * 1024 * 1024, // 50MB
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            console.log(`📤 Upload progress: ${percentCompleted}%`);
          }
        }
      };
      
      // Make the request with detailed logging
      console.log('🚀 Making API request...');
      const startTime = Date.now();
      
      const response = await api.post('/properties', formData, requestConfig);
      
      const endTime = Date.now();
      console.log(`✅ Request completed in ${endTime - startTime}ms`);
      console.log('✅ Property submitted successfully:', response.data);
      
      return response.data;
      
    } catch (error) {
      console.error('❌ Property submission failed:', error);
      
      // Enhanced error analysis with more specific debugging
      if (error.response) {
        const { status, data, statusText, headers } = error.response;
        
        console.error('🔍 Server Response Details:', {
          status,
          statusText,
          data,
          headers: {
            'content-type': headers['content-type'],
            'content-length': headers['content-length']
          },
          url: error.config?.url,
          method: error.config?.method
        });
        
        // Handle specific HTTP status codes
        switch (status) {
          case 400:
            throw {
              success: false,
              message: data?.message || 'Invalid property data. Please check all fields.',
              details: data?.missingFields || data?.validationErrors || 'Bad Request',
              code: 'VALIDATION_ERROR'
            };
            
          case 401:
            throw {
              success: false,
              message: 'Authentication required. Please login.',
              details: 'Unauthorized',
              code: 'AUTH_ERROR'
            };
            
          case 403:
            throw {
              success: false,
              message: data?.message || 'Access denied. User may need KYC verification.',
              details: data?.needsVerification ? 'KYC_REQUIRED' : 'Forbidden',
              code: 'ACCESS_DENIED'
            };
            
          case 404:
            throw {
              success: false,
              message: 'API endpoint not found. Please check if the server is running correctly.',
              details: 'Not Found',
              code: 'ENDPOINT_NOT_FOUND'
            };
            
          case 413:
            throw {
              success: false,
              message: 'File too large. Please use a smaller image (max 10MB).',
              details: 'Payload Too Large',
              code: 'FILE_TOO_LARGE'
            };
            
          case 422:
            throw {
              success: false,
              message: data?.message || 'Validation failed. Please check your input.',
              details: data?.errors || data?.validationErrors || 'Unprocessable Entity',
              code: 'VALIDATION_FAILED'
            };
            
          case 500:
            console.error('🚨 500 Internal Server Error Details:', {
              serverMessage: data?.message,
              serverError: data?.error,
              serverStack: data?.stack,
              timestamp: data?.timestamp,
              requestId: headers['x-request-id'] || 'none'
            });
            
            throw {
              success: false,
              message: 'Server error occurred. Please try again or contact support if the problem persists.',
              details: data?.message || data?.error || 'Internal Server Error',
              serverError: data,
              code: 'SERVER_ERROR'
            };
            
          case 502:
            throw {
              success: false,
              message: 'Server temporarily unavailable. Please try again in a moment.',
              details: 'Bad Gateway',
              code: 'SERVER_UNAVAILABLE'
            };
            
          case 503:
            throw {
              success: false,
              message: 'Service temporarily unavailable. Server may be overloaded.',
              details: 'Service Unavailable',
              code: 'SERVICE_UNAVAILABLE'
            };
            
          default:
            throw {
              success: false,
              message: data?.message || `Server error (${status}). Please try again.`,
              details: data?.details || `HTTP ${status} - ${statusText}`,
              code: 'UNKNOWN_SERVER_ERROR'
            };
        }
      } else if (error.code === 'ECONNABORTED') {
        console.error('⏰ Request timeout details:', {
          timeout: error.config?.timeout,
          url: error.config?.url,
          method: error.config?.method
        });
        
        throw {
          success: false,
          message: 'Request timeout. Please check your connection and try again.',
          details: 'The server took too long to respond',
          code: 'TIMEOUT_ERROR'
        };
      } else if (error.request) {
        console.error('🌐 Network error details:', {
          readyState: error.request.readyState,
          status: error.request.status,
          statusText: error.request.statusText
        });
        
        throw {
          success: false,
          message: 'Cannot connect to server. Please check if the backend is running on port 5000.',
          details: 'Network connection failed',
          code: 'NETWORK_ERROR'
        };
      } else {
        console.error('⚙️ Request setup error:', error.message);
        
        throw {
          success: false,
          message: error.message || 'Failed to submit property',
          details: 'Request configuration error',
          code: 'REQUEST_ERROR'
        };
      }
    }
  },

  // Update property with NFT data (after minting)
  updatePropertyWithNFT: async (propertyId, nftData) => {
    try {
      const response = await api.put(`/properties/${propertyId}/nft`, nftData);
      return response.data;
    } catch (error) {
      console.warn('⚠️ NFT data update failed (non-critical):', error);
      return { 
        success: true, 
        message: 'NFT minted successfully (database update skipped)' 
      };
    }
  },

  // Update property listing status (for marketplace)
  updateListingStatus: async (propertyId, updateData) => {
    try {
      const response = await api.put(`/properties/${propertyId}/listing`, updateData);
      return response.data;
    } catch (error) {
      console.warn('API update failed (non-critical):', error);
      return { success: true, message: 'Update skipped - API unavailable' };
    }
  },

  // Record property transfer
  recordTransfer: async (propertyId, transferData) => {
    try {
      const response = await api.post(`/properties/${propertyId}/transfer`, transferData);
      return response.data;
    } catch (error) {
      console.warn('⚠️ Transfer recording failed (non-critical):', error);
      return { 
        success: true, 
        message: 'Transfer completed (database update skipped)' 
      };
    }
  },

  // Get pending properties (admin only)
  getPending: async () => {
    try {
      const response = await api.get('/admin/properties/pending');
      return {
        success: true,
        data: response.data.properties || []
      };
    } catch (error) {
      console.warn('Failed to fetch pending properties:', error);
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  },
  
  // Approve property (admin only)
  approve: async (propertyId, notes = '') => {
    try {
      const response = await api.put(`/admin/properties/${propertyId}/approve`, {
        approvalNotes: notes
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { 
        success: false,
        message: 'Failed to approve property' 
      };
    }
  },
  
  // Reject property (admin only)
  reject: async (propertyId, reason = '') => {
    try {
      const response = await api.put(`/admin/properties/${propertyId}/reject`, {
        rejectionReason: reason
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { 
        success: false,
        message: 'Failed to reject property' 
      };
    }
  }
};

// ===================
// ENHANCED TRANSACTION API WITH NOTIFICATIONS
// ===================
export const transactionApi = {
  // Record a new transaction with notification support
  record: async (transactionData) => {
    try {
      const enhancedData = {
        ...transactionData,
        timestamp: new Date().toISOString(),
        notificationRead: false, // Default to unread for new transactions
        buyerAddress: transactionData.to,
        sellerAddress: transactionData.from
      };
      
      // Try both endpoints for compatibility
      let response;
      try {
        response = await api.post('/transactions/record', enhancedData);
      } catch (error) {
        // Fallback to regular transactions endpoint
        response = await api.post('/transactions', enhancedData);
      }
      
      // Dispatch custom event for real-time notification updates
      if (transactionData.type === 'sale') {
        window.dispatchEvent(new CustomEvent('newPropertySale', {
          detail: {
            sellerAddress: transactionData.from,
            buyerAddress: transactionData.to,
            propertyName: transactionData.propertyName,
            price: transactionData.value,
            txHash: transactionData.txHash
          }
        }));
      }
      
      return response.data;
    } catch (error) {
      console.error('Error recording transaction:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all transactions with filtering
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/transactions', { params });
      return response.data;
    } catch (error) {
      console.warn('⚠️ Transactions API unavailable');
      return { 
        success: true,
        data: [],
        message: 'Transactions API unavailable' 
      };
    }
  },
  
  // Get transactions by property
  getByProperty: async (propertyId) => {
    try {
      const response = await api.get(`/transactions/property/${propertyId}`);
      return response.data;
    } catch (error) {
      console.warn('⚠️ Property transactions API unavailable');
      return { 
        success: true,
        data: [],
        message: 'Property transactions API unavailable' 
      };
    }
  },

  // Get transactions by user (enhanced with notification data)
  getByUser: async (address, type = null) => {
    try {
      const params = type ? { type } : {};
      const response = await api.get(`/transactions/user/${address}`, { params });
      return response.data;
    } catch (error) {
      console.warn('⚠️ User transactions API unavailable');
      return { 
        success: true,
        data: [],
        message: 'User transactions API unavailable' 
      };
    }
  },

  // Get user transactions (alias for getByUser for consistency)
  getUserTransactions: async (address) => {
    return transactionApi.getByUser(address);
  },

  // Get sale notifications for a seller
  getSellerNotifications: async (sellerAddress) => {
    try {
      const response = await api.get(`/transactions/notifications/${sellerAddress}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching seller notifications:', error);
      return { success: false, data: [], error: error.message };
    }
  },

  // Mark notification as read
  markNotificationAsRead: async (transactionId) => {
    try {
      // Try the specific notification endpoint first
      let response;
      try {
        response = await api.put(`/transactions/notification/${transactionId}/read`, {
          notificationRead: true
        });
      } catch (error) {
        // Fallback to patch method
        response = await api.patch(`/transactions/${transactionId}/read`, {
          notificationRead: true
        });
      }
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  },

  // Create test data
  createTestData: async (sellerAddress) => {
    try {
      console.log('🧪 Creating test data for:', sellerAddress);
      const response = await api.post('/transactions/test/create', { sellerAddress });
      return response.data;
    } catch (error) {
      console.error('❌ Error creating test data:', error);
      throw error;
    }
  },

  // Clear all test data
  clearAllData: async () => {
    try {
      console.log('🗑️ Clearing all transaction data...');
      const response = await api.delete('/transactions/test/clear');
      return response.data;
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      throw error;
    }
  },

  // Debug endpoint to see all transactions
  debugTransactions: async () => {
    try {
      console.log('🔍 Fetching debug info...');
      const response = await api.get('/transactions/debug/all');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching debug info:', error);
      throw error;
    }
  },

  // Get unread notifications count
  getUnreadNotificationsCount: async (userAddress) => {
    try {
      const response = await api.get(`/transactions/notifications/${userAddress}/unread-count`);
      return response.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return { success: false, count: 0, error: error.message };
    }
  },

  // Get transaction by hash
  getByHash: async (hash) => {
    try {
      const response = await api.get(`/transactions/hash/${hash}`);
      return response.data;
    } catch (error) {
      console.warn('⚠️ Transaction hash lookup unavailable');
      return { 
        success: false,
        message: 'Transaction hash lookup unavailable' 
      };
    }
  },

  // Update transaction status
  updateStatus: async (hash, statusData) => {
    try {
      const response = await api.put(`/transactions/${hash}/status`, statusData);
      return response.data;
    } catch (error) {
      console.warn('⚠️ Transaction status update failed (non-critical)');
      return { 
        success: true,
        message: 'Transaction completed (status update skipped)' 
      };
    }
  },

  // Get transaction statistics (admin only)
  getStats: async (period = '30d') => {
    try {
      const response = await api.get('/admin/transactions/stats', { 
        params: { period } 
      });
      return response.data;
    } catch (error) {
      console.warn('⚠️ Transaction stats unavailable');
      return { 
        success: true,
        data: {},
        message: 'Transaction stats unavailable' 
      };
    }
  },

  // Get user portfolio statistics
  getUserStats: async (walletAddress) => {
    try {
      const response = await api.get(`/transactions/stats/${walletAddress}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return { success: false, data: {}, error: error.message };
    }
  },

  // Get recent market activity
  getMarketActivity: async (limit = 10) => {
    try {
      const response = await api.get('/transactions/market-activity', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching market activity:', error);
      return { success: false, data: [], error: error.message };
    }
  }
};

// ===================
// BLOCKCHAIN INTEGRATION API
// ===================
export const blockchainApi = {
  // Record NFT minting
  recordMint: async (mintData) => {
    try {
      const response = await api.post('/blockchain/mint', mintData);
      return response.data;
    } catch (error) {
      console.warn('⚠️ Mint recording failed (non-critical)');
      return { 
        success: true,
        message: 'NFT minted successfully (database update skipped)' 
      };
    }
  },

  // Record marketplace transaction
  recordMarketplaceTransaction: async (transactionData) => {
    try {
      const response = await api.post('/blockchain/marketplace-transaction', transactionData);
      return response.data;
    } catch (error) {
      console.warn('⚠️ Marketplace transaction recording failed (non-critical)');
      return { 
        success: true,
        message: 'Transaction completed (database update skipped)' 
      };
    }
  },

  // Record property registry transaction
  recordPropertyRegistry: async (registryData) => {
    try {
      const response = await api.post('/blockchain/property-registry', registryData);
      return response.data;
    } catch (error) {
      console.warn('⚠️ Property registry recording failed (non-critical)');
      return { 
        success: true,
        message: 'Registry updated successfully (database update skipped)' 
      };
    }
  }
};

// ===================
// ADMIN API
// ===================
export const adminApi = {
  login: async (credentials) => {
    try {
      console.log('🔐 Admin login attempt with:', credentials.username);
      const response = await api.post('/admin/login', credentials);
      
      if (response.data.success && response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminUser', JSON.stringify(response.data.admin));
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        console.log('✅ Admin login successful');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Admin login error:', error);
      throw error.response?.data || { 
        success: false,
        message: error.message || 'Login failed' 
      };
    }
  },

  isLoggedIn: () => {
    const token = localStorage.getItem('adminToken');
    const admin = localStorage.getItem('adminUser');
    const isLoggedIn = !!(token && admin);
    console.log('🔍 Admin login check:', isLoggedIn);
    return isLoggedIn;
  },
  
  logout: () => {
    console.log('👋 Admin logout');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    delete api.defaults.headers.common['Authorization'];
  },
  
  getStats: async () => {
    try {
      const response = await api.get('/admin/stats');
      return {
        success: true,
        stats: response.data
      };
    } catch (error) {
      if (error.response?.status === 401) {
        adminApi.logout();
        throw new Error('Authentication expired. Please login again.');
      }
      console.warn('Stats API error:', error);
      return {
        success: false,
        stats: {
          totalUsers: 0,
          verifiedUsers: 0,
          pendingUsers: 0,
          mintedProperties: 0
        },
        error: error.message
      };
    }
  },

  // Get current admin data
  getCurrentAdmin: () => {
    try {
      const adminData = localStorage.getItem('adminUser');
      return adminData ? JSON.parse(adminData) : null;
    } catch (error) {
      console.error('Error parsing admin data:', error);
      return null;
    }
  },

  // Get stored token
  getToken: () => {
    return localStorage.getItem('adminToken');
  }
};

// ===================
// UTILITY FUNCTIONS
// ===================

// Enhanced API connection test - REQUIRED BY APP.JS
export const testApiConnection = async () => {
  try {
    console.log('🔍 Testing API connection...');
    const response = await api.get('/health');
    console.log('✅ API connection test successful:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ API connection test failed:', error);
    return { 
      success: false, 
      error: error.message,
      status: error.response?.status 
    };
  }
};

// Helper function to handle API errors consistently
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  if (error.response) {
    // Server responded with error status
    return error.response.data?.message || defaultMessage;
  } else if (error.request) {
    // Request was made but no response received
    return 'Network error: Unable to connect to server';
  } else {
    // Something else happened
    return error.message || defaultMessage;
  }
};

// Helper function to format blockchain addresses
export const formatAddress = (address) => {
  if (!address) return 'Unknown';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Helper function to format blockchain transaction hashes
export const formatTxHash = (hash) => {
  if (!hash) return 'Unknown';
  return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
};

// Helper function to format ETH amounts
export const formatETH = (amount) => {
  if (!amount) return '0 ETH';
  const parsed = parseFloat(amount);
  return `${parsed.toFixed(4)} ETH`;
};

// Enhanced debug function for troubleshooting
export const debugApiCall = async (endpoint, method = 'GET', data = null) => {
  try {
    console.log(`🔍 Debug API Call: ${method} ${endpoint}`);
    
    const config = { method: method.toLowerCase() };
    if (data) {
      config.data = data;
      if (data instanceof FormData) {
        config.headers = { 'Content-Type': 'multipart/form-data' };
      }
    }
    
    const response = await api(endpoint, config);
    console.log('✅ Debug Response:', response.status, response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Debug Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return { success: false, error: error.response?.data || error.message };
  }
};

// ===================
// ENHANCED DEBUGGING TOOLS
// ===================

// Test API health specifically
export const testApiHealth = async () => {
  try {
    console.log('🔍 Testing API health...');
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📊 Health check response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API health check successful:', data);
      return { success: true, data };
    } else {
      console.error('❌ API health check failed:', response.status);
      return { success: false, status: response.status };
    }
  } catch (error) {
    console.error('❌ Health check error:', error);
    return { success: false, error: error.message };
  }
};

// Test property submission with minimal data
export const testPropertySubmission = async (testWalletAddress = '0x1234567890123456789012345678901234567890') => {
  try {
    console.log('🧪 Testing property submission with minimal data...');
    
    // Create minimal test data
    const formData = new FormData();
    formData.append('name', 'Test Property');
    formData.append('description', 'This is a test property for debugging');
    formData.append('physicalAddress', 'Test Address, Test City');
    formData.append('owner', testWalletAddress);
    formData.append('propertyType', 'Residential');
    formData.append('areaInSqFt', '1000');
    formData.append('price', '100000');
    
    // Create a small test image (1x1 pixel PNG)
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 1, 1);
    
    // Convert canvas to blob
    const testBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const testFile = new File([testBlob], 'test-image.png', { type: 'image/png' });
    formData.append('images', testFile);
    
    console.log('📤 Submitting test property...');
    const result = await propertyApi.submitProperty(formData);
    console.log('✅ Test submission successful:', result);
    return { success: true, data: result };
    
  } catch (error) {
    console.error('❌ Test submission failed:', error);
    return { success: false, error };
  }
};

// Check server status and logs
export const checkServerStatus = async () => {
  const checks = {
    health: await testApiHealth(),
    properties: null,
    users: null,
    database: null
  };
  
  // Test properties endpoint
  try {
    console.log('🔍 Testing properties endpoint...');
    const propertiesResponse = await api.get('/properties');
    checks.properties = { success: true, count: propertiesResponse.data?.data?.length || 0 };
  } catch (error) {
    checks.properties = { success: false, error: error.message };
  }
  
  // Test users endpoint (if available)
  try {
    console.log('🔍 Testing users endpoint...');
    const usersResponse = await api.get('/users');
    checks.users = { success: true, count: usersResponse.data?.data?.length || 0 };
  } catch (error) {
    checks.users = { success: false, error: error.message };
  }
  
  console.log('📊 Server status check results:', checks);
  return checks;
};

// Memory and performance monitoring
export const monitorApiPerformance = () => {
  const performanceData = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    connection: navigator.connection ? {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt
    } : 'unknown',
    memory: performance.memory ? {
      usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
      totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
      jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
    } : 'unknown'
  };
  
  console.log('📊 Client-side performance data:', performanceData);
  return performanceData;
};

// Enhanced error reporter
export const reportError = async (error, context = {}) => {
  const errorReport = {
    timestamp: new Date().toISOString(),
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    },
    context,
    browser: {
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    },
    performance: monitorApiPerformance()
  };
  
  console.error('📋 Error Report:', errorReport);
  
  // You could send this to your server for logging
  try {
    await api.post('/debug/error-report', errorReport);
  } catch (reportingError) {
    console.warn('⚠️ Failed to send error report to server:', reportingError.message);
  }
  
  return errorReport;
};

// Comprehensive debug suite
export const runDebugSuite = async () => {
  console.log('🔧 Running comprehensive debug suite...');
  
  const results = {
    timestamp: new Date().toISOString(),
    apiHealth: await testApiHealth(),
    serverStatus: await checkServerStatus(),
    performance: monitorApiPerformance()
  };
  
  // Test with different wallet addresses
  const testAddresses = [
    '0x1234567890123456789012345678901234567890',
    '0xAbCdEf1234567890123456789012345678901234'
  ];
  
  results.propertyTests = {};
  for (const address of testAddresses) {
    try {
      console.log(`🧪 Testing with address: ${address}`);
      results.propertyTests[address] = await testPropertySubmission(address);
    } catch (error) {
      results.propertyTests[address] = { success: false, error: error.message };
    }
  }
  
  console.log('📊 Debug suite results:', results);
  return results;
};

// Quick fix suggestions based on common issues
export const getSuggestedFixes = (error) => {
  const suggestions = [];
  
  if (error?.code === 'NETWORK_ERROR') {
    suggestions.push('Check if the backend server is running on port 5000');
    suggestions.push('Verify CORS is properly configured on the server');
    suggestions.push('Check firewall/antivirus settings');
  }
  
  if (error?.code === 'SERVER_ERROR') {
    suggestions.push('Check server console logs for detailed error information');
    suggestions.push('Verify database connection');
    suggestions.push('Check server memory usage');
    suggestions.push('Restart the backend server');
  }
  
  if (error?.code === 'FILE_TOO_LARGE') {
    suggestions.push('Reduce image file size to under 10MB');
    suggestions.push('Compress the image before uploading');
    suggestions.push('Check server upload limits');
  }
  
  if (error?.code === 'TIMEOUT_ERROR') {
    suggestions.push('Check internet connection speed');
    suggestions.push('Try uploading a smaller image');
    suggestions.push('Increase server timeout settings');
  }
  
  return suggestions;
};

// ===================
// EXPORT ALL SERVICES
// ===================

const ApiService = {
  ...userApi,
  ...propertyApi,
  ...transactionApi,
  ...blockchainApi,
  ...adminApi,
  testApiConnection,
  testApiHealth,
  testPropertySubmission,
  checkServerStatus,
  monitorApiPerformance,
  reportError,
  runDebugSuite,
  getSuggestedFixes,
  handleApiError,
  formatAddress,
  formatTxHash,
  formatETH,
  debugApiCall
};

export default ApiService;