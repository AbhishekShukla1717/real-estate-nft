// models/PropertyInterest.js - MongoDB model for property interests
const mongoose = require('mongoose');

const propertyInterestSchema = new mongoose.Schema({
  tokenId: {
    type: String,
    required: true,
    index: true
  },
  buyerAddress: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  ownerAddress: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved'],
    default: 'pending',
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  approvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Compound index to ensure one interest per buyer per property
propertyInterestSchema.index({ tokenId: 1, buyerAddress: 1 }, { unique: true });

// Index for querying by status
propertyInterestSchema.index({ status: 1, timestamp: -1 });

// Virtual for formatted buyer address
propertyInterestSchema.virtual('formattedBuyerAddress').get(function() {
  return `${this.buyerAddress.substring(0, 6)}...${this.buyerAddress.substring(38)}`;
});

// Virtual for formatted owner address
propertyInterestSchema.virtual('formattedOwnerAddress').get(function() {
  return `${this.ownerAddress.substring(0, 6)}...${this.ownerAddress.substring(38)}`;
});

// Static method to get interests for a property
propertyInterestSchema.statics.getByProperty = function(tokenId) {
  return this.find({ tokenId }).sort({ timestamp: 1 });
};

// Static method to get interests by buyer
propertyInterestSchema.statics.getByBuyer = function(buyerAddress) {
  return this.find({ buyerAddress: buyerAddress.toLowerCase() }).sort({ timestamp: -1 });
};

// Static method to get interests by owner
propertyInterestSchema.statics.getByOwner = function(ownerAddress) {
  return this.find({ ownerAddress: ownerAddress.toLowerCase() }).sort({ timestamp: -1 });
};

// Instance method to approve this interest and reset others
propertyInterestSchema.methods.approve = async function() {
  // Reset all other interests for this property to pending
  await this.constructor.updateMany(
    { 
      tokenId: this.tokenId, 
      _id: { $ne: this._id } 
    },
    { 
      status: 'pending', 
      approvedAt: null 
    }
  );
  
  // Approve this interest
  this.status = 'approved';
  this.approvedAt = new Date();
  return this.save();
};

// Pre-save middleware to ensure lowercase addresses
propertyInterestSchema.pre('save', function(next) {
  if (this.buyerAddress) {
    this.buyerAddress = this.buyerAddress.toLowerCase();
  }
  if (this.ownerAddress) {
    this.ownerAddress = this.ownerAddress.toLowerCase();
  }
  next();
});

module.exports = mongoose.model('PropertyInterest', propertyInterestSchema);