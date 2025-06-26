// components/EscrowModal.jsx - Enhanced Escrow Modal
import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { WalletContext } from '../context/WalletContext';
import escrowService from '../services/escrowService';
import kycContractService from '../services/KYCContractService';

const EscrowModal = ({ 
  isOpen, 
  onClose, 
  property, 
  onEscrowCreated 
}) => {
  const walletContext = useContext(WalletContext);
  const walletState = walletContext?.walletState || {};
  
  const [buyerAddress, setBuyerAddress] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [costBreakdown, setCostBreakdown] = useState(null);
  const [buyerKYCStatus, setBuyerKYCStatus] = useState(null);
  const [sellerKYCStatus, setSellerKYCStatus] = useState(null);

  useEffect(() => {
    if (price && parseFloat(price) > 0) {
      calculateCostBreakdown();
    }
  }, [price]);

  useEffect(() => {
    if (walletState?.address) {
      checkSellerKYC();
    }
  }, [walletState?.address]);

  useEffect(() => {
    if (buyerAddress && ethers.isAddress(buyerAddress)) {
      checkBuyerKYC();
    } else {
      setBuyerKYCStatus(null);
    }
  }, [buyerAddress]);

  const calculateCostBreakdown = async () => {
    try {
      const breakdown = await escrowService.calculateTotalCost(price);
      setCostBreakdown(breakdown);
    } catch (error) {
      console.error('Error calculating cost breakdown:', error);
      // Fallback calculation
      const priceValue = parseFloat(price);
      const fee = priceValue * 0.025; // 2.5% default
      setCostBreakdown({
        price: priceValue,
        fee: fee,
        total: priceValue + fee,
        feePercent: 2.5
      });
    }
  };

  const checkSellerKYC = async () => {
    try {
      const result = await kycContractService.checkUserVerification(walletState.address);
      setSellerKYCStatus(result.isVerified);
    } catch (error) {
      console.error('Error checking seller KYC:', error);
      setSellerKYCStatus(false);
    }
  };

  const checkBuyerKYC = async () => {
    try {
      const result = await kycContractService.checkUserVerification(buyerAddress);
      setBuyerKYCStatus(result.isVerified);
    } catch (error) {
      console.error('Error checking buyer KYC:', error);
      setBuyerKYCStatus(false);
    }
  };

  const handleCreateEscrow = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validation
      if (!ethers.isAddress(buyerAddress)) {
        throw new Error('Invalid buyer address format');
      }
      
      if (!price || parseFloat(price) <= 0) {
        throw new Error('Please enter a valid price greater than 0');
      }

      if (!sellerKYCStatus) {
        throw new Error('You must be KYC verified to create an escrow');
      }

      if (!buyerKYCStatus) {
        throw new Error('Buyer must be KYC verified to participate in escrow');
      }

      // Check if user owns the property (if property has tokenId)
      if (property?.tokenId) {
        // This would require propertyNFT contract integration
        // For now, we'll skip this check
      }

      // Create escrow deal
      const result = await escrowService.createEscrow(
        property.tokenId || property.id,
        buyerAddress,
        price
      );

      console.log('Escrow created:', result);
      
      if (onEscrowCreated) {
        onEscrowCreated(result);
      }
      
      // Reset form
      setBuyerAddress('');
      setPrice('');
      setCostBreakdown(null);
      setBuyerKYCStatus(null);
      
      onClose();
      
    } catch (error) {
      console.error('Error creating escrow:', error);
      setError(error.message || 'Failed to create escrow deal');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount) => {
    if (!amount) return '0.0000';
    return parseFloat(amount).toFixed(4);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">🔐 Create Secure Escrow Deal</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Property Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-lg">{property?.name || property?.title}</h3>
          <p className="text-sm text-gray-600">
            {property?.tokenId ? `Token ID: #${property.tokenId}` : `Property ID: ${property?.id}`}
          </p>
          {property?.image && (
            <img 
              src={property.image} 
              alt={property.name}
              className="w-full h-32 object-cover rounded mt-2"
            />
          )}
        </div>

        {/* KYC Status Display */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-semibold mb-2">🔍 KYC Verification Status</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span>Your Status (Seller):</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                sellerKYCStatus === true ? 'bg-green-100 text-green-800' :
                sellerKYCStatus === false ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {sellerKYCStatus === true ? '✅ Verified' :
                 sellerKYCStatus === false ? '❌ Not Verified' :
                 '⏳ Checking...'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Buyer Status:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                buyerKYCStatus === true ? 'bg-green-100 text-green-800' :
                buyerKYCStatus === false ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {buyerKYCStatus === true ? '✅ Verified' :
                 buyerKYCStatus === false ? '❌ Not Verified' :
                 buyerAddress ? '⏳ Checking...' : '⚪ Enter address first'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleCreateEscrow}>
          {/* Buyer Address */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Buyer Wallet Address *
              <span className="text-gray-400 text-xs ml-1">(Must be KYC verified)</span>
            </label>
            <input
              type="text"
              value={buyerAddress}
              onChange={(e) => setBuyerAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the complete wallet address of the buyer
            </p>
          </div>

          {/* Price */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Escrow Price (ETH) *
            </label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Cost Breakdown */}
          {costBreakdown && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-3">💰 Payment Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Property Price:</span>
                  <span className="font-medium">{formatPrice(costBreakdown.price)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span>Escrow Fee ({costBreakdown.feePercent}%):</span>
                  <span className="font-medium">{formatPrice(costBreakdown.fee)} ETH</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total Cost for Buyer:</span>
                    <span className="text-blue-600">{formatPrice(costBreakdown.total)} ETH</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 p-3 bg-white rounded border-l-4 border-blue-400">
                <p className="text-xs text-gray-600">
                  <strong>How it works:</strong> The buyer will deposit the total amount into escrow. 
                  You'll receive the property price, and the platform fee will be deducted automatically 
                  when the deal is completed.
                </p>
              </div>
            </div>
          )}

          {/* Escrow Benefits */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold mb-2 text-green-800">🛡️ Escrow Protection</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Funds are securely held until deal completion</li>
              <li>• Both parties must be KYC verified</li>
              <li>• Automatic NFT transfer upon completion</li>
              <li>• Refund protection for both buyer and seller</li>
              <li>• Transparent, blockchain-based process</li>
            </ul>
          </div>

          {/* Warning Messages */}
          {!sellerKYCStatus && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">
                ⚠️ You must be KYC verified to create an escrow deal.
              </p>
            </div>
          )}

          {buyerAddress && !buyerKYCStatus && ethers.isAddress(buyerAddress) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">
                ⚠️ The buyer address is not KYC verified. Only verified users can participate in escrow.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !buyerAddress || !price || !sellerKYCStatus || !buyerKYCStatus}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Escrow...
                </span>
              ) : (
                'Create Secure Escrow'
              )}
            </button>
          </div>
        </form>

        {/* Process Steps */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-3">📋 Next Steps After Creation</h4>
          <div className="text-sm text-gray-600 space-y-2">
            <div className="flex items-start">
              <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
              <span>Buyer deposits {costBreakdown ? formatPrice(costBreakdown.total) : 'total amount'} ETH into escrow</span>
            </div>
            <div className="flex items-start">
              <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
              <span>Either party can complete the deal to transfer NFT and release funds</span>
            </div>
            <div className="flex items-start">
              <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
              <span>You receive {price || '0'} ETH, platform gets {costBreakdown ? formatPrice(costBreakdown.fee) : '0'} ETH fee</span>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <h5 className="font-medium text-yellow-800 mb-1">ℹ️ Important Notes</h5>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>• Only you (seller) or the buyer can complete or cancel the escrow</li>
            <li>• Escrow can only be cancelled before funds are deposited</li>
            <li>• You can refund the buyer at any time after they deposit funds</li>
            <li>• Both parties must remain KYC verified throughout the process</li>
            <li>• The smart contract automatically handles NFT transfer and payment distribution</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EscrowModal;