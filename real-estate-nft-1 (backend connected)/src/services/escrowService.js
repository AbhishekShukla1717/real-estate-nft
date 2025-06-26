// services/EscrowService.js - Enhanced Escrow Service
import { ethers } from 'ethers';
import walletService from '../utils/WalletService';
import { transactionApi } from './apiService';

// Your deployed escrow contract address
export const escrowAddress = "0x32f99155646d147b8A4846470b64a96dD9cBa414";

// Complete ABI from your contract
export const escrowABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "cancelEscrow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "completeDeal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "buyer",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      }
    ],
    "name": "createEscrow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "depositFunds",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_propertyNFT",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_kycVerification",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "EscrowCancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "EscrowCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "seller",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "buyer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      }
    ],
    "name": "EscrowCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "FundsDeposited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "FundsRefunded",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "refundBuyer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "newFeePercent",
        "type": "uint256"
      }
    ],
    "name": "updateFeePercent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newFeeRecipient",
        "type": "address"
      }
    ],
    "name": "updateFeeRecipient",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "deals",
    "outputs": [
      {
        "internalType": "address",
        "name": "seller",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "buyer",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "fee",
        "type": "uint256"
      },
      {
        "internalType": "enum Escrow.EscrowStatus",
        "name": "status",
        "type": "uint8"
      },
      {
        "internalType": "bool",
        "name": "fundsDeposited",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "createdAt",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "feePercent",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "feeRecipient",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getDeal",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "seller",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "buyer",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "price",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "fee",
            "type": "uint256"
          },
          {
            "internalType": "enum Escrow.EscrowStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "bool",
            "name": "fundsDeposited",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          }
        ],
        "internalType": "struct Escrow.EscrowDeal",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "kycVerification",
    "outputs": [
      {
        "internalType": "contract IKYCVerification",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "propertyNFT",
    "outputs": [
      {
        "internalType": "contract IPropertyNFT",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

class EscrowService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.account = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the escrow service
   */
  async init() {
    try {
      const walletState = walletService.getWalletState();
      
      if (!walletState.provider || !walletState.isConnected) {
        throw new Error('Wallet not connected');
      }

      this.provider = walletState.provider;
      this.signer = await this.provider.getSigner();
      this.account = await this.signer.getAddress();

      // Create contract instance
      this.contract = new ethers.Contract(escrowAddress, escrowABI, this.signer);

      // Test contract connection
      try {
        await this.contract.feePercent();
        console.log('✅ Escrow contract initialized successfully');
      } catch (testError) {
        console.warn('⚠️ Escrow contract test failed:', testError);
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize escrow service:', error);
      throw error;
    }
  }

  /**
   * Ensure service is initialized
   */
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.init();
    }
  }

  /**
   * Create a new escrow deal
   */
  async createEscrow(tokenId, buyerAddress, priceInETH) {
    try {
      await this.ensureInitialized();
      
      console.log(`📝 Creating escrow for token ${tokenId}, buyer: ${buyerAddress}, price: ${priceInETH} ETH`);
      
      // Validate inputs
      if (!ethers.isAddress(buyerAddress)) {
        throw new Error('Invalid buyer address');
      }

      if (!priceInETH || parseFloat(priceInETH) <= 0) {
        throw new Error('Price must be greater than 0');
      }

      const priceInWei = ethers.parseEther(priceInETH.toString());
      
      // Estimate gas
      const gasEstimate = await this.contract.createEscrow.estimateGas(
        BigInt(tokenId),
        buyerAddress,
        priceInWei
      );

      // Create escrow with gas limit
      const tx = await this.contract.createEscrow(
        BigInt(tokenId),
        buyerAddress,
        priceInWei,
        {
          gasLimit: gasEstimate + BigInt(10000) // Add buffer
        }
      );

      console.log('✅ Escrow creation transaction submitted:', tx.hash);
      const receipt = await tx.wait();

      // Record transaction
      try {
        await transactionApi.record({
          type: 'escrow_create',
          propertyId: tokenId.toString(),
          propertyName: `Property #${tokenId}`,
          from: this.account,
          to: buyerAddress,
          value: priceInETH,
          txHash: receipt.hash,
          status: 'completed'
        });
      } catch (apiError) {
        console.warn('⚠️ Failed to record escrow creation:', apiError);
      }

      return {
        success: true,
        tokenId: tokenId.toString(),
        buyer: buyerAddress,
        seller: this.account,
        price: priceInETH,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('❌ Error creating escrow:', error);
      
      // Handle specific contract errors
      if (error.message.includes('User not KYC verified')) {
        throw new Error('Both buyer and seller must be KYC verified to create an escrow');
      } else if (error.message.includes('Not owner')) {
        throw new Error('You must own this property to create an escrow');
      } else if (error.message.includes('Escrow exists')) {
        throw new Error('An escrow already exists for this property');
      } else if (error.message.includes('user rejected') || error.message.includes('User denied')) {
        throw new Error('Transaction cancelled by user');
      }
      
      throw error;
    }
  }

  /**
   * Deposit funds to escrow
   */
  async depositFunds(tokenId) {
    try {
      await this.ensureInitialized();
      
      console.log(`💰 Depositing funds to escrow for token ${tokenId}`);

      // Get deal details to calculate total amount
      const deal = await this.getDealDetails(tokenId);
      if (!deal) {
        throw new Error('Escrow deal not found');
      }

      if (deal.buyer.toLowerCase() !== this.account.toLowerCase()) {
        throw new Error('Only the buyer can deposit funds');
      }

      if (deal.status !== 0) { // PENDING
        throw new Error('Deal is not in pending status');
      }

      const totalAmount = BigInt(deal.priceInWei) + BigInt(deal.feeInWei);

      // Estimate gas
      const gasEstimate = await this.contract.depositFunds.estimateGas(
        BigInt(tokenId),
        { value: totalAmount }
      );

      // Deposit funds
      const tx = await this.contract.depositFunds(
        BigInt(tokenId),
        {
          value: totalAmount,
          gasLimit: gasEstimate + BigInt(10000)
        }
      );

      console.log('✅ Funds deposit transaction submitted:', tx.hash);
      const receipt = await tx.wait();

      // Record transaction
      try {
        await transactionApi.record({
          type: 'escrow_deposit',
          propertyId: tokenId.toString(),
          propertyName: `Property #${tokenId}`,
          from: this.account,
          to: escrowAddress,
          value: ethers.formatEther(totalAmount),
          txHash: receipt.hash,
          status: 'completed'
        });
      } catch (apiError) {
        console.warn('⚠️ Failed to record escrow deposit:', apiError);
      }

      return {
        success: true,
        tokenId: tokenId.toString(),
        amount: ethers.formatEther(totalAmount),
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('❌ Error depositing funds:', error);
      
      if (error.message.includes('Not buyer')) {
        throw new Error('Only the designated buyer can deposit funds');
      } else if (error.message.includes('Invalid status')) {
        throw new Error('Escrow is not in the correct status for deposits');
      } else if (error.message.includes('Wrong amount')) {
        throw new Error('Deposit amount must match the total price including fees');
      }
      
      throw error;
    }
  }

  /**
   * Complete escrow deal
   */
  async completeDeal(tokenId) {
    try {
      await this.ensureInitialized();
      
      console.log(`✅ Completing escrow deal for token ${tokenId}`);

      // Get deal details
      const deal = await this.getDealDetails(tokenId);
      if (!deal) {
        throw new Error('Escrow deal not found');
      }

      const isAuthorized = deal.buyer.toLowerCase() === this.account.toLowerCase() || 
                          deal.seller.toLowerCase() === this.account.toLowerCase();
      
      if (!isAuthorized) {
        throw new Error('Only the buyer or seller can complete the deal');
      }

      if (deal.status !== 1) { // FUNDED
        throw new Error('Deal must be funded before completion');
      }

      // Estimate gas
      const gasEstimate = await this.contract.completeDeal.estimateGas(BigInt(tokenId));

      // Complete deal
      const tx = await this.contract.completeDeal(
        BigInt(tokenId),
        {
          gasLimit: gasEstimate + BigInt(20000)
        }
      );

      console.log('✅ Deal completion transaction submitted:', tx.hash);
      const receipt = await tx.wait();

      // Record transaction
      try {
        await transactionApi.record({
          type: 'escrow_complete',
          propertyId: tokenId.toString(),
          propertyName: `Property #${tokenId}`,
          from: deal.seller,
          to: deal.buyer,
          value: deal.price,
          txHash: receipt.hash,
          status: 'completed'
        });
      } catch (apiError) {
        console.warn('⚠️ Failed to record escrow completion:', apiError);
      }

      return {
        success: true,
        tokenId: tokenId.toString(),
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('❌ Error completing deal:', error);
      
      if (error.message.includes('Not funded')) {
        throw new Error('Funds must be deposited before completing the deal');
      } else if (error.message.includes('Seller not KYC verified')) {
        throw new Error('Seller must remain KYC verified to complete the deal');
      } else if (error.message.includes('Buyer not KYC verified')) {
        throw new Error('Buyer must remain KYC verified to complete the deal');
      }
      
      throw error;
    }
  }

  /**
   * Cancel escrow deal
   */
  async cancelEscrow(tokenId) {
    try {
      await this.ensureInitialized();
      
      console.log(`❌ Cancelling escrow for token ${tokenId}`);

      // Get deal details
      const deal = await this.getDealDetails(tokenId);
      if (!deal) {
        throw new Error('Escrow deal not found');
      }

      const isAuthorized = deal.buyer.toLowerCase() === this.account.toLowerCase() || 
                          deal.seller.toLowerCase() === this.account.toLowerCase();
      
      if (!isAuthorized) {
        throw new Error('Only the buyer or seller can cancel the escrow');
      }

      if (deal.status !== 0) { // PENDING
        throw new Error('Can only cancel pending escrows');
      }

      // Estimate gas
      const gasEstimate = await this.contract.cancelEscrow.estimateGas(BigInt(tokenId));

      // Cancel escrow
      const tx = await this.contract.cancelEscrow(
        BigInt(tokenId),
        {
          gasLimit: gasEstimate + BigInt(10000)
        }
      );

      console.log('✅ Escrow cancellation transaction submitted:', tx.hash);
      const receipt = await tx.wait();

      // Record transaction
      try {
        await transactionApi.record({
          type: 'escrow_cancel',
          propertyId: tokenId.toString(),
          propertyName: `Property #${tokenId}`,
          from: this.account,
          to: escrowAddress,
          value: '0',
          txHash: receipt.hash,
          status: 'completed'
        });
      } catch (apiError) {
        console.warn('⚠️ Failed to record escrow cancellation:', apiError);
      }

      return {
        success: true,
        tokenId: tokenId.toString(),
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('❌ Error cancelling escrow:', error);
      
      if (error.message.includes('Cannot cancel')) {
        throw new Error('Cannot cancel escrow after funds have been deposited');
      }
      
      throw error;
    }
  }

  /**
   * Refund buyer
   */
  async refundBuyer(tokenId) {
    try {
      await this.ensureInitialized();
      
      console.log(`🔄 Refunding buyer for token ${tokenId}`);

      // Get deal details
      const deal = await this.getDealDetails(tokenId);
      if (!deal) {
        throw new Error('Escrow deal not found');
      }

      if (deal.seller.toLowerCase() !== this.account.toLowerCase()) {
        throw new Error('Only the seller can initiate a refund');
      }

      if (deal.status !== 1) { // FUNDED
        throw new Error('Deal must be funded to refund');
      }

      // Estimate gas
      const gasEstimate = await this.contract.refundBuyer.estimateGas(BigInt(tokenId));

      // Refund buyer
      const tx = await this.contract.refundBuyer(
        BigInt(tokenId),
        {
          gasLimit: gasEstimate + BigInt(10000)
        }
      );

      console.log('✅ Buyer refund transaction submitted:', tx.hash);
      const receipt = await tx.wait();

      // Record transaction
      try {
        await transactionApi.record({
          type: 'escrow_refund',
          propertyId: tokenId.toString(),
          propertyName: `Property #${tokenId}`,
          from: escrowAddress,
          to: deal.buyer,
          value: deal.price,
          txHash: receipt.hash,
          status: 'completed'
        });
      } catch (apiError) {
        console.warn('⚠️ Failed to record escrow refund:', apiError);
      }

      return {
        success: true,
        tokenId: tokenId.toString(),
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('❌ Error refunding buyer:', error);
      throw error;
    }
  }

  /**
   * Get deal details
   */
  async getDealDetails(tokenId) {
    try {
      await this.ensureInitialized();
      
      const deal = await this.contract.getDeal(tokenId);
      
      // Check if deal exists (seller address is not zero)
      if (deal.seller === ethers.ZeroAddress) {
        return null;
      }

      return {
        tokenId: tokenId.toString(),
        seller: deal.seller,
        buyer: deal.buyer,
        price: ethers.formatEther(deal.price),
        priceInWei: deal.price.toString(),
        fee: ethers.formatEther(deal.fee),
        feeInWei: deal.fee.toString(),
        status: Number(deal.status), // 0: PENDING, 1: FUNDED, 2: COMPLETED, 3: CANCELLED, 4: REFUNDED
        fundsDeposited: deal.fundsDeposited,
        createdAt: Number(deal.createdAt) * 1000 // Convert to milliseconds
      };

    } catch (error) {
      console.error('❌ Error getting deal details:', error);
      return null;
    }
  }

  /**
   * Get all deals for current user
   */
  async getUserDeals() {
    try {
      await this.ensureInitialized();
      
      // Since Solidity doesn't provide a direct way to get all deals,
      // we'll need to check token IDs systematically or use events
      // For now, return empty array and implement event-based loading later
      console.warn('getUserDeals: This method needs to be implemented with event querying');
      return [];

    } catch (error) {
      console.error('❌ Error getting user deals:', error);
      return [];
    }
  }

  /**
   * Get escrow fee percentage
   */
  async getFeePercent() {
    try {
      await this.ensureInitialized();
      
      const feePercent = await this.contract.feePercent();
      return Number(feePercent); // Returns basis points (250 = 2.5%)

    } catch (error) {
      console.error('❌ Error getting fee percent:', error);
      return 250; // Default 2.5%
    }
  }

  /**
   * Get fee recipient address
   */
  async getFeeRecipient() {
    try {
      await this.ensureInitialized();
      
      const feeRecipient = await this.contract.feeRecipient();
      return feeRecipient;

    } catch (error) {
      console.error('❌ Error getting fee recipient:', error);
      return null;
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners(callbacks = {}) {
    if (!this.contract) {
      console.warn('Contract not initialized for event listeners');
      return;
    }

    if (callbacks.onEscrowCreated) {
      this.contract.on('EscrowCreated', (tokenId, seller, buyer, price, event) => {
        callbacks.onEscrowCreated({
          tokenId: tokenId.toString(),
          seller,
          buyer,
          price: ethers.formatEther(price),
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      });
    }

    if (callbacks.onFundsDeposited) {
      this.contract.on('FundsDeposited', (tokenId, amount, event) => {
        callbacks.onFundsDeposited({
          tokenId: tokenId.toString(),
          amount: ethers.formatEther(amount),
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      });
    }

    if (callbacks.onEscrowCompleted) {
      this.contract.on('EscrowCompleted', (tokenId, event) => {
        callbacks.onEscrowCompleted({
          tokenId: tokenId.toString(),
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      });
    }

    if (callbacks.onEscrowCancelled) {
      this.contract.on('EscrowCancelled', (tokenId, event) => {
        callbacks.onEscrowCancelled({
          tokenId: tokenId.toString(),
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      });
    }

    if (callbacks.onFundsRefunded) {
      this.contract.on('FundsRefunded', (tokenId, amount, event) => {
        callbacks.onFundsRefunded({
          tokenId: tokenId.toString(),
          amount: ethers.formatEther(amount),
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      });
    }

    console.log('✅ Escrow event listeners setup completed');
  }

  /**
   * Remove event listeners
   */
  removeEventListeners() {
    if (this.contract) {
      this.contract.removeAllListeners();
      console.log('✅ Escrow event listeners removed');
    }
  }

  /**
   * Calculate total cost including fees
   */
  async calculateTotalCost(priceInETH) {
    try {
      const feePercent = await this.getFeePercent();
      const price = parseFloat(priceInETH);
      const fee = (price * feePercent) / 10000;
      const total = price + fee;

      return {
        price: price,
        fee: fee,
        total: total,
        feePercent: (feePercent / 100) // Convert to percentage
      };

    } catch (error) {
      console.error('❌ Error calculating total cost:', error);
      const price = parseFloat(priceInETH);
      return {
        price: price,
        fee: price * 0.025, // Default 2.5%
        total: price * 1.025,
        feePercent: 2.5
      };
    }
  }

  /**
   * Get current account
   */
  getCurrentAccount() {
    return this.account;
  }

  /**
   * Get contract address
   */
  getContractAddress() {
    return escrowAddress;
  }

  /**
   * Check if service is initialized
   */
  isServiceInitialized() {
    return this.isInitialized;
  }
}

// Export singleton instance
const escrowService = new EscrowService();
export default escrowService;