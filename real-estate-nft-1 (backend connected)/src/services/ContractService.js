// services/ContractService.js - Integrated service for all contracts
import { ethers } from 'ethers';
import walletService from '../utils/WalletService';

// Import contract configurations
import { 
  contractAddress as propertyNFTAddress, 
  contractABI as propertyNFTABI,
  connectToContract as connectToPropertyNFT,
  mintProperty,
  getTokenURI,
  getTokenOwner,
  getTokenCounter,
  hasAdminRole as hasPropertyNFTAdminRole,
  approveMarketplace,
  setApprovalForAll
} from '../contracts/propertynft';

import {
  propertyRegistryAddress,
  propertyRegistryABI,
  connectToPropertyRegistry,
  registerProperty,
  transferProperty as registryTransferProperty,
  hasAdminRole as hasRegistryAdminRole
} from '../contracts/propertyregistry';

import {
  marketplaceAddress,
  marketplaceABI,
  connectToMarketplace,
  listProperty,
  buyProperty,
  cancelListing,
  getActiveListings,
  getListingDetails,
  getAllListingsWithDetails,
  isPropertyListed,
  calculateFees,
  setupMarketplaceEventListeners,
  removeMarketplaceEventListeners
} from '../contracts/marketplace';

import {
  escrowAddress,
  escrowABI,
  connectToEscrow,
  createEscrow,
  depositFunds,
  completeDeal,
  cancelEscrow,
  refundBuyer,
  getDealDetails,
  getAllDeals,
  setupEscrowEventListeners,
  removeEscrowEventListeners
} from '../contracts/escrow';

// Import KYC service (already working)
import kycContractService from './KYCContractService';

