// contracts/marketplace.js - Enhanced with Escrow Integration
import { ethers } from 'ethers';

// Contract addresses
export const marketplaceAddress = "0x6f38283c92186AEc00FFD196F444Ed0773919FCE";
export const escrowAddress = "0x32f99155646d147b8A4846470b64a96dD9cBa414";

// Marketplace ABI (existing)
export const marketplaceABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "_propertyNFT", "type": "address"},
      {"internalType": "address", "name": "_kycContract", "type": "address"}
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "seller", "type": "address"}
    ],
    "name": "ListingCancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "oldPrice", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "newPrice", "type": "uint256"}
    ],
    "name": "PriceUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "seller", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "price", "type": "uint256"}
    ],
    "name": "PropertyListed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "buyer", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "seller", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "price", "type": "uint256"}
    ],
    "name": "PropertySold",
    "type": "event"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "buyProperty",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "cancelListing",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "feeRecipient",
    "outputs": [
      {"internalType": "address", "name": "", "type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getActiveListings",
    "outputs": [
      {"internalType": "uint256[]", "name": "", "type": "uint256[]"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "kycContract",
    "outputs": [
      {"internalType": "contract IKYCVerification", "name": "", "type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"internalType": "uint256", "name": "price", "type": "uint256"}
    ],
    "name": "listProperty",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "", "type": "uint256"}
    ],
    "name": "listedTokenIds",
    "outputs": [
      {"internalType": "uint256", "name": "", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "", "type": "uint256"}
    ],
    "name": "listings",
    "outputs": [
      {"internalType": "address", "name": "seller", "type": "address"},
      {"internalType": "uint256", "name": "price", "type": "uint256"},
      {"internalType": "bool", "name": "active", "type": "bool"},
      {"internalType": "uint256", "name": "listedAt", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "marketplaceFeePercent",
    "outputs": [
      {"internalType": "uint256", "name": "", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "propertyNFT",
    "outputs": [
      {"internalType": "contract IPropertyNFT", "name": "", "type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Escrow ABI (integrated)
export const escrowABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "cancelEscrow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "completeDeal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"internalType": "address", "name": "buyer", "type": "address"},
      {"internalType": "uint256", "name": "price", "type": "uint256"}
    ],
    "name": "createEscrow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "depositFunds",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "getDeal",
    "outputs": [
      {
        "components": [
          {"internalType": "address", "name": "seller", "type": "address"},
          {"internalType": "address", "name": "buyer", "type": "address"},
          {"internalType": "uint256", "name": "price", "type": "uint256"},
          {"internalType": "uint256", "name": "fee", "type": "uint256"},
          {"internalType": "enum Escrow.EscrowStatus", "name": "status", "type": "uint8"},
          {"internalType": "bool", "name": "fundsDeposited", "type": "bool"},
          {"internalType": "uint256", "name": "createdAt", "type": "uint256"}
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
    "name": "feePercent",
    "outputs": [
      {"internalType": "uint256", "name": "", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Enhanced marketplace functions with escrow integration
export const PurchaseMethod = {
  DIRECT: 'direct',
  ESCROW: 'escrow'
};

// Debug marketplace contract
export const debugMarketplaceContract = async (provider) => {
  try {
    console.log('🔍 Debugging marketplace contract...');
    console.log('Contract Address:', marketplaceAddress);
    
    const bytecode = await provider.getCode(marketplaceAddress);
    console.log('Bytecode length:', bytecode.length);
    
    if (bytecode === '0x' || bytecode.length <= 2) {
      console.error('❌ NO CONTRACT deployed at address:', marketplaceAddress);
      return false;
    }
    
    console.log('✅ Contract exists');
    
    const contract = new ethers.Contract(marketplaceAddress, marketplaceABI, provider);
    
    try {
      const feePercent = await contract.marketplaceFeePercent();
      console.log('✅ marketplaceFeePercent():', feePercent.toString());
    } catch (error) {
      console.error('❌ marketplaceFeePercent() failed:', error.message);
    }
    
    try {
      const activeListings = await contract.getActiveListings();
      console.log('✅ getActiveListings():', activeListings.map(id => id.toString()));
      console.log('Number of active listings:', activeListings.length);
    } catch (error) {
      console.error('❌ getActiveListings() failed:', error.message);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    return false;
  }
};

// Connect to marketplace contract
export const connectToMarketplace = async (provider) => {
  try {
    console.log('🔗 Connecting to marketplace contract...');
    
    if (!provider) {
      throw new Error('Provider is required');
    }

    const debugResult = await debugMarketplaceContract(provider);
    if (!debugResult) {
      console.warn('⚠️ Contract debug failed, but continuing...');
    }

    const signer = await provider.getSigner();
    const marketplaceContract = new ethers.Contract(
      marketplaceAddress,
      marketplaceABI,
      signer
    );

    console.log('✅ Marketplace contract connected:', marketplaceAddress);
    return marketplaceContract;
    
  } catch (error) {
    console.error('❌ Failed to connect to marketplace:', error);
    throw error;
  }
};

// Connect to escrow contract
export const connectToEscrow = async (provider) => {
  try {
    console.log('🔗 Connecting to escrow contract...');
    
    if (!provider) {
      throw new Error('Provider is required');
    }

    const signer = await provider.getSigner();
    const escrowContract = new ethers.Contract(
      escrowAddress,
      escrowABI,
      signer
    );

    console.log('✅ Escrow contract connected:', escrowAddress);
    return escrowContract;
    
  } catch (error) {
    console.error('❌ Failed to connect to escrow:', error);
    throw error;
  }
};

// Get marketplace contract (read-only)
export const getMarketplaceContract = (provider) => {
  return new ethers.Contract(marketplaceAddress, marketplaceABI, provider);
};

// Get escrow contract (read-only)
export const getEscrowContract = (provider) => {
  return new ethers.Contract(escrowAddress, escrowABI, provider);
};

// Enhanced listing function with escrow support
export const getAllListingsWithDetails = async (marketplaceContract, escrowContract = null) => {
  try {
    console.log('📋 Fetching active listings with escrow data...');
    
    try {
      const feePercent = await marketplaceContract.marketplaceFeePercent();
      console.log('Contract responsive, fee:', feePercent.toString());
    } catch (error) {
      console.error('Contract not responsive:', error);
      throw new Error('Marketplace contract is not responding');
    }
    
    let activeTokenIds;
    try {
      activeTokenIds = await marketplaceContract.getActiveListings();
      console.log('Active token IDs:', activeTokenIds.map(id => id.toString()));
    } catch (error) {
      console.error('❌ Failed to get active listings:', error);
      return [];
    }
    
    if (activeTokenIds.length === 0) {
      console.log('No active listings found');
      return [];
    }

    const listings = [];
    
    for (const tokenId of activeTokenIds) {
      try {
        const listing = await marketplaceContract.listings(tokenId);
        
        // Enhanced listing object with escrow support
        const enhancedListing = {
          tokenId: tokenId.toString(),
          seller: listing.seller,
          price: ethers.formatEther(listing.price),
          priceInWei: listing.price.toString(),
          active: listing.active,
          listedAt: Number(listing.listedAt) * 1000,
          // Escrow data (will be populated if escrowContract is available)
          hasActiveEscrow: false,
          escrowStatus: null,
          escrowBuyer: null,
          escrowFundsDeposited: false,
          purchaseOptions: {
            directPurchase: true,
            escrowPurchase: true
          }
        };

        // If escrow contract is available, check for active escrow
        if (escrowContract) {
          try {
            const escrowDeal = await escrowContract.getDeal(tokenId);
            
            // Check if there's an active escrow (seller not zero address)
            if (escrowDeal.seller !== '0x0000000000000000000000000000000000000000') {
              const escrowStatus = ['PENDING', 'FUNDED', 'COMPLETED', 'CANCELLED', 'REFUNDED'][escrowDeal.status] || 'UNKNOWN';
              
              enhancedListing.hasActiveEscrow = true;
              enhancedListing.escrowStatus = escrowStatus;
              enhancedListing.escrowBuyer = escrowDeal.buyer;
              enhancedListing.escrowFundsDeposited = escrowDeal.fundsDeposited;
              enhancedListing.escrowCreatedAt = Number(escrowDeal.createdAt) * 1000;
              enhancedListing.escrowPrice = ethers.formatEther(escrowDeal.price);
              enhancedListing.escrowFee = ethers.formatEther(escrowDeal.fee);
              
              // Adjust purchase options based on escrow status
              if (['PENDING', 'FUNDED'].includes(escrowStatus)) {
                enhancedListing.purchaseOptions.directPurchase = false; // Disable direct purchase if escrow is active
              }
            }
          } catch (escrowError) {
            console.warn(`No escrow data for token ${tokenId}:`, escrowError.message);
            // Continue without escrow data
          }
        }
        
        listings.push(enhancedListing);
        
      } catch (error) {
        console.warn(`Failed to get details for token ${tokenId}:`, error);
      }
    }
    
    console.log(`✅ Fetched ${listings.length} active listings with escrow data`);
    return listings;
    
  } catch (error) {
    console.error('❌ Error fetching listings:', error);
    return [];
  }
};

// List a property for sale
export const listProperty = async (marketplaceContract, tokenId, priceInWei) => {
  try {
    console.log(`📝 Listing property ${tokenId} for ${ethers.formatEther(priceInWei)} ETH`);
    
    const tokenIdBN = BigInt(tokenId);
    const priceBN = BigInt(priceInWei);
    
    const tx = await marketplaceContract.listProperty(tokenIdBN, priceBN);
    console.log('Transaction submitted:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('✅ Property listed successfully');
    
    return receipt;
    
  } catch (error) {
    console.error('❌ Error listing property:', error);
    
    if (error.message.includes('Not KYC verified')) {
      throw new Error('KYC verification required to list properties');
    } else if (error.message.includes('Not the property owner')) {
      throw new Error('You must own this property to list it');
    } else if (error.message.includes('Property already listed')) {
      throw new Error('This property is already listed for sale');
    } else if (error.message.includes('Marketplace not approved')) {
      throw new Error('Please approve the marketplace to transfer your NFT first');
    }
    
    throw error;
  }
};

// Enhanced buy property function with purchase method selection
export const buyProperty = async (marketplaceContract, tokenId, priceInWei, method = PurchaseMethod.DIRECT) => {
  try {
    console.log(`💰 Buying property ${tokenId} via ${method} for ${ethers.formatEther(priceInWei)} ETH`);
    
    const tokenIdBN = BigInt(tokenId);
    const priceBN = BigInt(priceInWei);
    
    if (method === PurchaseMethod.DIRECT) {
      // Direct marketplace purchase
      const tx = await marketplaceContract.buyProperty(tokenIdBN, {
        value: priceBN
      });
      console.log('Direct purchase transaction submitted:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Property purchased directly');
      
      return receipt;
    } else {
      // For escrow purchase, we just return success here
      // The actual escrow creation will be handled by the escrow context
      console.log('✅ Escrow purchase method selected');
      return { method: 'escrow', tokenId, price: priceInWei };
    }
    
  } catch (error) {
    console.error('❌ Error buying property:', error);
    
    if (error.message.includes('Not KYC verified')) {
      throw new Error('KYC verification required to buy properties');
    } else if (error.message.includes('Property not listed')) {
      throw new Error('This property is not currently for sale');
    } else if (error.message.includes('Incorrect payment amount')) {
      throw new Error('Payment amount must exactly match the listing price');
    } else if (error.message.includes('Cannot buy your own property')) {
      throw new Error('You cannot buy your own property');
    }
    
    throw error;
  }
};

// Cancel a listing
export const cancelListing = async (marketplaceContract, tokenId) => {
  try {
    console.log(`❌ Cancelling listing for property ${tokenId}`);
    
    const tokenIdBN = BigInt(tokenId);
    const tx = await marketplaceContract.cancelListing(tokenIdBN);
    console.log('Transaction submitted:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('✅ Listing cancelled successfully');
    
    return receipt;
    
  } catch (error) {
    console.error('❌ Error cancelling listing:', error);
    
    if (error.message.includes('Property not listed')) {
      throw new Error('This property is not currently listed');
    } else if (error.message.includes('Not the seller')) {
      throw new Error('Only the seller can cancel this listing');
    }
    
    throw error;
  }
};

// Escrow-specific functions

// Create escrow deal
export const createEscrowDeal = async (escrowContract, tokenId, buyerAddress, priceInWei) => {
  try {
    console.log(`🔄 Creating escrow for property ${tokenId}`);
    
    const tokenIdBN = BigInt(tokenId);
    const priceBN = BigInt(priceInWei);
    
    const tx = await escrowContract.createEscrow(tokenIdBN, buyerAddress, priceBN);
    console.log('Escrow creation transaction submitted:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('✅ Escrow deal created successfully');
    
    return receipt;
    
  } catch (error) {
    console.error('❌ Error creating escrow:', error);
    
    if (error.message.includes('User not KYC verified')) {
      throw new Error('Both buyer and seller must be KYC verified for escrow');
    } else if (error.message.includes('Not owner')) {
      throw new Error('Only the property owner can create an escrow');
    } else if (error.message.includes('Escrow exists')) {
      throw new Error('An escrow already exists for this property');
    }
    
    throw error;
  }
};

// Get escrow deal details
export const getEscrowDeal = async (escrowContract, tokenId) => {
  try {
    const deal = await escrowContract.getDeal(BigInt(tokenId));
    
    if (deal.seller === '0x0000000000000000000000000000000000000000') {
      return null; // No escrow exists
    }
    
    const escrowStatus = ['PENDING', 'FUNDED', 'COMPLETED', 'CANCELLED', 'REFUNDED'][deal.status] || 'UNKNOWN';
    
    return {
      tokenId: tokenId.toString(),
      seller: deal.seller,
      buyer: deal.buyer,
      price: ethers.formatEther(deal.price),
      priceInWei: deal.price.toString(),
      fee: ethers.formatEther(deal.fee),
      feeInWei: deal.fee.toString(),
      status: escrowStatus,
      fundsDeposited: deal.fundsDeposited,
      createdAt: Number(deal.createdAt) * 1000,
      totalCost: ethers.formatEther(deal.price + deal.fee),
      totalCostInWei: (deal.price + deal.fee).toString()
    };
    
  } catch (error) {
    console.error('Error getting escrow deal:', error);
    return null;
  }
};

// Check if property has active escrow
export const hasActiveEscrow = async (escrowContract, tokenId) => {
  try {
    const deal = await getEscrowDeal(escrowContract, tokenId);
    return deal && ['PENDING', 'FUNDED'].includes(deal.status);
  } catch (error) {
    console.error('Error checking active escrow:', error);
    return false;
  }
};

// Get marketplace fee percentage
export const getMarketplaceFee = async (marketplaceContract) => {
  try {
    const feePercent = await marketplaceContract.marketplaceFeePercent();
    return Number(feePercent) / 100;
  } catch (error) {
    console.error('Error getting marketplace fee:', error);
    return 2.5;
  }
};

// Get escrow fee percentage
export const getEscrowFee = async (escrowContract) => {
  try {
    const feePercent = await escrowContract.feePercent();
    return Number(feePercent) / 100;
  } catch (error) {
    console.error('Error getting escrow fee:', error);
    return 2.5;
  }
};

// Calculate purchase costs for both methods
export const calculatePurchaseCosts = async (marketplaceContract, escrowContract, priceInEth) => {
  try {
    const priceWei = ethers.parseEther(priceInEth);
    
    // Get fees
    const [marketplaceFeePercent, escrowFeePercent] = await Promise.all([
      getMarketplaceFee(marketplaceContract),
      escrowContract ? getEscrowFee(escrowContract) : Promise.resolve(2.5)
    ]);
    
    // Calculate marketplace costs (direct purchase)
    const marketplaceFeeWei = (priceWei * BigInt(Math.floor(marketplaceFeePercent * 100))) / BigInt(10000);
    const marketplaceTotalWei = priceWei + marketplaceFeeWei;
    
    // Calculate escrow costs
    const escrowFeeWei = (priceWei * BigInt(Math.floor(escrowFeePercent * 100))) / BigInt(10000);
    const escrowTotalWei = priceWei + escrowFeeWei;
    
    return {
      price: {
        wei: priceWei.toString(),
        eth: priceInEth
      },
      marketplace: {
        fee: {
          wei: marketplaceFeeWei.toString(),
          eth: ethers.formatEther(marketplaceFeeWei),
          percent: marketplaceFeePercent
        },
        total: {
          wei: marketplaceTotalWei.toString(),
          eth: ethers.formatEther(marketplaceTotalWei)
        }
      },
      escrow: {
        fee: {
          wei: escrowFeeWei.toString(),
          eth: ethers.formatEther(escrowFeeWei),
          percent: escrowFeePercent
        },
        total: {
          wei: escrowTotalWei.toString(),
          eth: ethers.formatEther(escrowTotalWei)
        }
      }
    };
    
  } catch (error) {
    console.error('Error calculating purchase costs:', error);
    return null;
  }
};

// Get contract addresses
export const getContractAddresses = async (marketplaceContract) => {
  try {
    const [propertyNFTAddress, kycContractAddress, feeRecipient] = await Promise.all([
      marketplaceContract.propertyNFT(),
      marketplaceContract.kycContract(),
      marketplaceContract.feeRecipient()
    ]);
    
    return {
      marketplace: marketplaceAddress,
      escrow: escrowAddress,
      propertyNFT: propertyNFTAddress,
      kycContract: kycContractAddress,
      feeRecipient: feeRecipient
    };
  } catch (error) {
    console.error('Error getting contract addresses:', error);
    return null;
  }
};

// Get specific listing details with escrow information
export const getListingDetails = async (marketplaceContract, escrowContract, tokenId) => {
  try {
    const listing = await marketplaceContract.listings(tokenId);
    
    const listingData = {
      tokenId: tokenId.toString(),
      seller: listing.seller,
      price: ethers.formatEther(listing.price),
      priceInWei: listing.price.toString(),
      active: listing.active,
      listedAt: Number(listing.listedAt) * 1000,
      hasActiveEscrow: false,
      escrowData: null
    };
    
    // Get escrow data if contract is available
    if (escrowContract) {
      const escrowData = await getEscrowDeal(escrowContract, tokenId);
      if (escrowData) {
        listingData.hasActiveEscrow = ['PENDING', 'FUNDED'].includes(escrowData.status);
        listingData.escrowData = escrowData;
      }
    }
    
    return listingData;
  } catch (error) {
    console.error(`Error getting listing details for token ${tokenId}:`, error);
    return null;
  }
};

// Check marketplace approval
export const checkMarketplaceApproval = async (propertyNFTContract, tokenId, userAddress, marketplaceAddress) => {
  try {
    const approved = await propertyNFTContract.getApproved(tokenId);
    if (approved.toLowerCase() === marketplaceAddress.toLowerCase()) {
      return true;
    }
    
    const approvedForAll = await propertyNFTContract.isApprovedForAll(userAddress, marketplaceAddress);
    return approvedForAll;
    
  } catch (error) {
    console.error('Error checking marketplace approval:', error);
    return false;
  }
};

// Enhanced default export with escrow functions
export default {
  // Addresses
  marketplaceAddress,
  escrowAddress,
  
  // ABIs
  marketplaceABI,
  escrowABI,
  
  // Purchase methods
  PurchaseMethod,
  
  // Connection functions
  connectToMarketplace,
  connectToEscrow,
  getMarketplaceContract,
  getEscrowContract,
  
  // Enhanced marketplace functions
  getAllListingsWithDetails,
  listProperty,
  buyProperty,
  cancelListing,
  
  // Escrow functions
  createEscrowDeal,
  getEscrowDeal,
  hasActiveEscrow,
  
  // Utility functions
  getMarketplaceFee,
  getEscrowFee,
  calculatePurchaseCosts,
  getContractAddresses,
  getListingDetails,
  checkMarketplaceApproval,
  debugMarketplaceContract
};