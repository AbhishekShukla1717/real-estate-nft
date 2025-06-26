// models/PropertyModel.js - Enhanced with Escrow Integration
const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  // Unique property identifier (used by controller)
  propertyId: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Basic property info
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  
  // Address fields - supporting both old and new field names
  location: {
    type: String,
    required: false // Made optional since controller uses physicalAddress
  },
  physicalAddress: {
    type: String,
    required: true // This is what the controller expects
  },
  
  propertyType: {
    type: String,
    required: true,
    enum: ['Residential', 'Commercial', 'Industrial', 'Land', 'Villa', 'Apartment', 'house', 'apartment', 'land', 'commercial', 'other'],
    default: 'Residential'
  },
  
  // Area field - supporting both formats
  area: {
    type: Number,
    required: false
  },
  areaInSqFt: {
    type: Number,
    required: false,
    default: 1000
  },
  
  // Price fields - supporting both formats
  price: {
    type: mongoose.Schema.Types.Mixed, // Can be String or Number
    required: false
  },
  
  // Images - supporting both array formats (controller sends objects, not strings)
  images: [{
    filename: {
      type: String,
      required: false
    },
    originalName: {
      type: String,
      required: false
    },
    path: {
      type: String,
      required: false
    },
    uploadDate: {
      type: Date,
      required: false
    },
    // Legacy support for string-based images
    type: {
      type: String,
      required: false
    }
  }],
  
  documents: [{
    name: String,
    filename: String,
    path: String,
    url: String,
    uploadedAt: Date,
    uploadDate: Date // Alternative field name
  }],
  
  // Owner info - supporting multiple formats
  owner: {
    type: mongoose.Schema.Types.Mixed, // Can be ObjectId or String
    required: true
  },
  ownerAddress: {
    type: String,
    required: false,
    lowercase: true
  },
  currentOwner: {
    type: String,
    lowercase: true
  },
  
  // NFT info
  tokenId: {
    type: String,
    unique: true,
    sparse: true
  },
  contractAddress: {
    type: String
  },
  isMinted: {
    type: Boolean,
    default: false
  },
  mintTransactionHash: {
    type: String
  },
  transactionHash: {
    type: String // Alternative field name used by controller
  },
  tokenURI: {
    type: String
  },
  mintedAt: {
    type: Date
  },
  mintDate: {
    type: Date // Alternative field name used by controller
  },
  blockNumber: {
    type: Number
  },
  gasUsed: {
    type: String
  },
  
  // Listing info
  isListed: {
    type: Boolean,
    default: false
  },
  listingPrice: {
    type: String
  },
  listingTxHash: {
    type: String
  },
  marketplaceTransactionHash: {
    type: String // Used by controller
  },
  listedAt: {
    type: Date
  },
  listingDate: {
    type: Date // Alternative field name used by controller
  },
  cancelledAt: {
    type: Date
  },
  
  // Sale info
  lastSalePrice: {
    type: String
  },
  lastSaleTxHash: {
    type: String
  },
  lastSaleDate: {
    type: Date
  },
  lastTransferDate: {
    type: Date // Used by controller
  },
  
  // ENHANCED: Escrow Information
  escrowInfo: {
    // Current active escrow (if any)
    hasActiveEscrow: {
      type: Boolean,
      default: false
    },
    currentEscrowBuyer: {
      type: String,
      lowercase: true
    },
    currentEscrowPrice: {
      type: String // In Wei
    },
    currentEscrowFee: {
      type: String // In Wei
    },
    currentEscrowStatus: {
      type: String,
      enum: ['PENDING', 'FUNDED', 'COMPLETED', 'CANCELLED', 'REFUNDED'],
      default: null
    },
    escrowCreatedAt: {
      type: Date
    },
    escrowFundsDeposited: {
      type: Boolean,
      default: false
    },
    escrowContractAddress: {
      type: String,
      default: "0x32f99155646d147b8A4846470b64a96dD9cBa414"
    }
  },
  
  // ENHANCED: Escrow Transaction History
  escrowHistory: [{
    buyer: {
      type: String,
      lowercase: true,
      required: true
    },
    seller: {
      type: String,
      lowercase: true,
      required: true
    },
    price: {
      type: String, // In Wei
      required: true
    },
    fee: {
      type: String, // In Wei
      required: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'FUNDED', 'COMPLETED', 'CANCELLED', 'REFUNDED'],
      required: true
    },
    fundsDeposited: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      required: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    },
    transactionHashes: {
      creation: String,
      funding: String,
      completion: String,
      cancellation: String,
      refund: String
    },
    notes: String
  }],
  
  // ENHANCED: Purchase Options
  purchaseOptions: {
    directPurchaseEnabled: {
      type: Boolean,
      default: true
    },
    escrowPurchaseEnabled: {
      type: Boolean,
      default: true
    },
    minimumEscrowAmount: {
      type: String, // In Wei
      default: "0"
    },
    maxEscrowDuration: {
      type: Number, // In days
      default: 30
    }
  },
  
  // Status - supporting all status values used by controller
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'minted'],
    default: 'pending'
  },
  statusUpdatedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  
  // Approval/Rejection fields used by controller
  approvalDate: {
    type: Date
  },
  approvalNotes: {
    type: String
  },
  rejectionDate: {
    type: Date
  },
  
  // Submission tracking
  submissionDate: {
    type: Date,
    default: Date.now
  },
  
  // ENHANCED: Transfer history with escrow support
  previousOwners: [{
    address: {
      type: String,
      lowercase: true
    },
    transferDate: Date,
    transactionHash: String,
    price: String,
    transferMethod: {
      type: String,
      enum: ['direct', 'escrow', 'mint', 'admin'],
      default: 'direct'
    },
    escrowId: String // Reference to escrow transaction if applicable
  }],
  
  // ENHANCED: Transaction Analytics
  transactionMetrics: {
    totalSales: {
      type: Number,
      default: 0
    },
    totalVolume: {
      type: String, // Total volume in Wei
      default: "0"
    },
    averageSalePrice: {
      type: String, // In Wei
      default: "0"
    },
    lastMarketActivity: {
      type: Date
    },
    escrowUsageCount: {
      type: Number,
      default: 0
    },
    directSalesCount: {
      type: Number,
      default: 0
    },
    cancelledEscrowsCount: {
      type: Number,
      default: 0
    }
  },
  
  // ENHANCED: Market Data
  marketData: {
    currentMarketValue: {
      type: String, // Estimated value in Wei
      default: "0"
    },
    priceHistory: [{
      price: String, // In Wei
      date: Date,
      source: {
        type: String,
        enum: ['listing', 'sale', 'escrow', 'valuation']
      }
    }],
    lastValuationDate: Date,
    appreciationRate: Number // Percentage
  },
  
  // Additional metadata
  attributes: [{
    trait_type: String,
    value: mongoose.Schema.Types.Mixed
  }],
  
  // ENHANCED: Compliance and Legal
  compliance: {
    kycRequired: {
      type: Boolean,
      default: true
    },
    legalDocumentsVerified: {
      type: Boolean,
      default: false
    },
    titleClearanceStatus: {
      type: String,
      enum: ['pending', 'clear', 'disputed', 'under_review'],
      default: 'pending'
    },
    regulatoryApprovals: [{
      authority: String,
      approvalNumber: String,
      approvalDate: Date,
      expiryDate: Date,
      status: {
        type: String,
        enum: ['valid', 'expired', 'pending', 'revoked']
      }
    }]
  },
  
  // ENHANCED: Smart Contract Integration
  smartContractData: {
    marketplaceContract: {
      type: String,
      default: "0x6f38283c92186AEc00FFD196F444Ed0773919FCE"
    },
    escrowContract: {
      type: String,
      default: "0x32f99155646d147b8A4846470b64a96dD9cBa414"
    },
    kycContract: String,
    lastBlockchainSync: Date,
    pendingTransactions: [{
      type: {
        type: String,
        enum: ['mint', 'list', 'sale', 'escrow_create', 'escrow_fund', 'escrow_complete', 'transfer']
      },
      txHash: String,
      status: {
        type: String,
        enum: ['pending', 'confirmed', 'failed']
      },
      submittedAt: Date,
      confirmedAt: Date
    }]
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// ENHANCED: Pre-save middleware with escrow handling
propertySchema.pre('save', function(next) {
  // Update timestamp
  this.updatedAt = new Date();
  
  // Map location to physicalAddress if physicalAddress is missing
  if (!this.physicalAddress && this.location) {
    this.physicalAddress = this.location;
  }
  
  // Map physicalAddress to location if location is missing
  if (!this.location && this.physicalAddress) {
    this.location = this.physicalAddress;
  }
  
  // Map area fields
  if (!this.areaInSqFt && this.area) {
    this.areaInSqFt = this.area;
  }
  if (!this.area && this.areaInSqFt) {
    this.area = this.areaInSqFt;
  }
  
  // Set owner as string if it's an ObjectId
  if (typeof this.owner === 'string') {
    this.ownerAddress = this.owner.toLowerCase();
    this.currentOwner = this.owner.toLowerCase();
  }
  
  // Ensure submissionDate exists
  if (!this.submissionDate) {
    this.submissionDate = this.createdAt || new Date();
  }
  
  // Initialize escrowInfo if not present
  if (!this.escrowInfo) {
    this.escrowInfo = {
      hasActiveEscrow: false,
      escrowContractAddress: "0x32f99155646d147b8A4846470b64a96dD9cBa414"
    };
  }
  
  // Initialize purchaseOptions if not present
  if (!this.purchaseOptions) {
    this.purchaseOptions = {
      directPurchaseEnabled: true,
      escrowPurchaseEnabled: true,
      minimumEscrowAmount: "0",
      maxEscrowDuration: 30
    };
  }
  
  // Initialize transactionMetrics if not present
  if (!this.transactionMetrics) {
    this.transactionMetrics = {
      totalSales: 0,
      totalVolume: "0",
      averageSalePrice: "0",
      escrowUsageCount: 0,
      directSalesCount: 0,
      cancelledEscrowsCount: 0
    };
  }
  
  // Initialize compliance if not present
  if (!this.compliance) {
    this.compliance = {
      kycRequired: true,
      legalDocumentsVerified: false,
      titleClearanceStatus: 'pending'
    };
  }
  
  // Initialize smartContractData if not present
  if (!this.smartContractData) {
    this.smartContractData = {
      marketplaceContract: "0x6f38283c92186AEc00FFD196F444Ed0773919FCE",
      escrowContract: "0x32f99155646d147b8A4846470b64a96dD9cBa414"
    };
  }
  
  next();
});

// ENHANCED: Instance methods for escrow management
propertySchema.methods.addEscrowTransaction = function(escrowData) {
  // Add to escrow history
  this.escrowHistory.push({
    buyer: escrowData.buyer.toLowerCase(),
    seller: escrowData.seller.toLowerCase(),
    price: escrowData.price,
    fee: escrowData.fee,
    status: escrowData.status,
    fundsDeposited: escrowData.fundsDeposited || false,
    createdAt: escrowData.createdAt || new Date(),
    transactionHashes: escrowData.transactionHashes || {}
  });
  
  // Update current escrow info if it's active
  if (['PENDING', 'FUNDED'].includes(escrowData.status)) {
    this.escrowInfo.hasActiveEscrow = true;
    this.escrowInfo.currentEscrowBuyer = escrowData.buyer.toLowerCase();
    this.escrowInfo.currentEscrowPrice = escrowData.price;
    this.escrowInfo.currentEscrowFee = escrowData.fee;
    this.escrowInfo.currentEscrowStatus = escrowData.status;
    this.escrowInfo.escrowCreatedAt = escrowData.createdAt || new Date();
    this.escrowInfo.escrowFundsDeposited = escrowData.fundsDeposited || false;
  }
  
  // Update metrics
  this.transactionMetrics.escrowUsageCount += 1;
  
  return this.save();
};

propertySchema.methods.updateEscrowStatus = function(newStatus, additionalData = {}) {
  // Update current escrow info
  if (this.escrowInfo.hasActiveEscrow) {
    this.escrowInfo.currentEscrowStatus = newStatus;
    
    if (additionalData.fundsDeposited !== undefined) {
      this.escrowInfo.escrowFundsDeposited = additionalData.fundsDeposited;
    }
    
    // If escrow is completed or cancelled, clear active escrow
    if (['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(newStatus)) {
      this.escrowInfo.hasActiveEscrow = false;
      
      if (newStatus === 'COMPLETED') {
        // Update ownership if completed
        if (this.escrowInfo.currentEscrowBuyer) {
          this.previousOwners.push({
            address: this.currentOwner,
            transferDate: new Date(),
            price: this.escrowInfo.currentEscrowPrice,
            transferMethod: 'escrow'
          });
          
          this.currentOwner = this.escrowInfo.currentEscrowBuyer;
          this.ownerAddress = this.escrowInfo.currentEscrowBuyer;
          
          // Update transaction metrics
          this.transactionMetrics.totalSales += 1;
          this.transactionMetrics.directSalesCount += 1;
          
          // Update volume
          const currentVolume = BigInt(this.transactionMetrics.totalVolume || "0");
          const salePrice = BigInt(this.escrowInfo.currentEscrowPrice || "0");
          this.transactionMetrics.totalVolume = (currentVolume + salePrice).toString();
          
          // Update average price
          if (this.transactionMetrics.totalSales > 0) {
            const avgPrice = BigInt(this.transactionMetrics.totalVolume) / BigInt(this.transactionMetrics.totalSales);
            this.transactionMetrics.averageSalePrice = avgPrice.toString();
          }
          
          // Update last sale info
          this.lastSalePrice = this.escrowInfo.currentEscrowPrice;
          this.lastSaleDate = new Date();
          this.lastTransferDate = new Date();
        }
      }
      
      if (newStatus === 'CANCELLED') {
        this.transactionMetrics.cancelledEscrowsCount += 1;
      }
    }
  }
  
  // Update escrow history
  const latestEscrow = this.escrowHistory[this.escrowHistory.length - 1];
  if (latestEscrow && latestEscrow.status !== newStatus) {
    latestEscrow.status = newStatus;
    latestEscrow.updatedAt = new Date();
    
    if (newStatus === 'COMPLETED') {
      latestEscrow.completedAt = new Date();
    }
    
    if (additionalData.transactionHash) {
      const txType = newStatus === 'FUNDED' ? 'funding' : 
                    newStatus === 'COMPLETED' ? 'completion' :
                    newStatus === 'CANCELLED' ? 'cancellation' : 'refund';
      latestEscrow.transactionHashes[txType] = additionalData.transactionHash;
    }
  }
  
  this.transactionMetrics.lastMarketActivity = new Date();
  
  return this.save();
};

propertySchema.methods.addPriceHistory = function(price, source = 'listing') {
  if (!this.marketData) {
    this.marketData = { priceHistory: [] };
  }
  
  this.marketData.priceHistory.push({
    price: price,
    date: new Date(),
    source: source
  });
  
  // Keep only last 50 price points
  if (this.marketData.priceHistory.length > 50) {
    this.marketData.priceHistory = this.marketData.priceHistory.slice(-50);
  }
  
  return this.save();
};

propertySchema.methods.updateMarketListing = function(price, isListed = true) {
  this.isListed = isListed;
  this.listingPrice = price;
  
  if (isListed) {
    this.listedAt = new Date();
    this.listingDate = new Date();
    this.addPriceHistory(price, 'listing');
  } else {
    this.cancelledAt = new Date();
  }
  
  this.transactionMetrics.lastMarketActivity = new Date();
  
  return this.save();
};

// ENHANCED: Static methods for escrow queries
propertySchema.statics.findByEscrowBuyer = function(buyerAddress) {
  return this.find({
    'escrowInfo.hasActiveEscrow': true,
    'escrowInfo.currentEscrowBuyer': buyerAddress.toLowerCase()
  });
};

propertySchema.statics.findByEscrowSeller = function(sellerAddress) {
  return this.find({
    'escrowInfo.hasActiveEscrow': true,
    'currentOwner': sellerAddress.toLowerCase()
  });
};

propertySchema.statics.findActiveEscrows = function() {
  return this.find({
    'escrowInfo.hasActiveEscrow': true,
    'escrowInfo.currentEscrowStatus': { $in: ['PENDING', 'FUNDED'] }
  });
};

propertySchema.statics.getEscrowStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalProperties: { $sum: 1 },
        propertiesWithActiveEscrow: {
          $sum: { $cond: ['$escrowInfo.hasActiveEscrow', 1, 0] }
        },
        totalEscrowVolume: {
          $sum: { $toDouble: '$transactionMetrics.totalVolume' }
        },
        avgEscrowUsage: { $avg: '$transactionMetrics.escrowUsageCount' }
      }
    }
  ]);
};