class ContractService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    
    // Contract instances
    this.propertyNFTContract = null;
    this.propertyRegistryContract = null;
    this.marketplaceContract = null;
    this.escrowContract = null;
    
    // State
    this.isInitialized = false;
    this.eventListeners = new Map();
  }

  /**
   * Initialize all contracts
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

      // Initialize all contracts
      this.propertyNFTContract = await connectToPropertyNFT(this.provider);
      this.propertyRegistryContract = await connectToPropertyRegistry(this.provider);
      this.marketplaceContract = await connectToMarketplace(this.provider);
      this.escrowContract = await connectToEscrow(this.provider);

      // Initialize KYC service
      await kycContractService.init();

      this.isInitialized = true;
      console.log('✅ All contracts initialized successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize contracts:', error);
      throw error;
    }
  }

  /**
   * Ensure contracts are initialized
   */
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.init();
    }
  }

  // ========================
  // PROPERTY NFT FUNCTIONS
  // ========================

  /**
   * Mint a new property NFT
   */
  async mintPropertyNFT(to, tokenURI) {
    await this.ensureInitialized();
    return await mintProperty(this.propertyNFTContract, to, tokenURI);
  }

  /**
   * Get property token URI
   */
  async getPropertyTokenURI(tokenId) {
    await this.ensureInitialized();
    return await getTokenURI(this.propertyNFTContract, tokenId);
  }

  /**
   * Get property owner
   */
  async getPropertyOwner(tokenId) {
    await this.ensureInitialized();
    return await getTokenOwner(this.propertyNFTContract, tokenId);
  }

  /**
   * Get total minted properties
   */
  async getTotalProperties() {
    await this.ensureInitialized();
    return await getTokenCounter(this.propertyNFTContract);
  }

  /**
   * Check if user is PropertyNFT admin
   */
  async isPropertyNFTAdmin(address = null) {
    await this.ensureInitialized();
    const checkAddress = address || this.account;
    return await hasPropertyNFTAdminRole(this.propertyNFTContract, checkAddress);
  }

  /**
   * Approve marketplace to transfer specific NFT
   */
  async approveMarketplaceForToken(tokenId) {
    await this.ensureInitialized();
    return await approveMarketplace(this.propertyNFTContract, marketplaceAddress, tokenId);
  }

  /**
   * Set approval for all NFTs to marketplace
   */
  async setMarketplaceApprovalForAll(approved = true) {
    await this.ensureInitialized();
    return await setApprovalForAll(this.propertyNFTContract, marketplaceAddress, approved);
  }

  // ========================
  // PROPERTY REGISTRY FUNCTIONS
  // ========================

  /**
   * Register property through registry
   */
  async registerPropertyViaRegistry(to, tokenURI) {
    await this.ensureInitialized();
    return await registerProperty(this.propertyRegistryContract, to, tokenURI);
  }

  /**
   * Transfer property through registry
   */
  async transferPropertyViaRegistry(tokenId, to) {
    await this.ensureInitialized();
    return await registryTransferProperty(this.propertyRegistryContract, tokenId, to);
  }

  /**
   * Check if user is Registry admin
   */
  async isRegistryAdmin(address = null) {
    await this.ensureInitialized();
    const checkAddress = address || this.account;
    return await hasRegistryAdminRole(this.propertyRegistryContract, checkAddress);
  }

  // ========================
  // MARKETPLACE FUNCTIONS
  // ========================

  /**
   * List property for sale
   */
  async listPropertyForSale(tokenId, priceInETH) {
    await this.ensureInitialized();
    return await listProperty(this.marketplaceContract, tokenId, priceInETH);
  }

  /**
   * Buy property from marketplace
   */
  async buyPropertyFromMarketplace(tokenId, priceInETH) {
    await this.ensureInitialized();
    return await buyProperty(this.marketplaceContract, tokenId, priceInETH);
  }

  /**
   * Cancel property listing
   */
  async cancelPropertyListing(tokenId) {
    await this.ensureInitialized();
    return await cancelListing(this.marketplaceContract, tokenId);
  }

  /**
   * Get all active marketplace listings
   */
  async getActiveMarketplaceListings() {
    await this.ensureInitialized();
    return await getAllListingsWithDetails(this.marketplaceContract);
  }

  /**
   * Get specific listing details
   */
  async getPropertyListing(tokenId) {
    await this.ensureInitialized();
    return await getListingDetails(this.marketplaceContract, tokenId);
  }

  /**
   * Check if property is listed
   */
  async isPropertyListedForSale(tokenId) {
    await this.ensureInitialized();
    return await isPropertyListed(this.marketplaceContract, tokenId);
  }

  /**
   * Calculate marketplace fees
   */
  async calculateMarketplaceFees(priceInETH) {
    await this.ensureInitialized();
    return await calculateFees(this.marketplaceContract, priceInETH);
  }

  // ========================
  // ESCROW FUNCTIONS
  // ========================

  /**
   * Create escrow deal
   */
  async createEscrowDeal(tokenId, buyer, priceInETH) {
    await this.ensureInitialized();
    return await createEscrow(this.escrowContract, tokenId, buyer, priceInETH);
  }

  /**
   * Deposit funds to escrow
   */
  async depositFundsToEscrow(tokenId, priceInETH) {
    await this.ensureInitialized();
    return await depositFunds(this.escrowContract, tokenId, priceInETH);
  }

  /**
   * Complete escrow deal
   */
  async completeEscrowDeal(tokenId) {
    await this.ensureInitialized();
    return await completeDeal(this.escrowContract, tokenId);
  }

  /**
   * Cancel escrow deal
   */
  async cancelEscrowDeal(tokenId) {
    await this.ensureInitialized();
    return await cancelEscrow(this.escrowContract, tokenId);
  }

  /**
   * Refund buyer from escrow
   */
  async refundEscrowBuyer(tokenId) {
    await this.ensureInitialized();
    return await refundBuyer(this.escrowContract, tokenId);
  }

  /**
   * Get escrow deal details
   */
  async getEscrowDealDetails(tokenId) {
    await this.ensureInitialized();
    return await getDealDetails(this.escrowContract, tokenId);
  }

  /**
   * Get all escrow deals
   */
  async getAllEscrowDeals() {
    await this.ensureInitialized();
    return await getAllDeals(this.escrowContract);
  }

  /**
   * Get escrow fee percentage
   */
  async getEscrowFeePercent() {
    await this.ensureInitialized();
    return await this.escrowContract.feePercent();
  }

  // ========================
  // KYC FUNCTIONS (delegated to KYC service)
  // ========================

  /**
   * Check if user is KYC verified
   */
  async isKYCVerified(address = null) {
    const checkAddress = address || this.account;
    const result = await kycContractService.checkUserVerification(checkAddress);
    return result.isVerified;
  }

  /**
   * Register user for KYC on blockchain
   */
  async registerForKYC() {
    return await kycContractService.registerUserOnChain();
  }

  /**
   * Verify user on blockchain (admin only)
   */
  async verifyUserKYC(userAddress) {
    return await kycContractService.verifyUserOnChain(userAddress);
  }

  /**
   * Check if user is KYC admin
   */
  async isKYCAdmin(address = null) {
    const checkAddress = address || this.account;
    const result = await kycContractService.checkIsAdmin(checkAddress);
    return result.isAdmin;
  }

  // ========================
  // INTEGRATED WORKFLOWS
  // ========================

  /**
   * Complete property minting workflow
   * 1. Check KYC status
   * 2. Mint NFT
   * 3. Optionally register in registry
   */
  async completePropertyMinting(to, tokenURI, useRegistry = false) {
    try {
      await this.ensureInitialized();

      // Step 1: Check KYC verification
      const isKYCVerified = await this.isKYCVerified(to);
      if (!isKYCVerified) {
        throw new Error('Recipient must be KYC verified');
      }

      // Step 2: Check admin permissions
      const isAdmin = await this.isPropertyNFTAdmin();
      if (!isAdmin) {
        throw new Error('Only admins can mint properties');
      }

      // Step 3: Mint NFT
      let result;
      if (useRegistry) {
        // Use registry to mint (if admin)
        const isRegistryAdmin = await this.isRegistryAdmin();
        if (!isRegistryAdmin) {
          throw new Error('Registry admin role required');
        }
        result = await this.registerPropertyViaRegistry(to, tokenURI);
      } else {
        // Direct mint via NFT contract
        result = await this.mintPropertyNFT(to, tokenURI);
      }

      return {
        success: true,
        tokenId: result.tokenId,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        method: useRegistry ? 'registry' : 'direct'
      };

    } catch (error) {
      console.error('❌ Property minting workflow failed:', error);
      throw error;
    }
  }

  /**
   * Complete property listing workflow
   * 1. Check ownership
   * 2. Check KYC status
   * 3. Approve marketplace
   * 4. List property
   */
  async completePropertyListing(tokenId, priceInETH) {
    try {
      await this.ensureInitialized();

      // Step 1: Check ownership
      const owner = await this.getPropertyOwner(tokenId);
      if (owner.toLowerCase() !== this.account.toLowerCase()) {
        throw new Error('You must own the property to list it');
      }

      // Step 2: Check KYC verification
      const isKYCVerified = await this.isKYCVerified();
      if (!isKYCVerified) {
        throw new Error('You must be KYC verified to list properties');
      }

      // Step 3: Check if already listed
      const isListed = await this.isPropertyListedForSale(tokenId);
      if (isListed) {
        throw new Error('Property is already listed for sale');
      }

      // Step 4: Approve marketplace (if not already approved)
      console.log('Approving marketplace...');
      await this.approveMarketplaceForToken(tokenId);

      // Step 5: List property
      console.log('Listing property...');
      const result = await this.listPropertyForSale(tokenId, priceInETH);

      return {
        success: true,
        tokenId,
        price: priceInETH,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber
      };

    } catch (error) {
      console.error('❌ Property listing workflow failed:', error);
      throw error;
    }
  }

  /**
   * Complete property purchase workflow
   * 1. Check KYC status
   * 2. Verify listing details
   * 3. Execute purchase
   */
  async completePropertyPurchase(tokenId) {
    try {
      await this.ensureInitialized();

      // Step 1: Check KYC verification
      const isKYCVerified = await this.isKYCVerified();
      if (!isKYCVerified) {
        throw new Error('You must be KYC verified to purchase properties');
      }

      // Step 2: Get listing details
      const listing = await this.getPropertyListing(tokenId);
      if (!listing.active) {
        throw new Error('Property is not available for sale');
      }

      // Step 3: Check if buyer is not the seller
      if (listing.seller.toLowerCase() === this.account.toLowerCase()) {
        throw new Error('You cannot buy your own property');
      }

      // Step 4: Calculate fees
      const feeBreakdown = await this.calculateMarketplaceFees(listing.price);

      // Step 5: Execute purchase
      const result = await this.buyPropertyFromMarketplace(tokenId, listing.price);

      return {
        success: true,
        tokenId,
        price: listing.price,
        seller: listing.seller,
        buyer: this.account,
        fees: feeBreakdown,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber
      };

    } catch (error) {
      console.error('❌ Property purchase workflow failed:', error);
      throw error;
    }
  }

  /**
   * Complete escrow purchase workflow
   * 1. Check KYC status
   * 2. Create escrow deal
   * 3. Deposit funds
   * 4. Complete deal after verification
   */
  async completeEscrowPurchase(tokenId, seller, priceInETH) {
    try {
      await this.ensureInitialized();

      // Step 1: Check KYC verification for both parties
      const buyerKYC = await this.isKYCVerified();
      const sellerKYC = await this.isKYCVerified(seller);
      
      if (!buyerKYC) {
        throw new Error('Buyer must be KYC verified');
      }
      if (!sellerKYC) {
        throw new Error('Seller must be KYC verified');
      }

      // Step 2: Check property ownership
      const owner = await this.getPropertyOwner(tokenId);
      if (owner.toLowerCase() !== seller.toLowerCase()) {
        throw new Error('Seller must own the property');
      }

      // Step 3: Create escrow deal
      console.log('Creating escrow deal...');
      const createResult = await this.createEscrowDeal(tokenId, this.account, priceInETH);

      // Step 4: Deposit funds
      console.log('Depositing funds to escrow...');
      const depositResult = await this.depositFundsToEscrow(tokenId, priceInETH);

      return {
        success: true,
        tokenId,
        price: priceInETH,
        seller,
        buyer: this.account,
        escrowCreated: createResult.transactionHash,
        fundsDeposited: depositResult.transactionHash,
        status: 'funds_deposited'
      };

    } catch (error) {
      console.error('❌ Escrow purchase workflow failed:', error);
      throw error;
    }
  }

  /**
   * Complete escrow sale as seller
   * 1. Transfer property to escrow
   * 2. Complete the deal to receive funds
   */
  async completeEscrowSale(tokenId) {
    try {
      await this.ensureInitialized();

      // Step 1: Check if user is the seller
      const deal = await this.getEscrowDealDetails(tokenId);
      if (deal.seller.toLowerCase() !== this.account.toLowerCase()) {
        throw new Error('Only the seller can complete the deal');
      }

      // Step 2: Check if funds are deposited
      if (!deal.fundsDeposited) {
        throw new Error('Buyer has not deposited funds yet');
      }

      // Step 3: Complete the deal
      console.log('Completing escrow deal...');
      const result = await this.completeEscrowDeal(tokenId);

      return {
        success: true,
        tokenId,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        status: 'completed'
      };

    } catch (error) {
      console.error('❌ Escrow sale completion failed:', error);
      throw error;
    }
  }

  // ========================
  // EVENT MANAGEMENT
  // ========================

  /**
   * Setup event listeners for all contracts
   */
  setupEventListeners(callbacks = {}) {
    if (!this.isInitialized) {
      console.warn('Contracts not initialized. Call init() first.');
      return;
    }

    // Setup marketplace event listeners
    setupMarketplaceEventListeners(this.marketplaceContract, {
      onPropertyListed: callbacks.onPropertyListed,
      onPropertySold: callbacks.onPropertySold,
      onListingCancelled: callbacks.onListingCancelled,
      onPriceUpdated: callbacks.onPriceUpdated
    });

    // Setup escrow event listeners
    setupEscrowEventListeners(this.escrowContract, {
      onEscrowCreated: callbacks.onEscrowCreated,
      onFundsDeposited: callbacks.onFundsDeposited,
      onEscrowCompleted: callbacks.onEscrowCompleted,
      onEscrowCancelled: callbacks.onEscrowCancelled,
      onFundsRefunded: callbacks.onFundsRefunded
    });

    // Setup KYC event listeners
    kycContractService.setupEventListeners({
      onUserVerified: callbacks.onUserVerified,
      onVerificationRevoked: callbacks.onVerificationRevoked,
      onAdminAdded: callbacks.onAdminAdded,
      onAdminRemoved: callbacks.onAdminRemoved
    });

    console.log('✅ Event listeners setup completed');
  }

  /**
   * Remove all event listeners
   */
  removeAllEventListeners() {
    removeMarketplaceEventListeners(this.marketplaceContract);
    removeEscrowEventListeners(this.escrowContract);
    kycContractService.removeEventListeners();
    console.log('✅ All event listeners removed');
  }

  // ========================
  // UTILITY FUNCTIONS
  // ========================

  /**
   * Get current account
   */
  getCurrentAccount() {
    return this.account;
  }

  /**
   * Get contract addresses
   */
  getContractAddresses() {
    return {
      propertyNFT: propertyNFTAddress,
      propertyRegistry: propertyRegistryAddress,
      marketplace: marketplaceAddress,
      escrow: escrowAddress,
      kyc: kycContractService.getContractAddress()
    };
  }

  /**
   * Get comprehensive user status
   */
  async getUserStatus(address = null) {
    try {
      await this.ensureInitialized();
      const checkAddress = address || this.account;

      const [
        isKYCVerified,
        isKYCAdmin,
        isNFTAdmin,
        isRegistryAdmin,
        nftBalance
      ] = await Promise.all([
        this.isKYCVerified(checkAddress),
        this.isKYCAdmin(checkAddress),
        this.isPropertyNFTAdmin(checkAddress),
        this.isRegistryAdmin(checkAddress),
        this.propertyNFTContract.balanceOf(checkAddress)
      ]);

      return {
        address: checkAddress,
        kyc: {
          isVerified: isKYCVerified,
          isAdmin: isKYCAdmin
        },
        nft: {
          isAdmin: isNFTAdmin,
          balance: nftBalance.toString()
        },
        registry: {
          isAdmin: isRegistryAdmin
        },
        isAnyAdmin: isKYCAdmin || isNFTAdmin || isRegistryAdmin
      };

    } catch (error) {
      console.error('❌ Failed to get user status:', error);
      throw error;
    }
  }

  /**
   * Get contract statistics
   */
  async getContractStats() {
    try {
      await this.ensureInitialized();

      const [
        totalProperties,
        activeListings,
        marketplaceFee,
        escrowFee,
        allEscrowDeals
      ] = await Promise.all([
        this.getTotalProperties(),
        this.getActiveMarketplaceListings(),
        this.marketplaceContract.marketplaceFeePercent(),
        this.getEscrowFeePercent(),
        this.getAllEscrowDeals()
      ]);

      return {
        totalProperties: totalProperties,
        totalListings: activeListings.length,
        totalEscrowDeals: allEscrowDeals.length,
        marketplaceFeePercent: (Number(marketplaceFee) / 100).toString() + '%',
        escrowFeePercent: (Number(escrowFee) / 100).toString() + '%',
        contractAddresses: this.getContractAddresses()
      };

    } catch (error) {
      console.error('❌ Failed to get contract stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
const contractService = new ContractService();
export default contractService;