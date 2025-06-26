const mongoose = require('mongoose');

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

module.exports = mongoose.model('User', userSchema);