// models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  transactionHash: {
    type: String,
    required: true,
    unique: true
  },
  blockNumber: {
    type: Number
  },
  gasUsed: {
    type: String
  },
  transactionFee: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending'
  },
  transactionType: {
    type: String,
    enum: ['mint', 'transfer', 'sale'],
    required: true
  }
}, {
  timestamps: true
});

// Prevent model recompilation error
module.exports = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);