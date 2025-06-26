// models/EscrowTransaction.js - MongoDB Model for Escrow Transactions
const mongoose = require('mongoose');

const escrowTransactionSchema = new mongoose.Schema({
  tokenId: {
    type: Number,
    required: true,
    index: true
  },
  transactionHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  blockNumber: {
    type: Number,
    index: true
  },
  eventType: {
    type: String,
    required: true,
    enum: ['created', 'funded', 'completed', 'cancelled', 'refunded'],
    index: true
  },
  seller: {
    type: String,
    required: function() {
      return this.eventType === 'created';
    },
    lowercase: true,
    index: true
  },
  buyer: {
    type: String,
    required: function() {
      return this.eventType === 'created';
    },
    lowercase: true,
    index: true
  },
  price: {
    type: String, // Store as string to handle large numbers
    required: function() {
      return ['created', 'funded'].includes(this.eventType);
    }
  },
  fee: {
    type: String, // Store as string to handle large numbers
    required: function() {
      return ['created', 'funded'].includes(this.eventType);
    }
  },
  amount: {
    type: String, // For funded/refunded events
    required: function() {
      return ['funded', 'refunded'].includes(this.eventType);
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending'
  },
  gasUsed: {
    type: Number
  },
  gasPrice: {
    type: String
  },
  userAddress: {
    type: String,
    lowercase: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
escrowTransactionSchema.index({ tokenId: 1, eventType: 1 });
escrowTransactionSchema.index({ buyer: 1, eventType: 1 });
escrowTransactionSchema.index({ seller: 1, eventType: 1 });
escrowTransactionSchema.index({ timestamp: -1 });

// Virtual for formatted price in ETH
escrowTransactionSchema.virtual('priceInEth').get(function() {
  if (this.price) {
    return (parseFloat(this.price) / 1e18).toFixed(4);
  }
  return null;
});

// Virtual for formatted fee in ETH
escrowTransactionSchema.virtual('feeInEth').get(function() {
  if (this.fee) {
    return (parseFloat(this.fee) / 1e18).toFixed(4);
  }
  return null;
});

// Virtual for formatted amount in ETH
escrowTransactionSchema.virtual('amountInEth').get(function() {
  if (this.amount) {
    return (parseFloat(this.amount) / 1e18).toFixed(4);
  }
  return null;
});

// Instance method to get transaction summary
escrowTransactionSchema.methods.getSummary = function() {
  return {
    id: this._id,
    tokenId: this.tokenId,
    eventType: this.eventType,
    transactionHash: this.transactionHash,
    seller: this.seller,
    buyer: this.buyer,
    priceInEth: this.priceInEth,
    feeInEth: this.feeInEth,
    amountInEth: this.amountInEth,
    status: this.status,
    timestamp: this.timestamp
  };
};

// Static method to get escrow timeline for a token
escrowTransactionSchema.statics.getEscrowTimeline = async function(tokenId) {
  return this.find({ tokenId })
    .sort({ timestamp: 1 })
    .select('eventType transactionHash timestamp status blockNumber')
    .exec();
};

// Static method to get user's escrow activity
escrowTransactionSchema.statics.getUserActivity = async function(userAddress, limit = 10) {
  return this.find({
    $or: [
      { buyer: userAddress.toLowerCase() },
      { seller: userAddress.toLowerCase() },
      { userAddress: userAddress.toLowerCase() }
    ]
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('tokenId')
    .exec();
};

// Pre-save middleware to ensure lowercase addresses
escrowTransactionSchema.pre('save', function(next) {
  if (this.seller) {
    this.seller = this.seller.toLowerCase();
  }
  if (this.buyer) {
    this.buyer = this.buyer.toLowerCase();
  }
  if (this.userAddress) {
    this.userAddress = this.userAddress.toLowerCase();
  }
  next();
});

// Enable virtuals in JSON output
escrowTransactionSchema.set('toJSON', { virtuals: true });
escrowTransactionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('EscrowTransaction', escrowTransactionSchema);