// Ensure virtual fields are serialized
propertySchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    // Ensure both field names exist for compatibility
    ret.physicalAddress = ret.physicalAddress || ret.location;
    ret.location = ret.location || ret.physicalAddress;
    ret.areaInSqFt = ret.areaInSqFt || ret.area || 1000;
    ret.area = ret.area || ret.areaInSqFt;
    
    // Ensure escrow info exists
    if (!ret.escrowInfo) {
      ret.escrowInfo = {
        hasActiveEscrow: false,
        escrowContractAddress: "0x32f99155646d147b8A4846470b64a96dD9cBa414"
      };
    }
    
    // Ensure purchase options exist
    if (!ret.purchaseOptions) {
      ret.purchaseOptions = {
        directPurchaseEnabled: true,
        escrowPurchaseEnabled: true,
        minimumEscrowAmount: "0",
        maxEscrowDuration: 30
      };
    }
    
    return ret;
  }
});

// ENHANCED: Indexes for better performance including escrow fields
propertySchema.index({ propertyId: 1 });
propertySchema.index({ tokenId: 1 });
propertySchema.index({ owner: 1 });
propertySchema.index({ ownerAddress: 1 });
propertySchema.index({ currentOwner: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ isListed: 1 });
propertySchema.index({ physicalAddress: 'text', name: 'text', description: 'text' });

// Escrow-specific indexes
propertySchema.index({ 'escrowInfo.hasActiveEscrow': 1 });
propertySchema.index({ 'escrowInfo.currentEscrowBuyer': 1 });
propertySchema.index({ 'escrowInfo.currentEscrowStatus': 1 });
propertySchema.index({ 'escrowHistory.buyer': 1 });
propertySchema.index({ 'escrowHistory.seller': 1 });
propertySchema.index({ 'escrowHistory.status': 1 });
propertySchema.index({ 'transactionMetrics.lastMarketActivity': -1 });

// Compound indexes for complex queries
propertySchema.index({ 
  'escrowInfo.hasActiveEscrow': 1, 
  'escrowInfo.currentEscrowStatus': 1 
});
propertySchema.index({ 
  isListed: 1, 
  'escrowInfo.hasActiveEscrow': 1 
});
propertySchema.index({ 
  status: 1, 
  isMinted: 1, 
  isListed: 1 
});

module.exports = mongoose.model('Property', propertySchema);