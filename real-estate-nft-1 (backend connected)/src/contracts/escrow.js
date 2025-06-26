// contracts/escrow.js - Complete Escrow contract integration
import { ethers } from 'ethers';

// Your deployed escrow contract address
export const escrowAddress = "0x32f99155646d147b8A4846470b64a96dD9cBa414";

// Complete escrow contract ABI from your Solidity file
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

// Connect to escrow contract
export const connectToEscrow = async (provider) => {
  try {
    console.log('🔗 Connecting to escrow contract...');
    
    if (!provider) {
      throw new Error('Provider is required');
    }

    // Get signer for write operations
    const signer = await provider.getSigner();
    
    // Create contract instance with signer
    const escrowContract = new ethers.Contract(
      escrowAddress,
      escrowABI,
      signer
    );

    // Test contract responsiveness
    try {
      await escrowContract.feePercent();
      console.log('✅ Escrow contract connected successfully');
    } catch (error) {
      console.warn('⚠️ Escrow contract test failed:', error);
    }

    return escrowContract;
    
  } catch (error) {
    console.error('❌ Failed to connect to escrow contract:', error);
    throw error;
  }
};

// Get escrow contract (read-only)
export const getEscrowContract = (provider) => {
  return new ethers.Contract(escrowAddress, escrowABI, provider);
};

// Create escrow deal
export const createEscrow = async (escrowContract, tokenId, buyer, priceInETH) => {
  try {
    console.log(`📝 Creating escrow for token ${tokenId}, buyer: ${buyer}, price: ${priceInETH} ETH`);
    
    const priceInWei = ethers.parseEther(priceInETH.toString());
    const tx = await escrowContract.createEscrow(
      BigInt(tokenId),
      buyer,
      priceInWei
    );
    
    console.log('Transaction submitted:', tx.hash);
    const receipt = await tx.wait();
    
    return {
      success: true,
      tokenId: tokenId.toString(),
      buyer,
      price: priceInETH,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
    
  } catch (error) {
    console.error('❌ Error creating escrow:', error);
    
    if (error.message.includes('User not KYC verified')) {
      throw new Error('Both buyer and seller must be KYC verified');
    } else if (error.message.includes('Not owner')) {
      throw new Error('You must own this property to create an escrow');
    } else if (error.message.includes('Escrow exists')) {
      throw new Error('An escrow already exists for this property');
    } else if (error.message.includes('Invalid price')) {
      throw new Error('Price must be greater than 0');
    }
    
    throw error;
  }
};

// Deposit funds to escrow
export const depositFunds = async (escrowContract, tokenId, priceInETH) => {
  try {
    console.log(`💰 Depositing ${priceInETH} ETH to escrow for token ${tokenId}`);
    
    // Get deal details to calculate total amount (price + fee)
    const deal = await escrowContract.getDeal(tokenId);
    const totalAmount = deal.price + deal.fee;
    
    const tx = await escrowContract.depositFunds(BigInt(tokenId), {
      value: totalAmount
    });
    
    console.log('Deposit transaction submitted:', tx.hash);
    const receipt = await tx.wait();
    
    return {
      success: true,
      tokenId: tokenId.toString(),
      amount: ethers.formatEther(totalAmount),
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
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
};

// Complete escrow deal
export const completeDeal = async (escrowContract, tokenId) => {
  try {
    console.log(`✅ Completing escrow deal for token ${tokenId}`);
    
    const tx = await escrowContract.completeDeal(BigInt(tokenId));
    
    console.log('Complete transaction submitted:', tx.hash);
    const receipt = await tx.wait();
    
    return {
      success: true,
      tokenId: tokenId.toString(),
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
    
  } catch (error) {
    console.error('❌ Error completing deal:', error);
    
    if (error.message.includes('Not funded')) {
      throw new Error('Funds must be deposited before completing the deal');
    } else if (error.message.includes('Not authorized')) {
      throw new Error('Only the buyer or seller can complete the deal');
    } else if (error.message.includes('Seller not KYC verified')) {
      throw new Error('Seller must remain KYC verified to complete the deal');
    } else if (error.message.includes('Buyer not KYC verified')) {
      throw new Error('Buyer must remain KYC verified to complete the deal');
    }
    
    throw error;
  }
};

// Cancel escrow deal
export const cancelEscrow = async (escrowContract, tokenId) => {
  try {
    console.log(`❌ Cancelling escrow for token ${tokenId}`);
    
    const tx = await escrowContract.cancelEscrow(BigInt(tokenId));
    
    console.log('Cancel transaction submitted:', tx.hash);
    const receipt = await tx.wait();
    
    return {
      success: true,
      tokenId: tokenId.toString(),
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
    
  } catch (error) {
    console.error('❌ Error cancelling escrow:', error);
    
    if (error.message.includes('Cannot cancel')) {
      throw new Error('Cannot cancel escrow after funds have been deposited');
    } else if (error.message.includes('Not authorized')) {
      throw new Error('Only the buyer or seller can cancel the escrow');
    }
    
    throw error;
  }
};

// Refund buyer
export const refundBuyer = async (escrowContract, tokenId) => {
  try {
    console.log(`🔄 Refunding buyer for token ${tokenId}`);
    
    const tx = await escrowContract.refundBuyer(BigInt(tokenId));
    
    console.log('Refund transaction submitted:', tx.hash);
    const receipt = await tx.wait();
    
    return {
      success: true,
      tokenId: tokenId.toString(),
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
    
  } catch (error) {
    console.error('❌ Error refunding buyer:', error);
    
    if (error.message.includes('Only seller can refund')) {
      throw new Error('Only the seller can initiate a refund');
    } else if (error.message.includes('Not funded')) {
      throw new Error('No funds to refund - deal not funded yet');
    }
    
    throw error;
  }
};

// Get deal details
export const getDealDetails = async (escrowContract, tokenId) => {
  try {
    const deal = await escrowContract.getDeal(tokenId);
    
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
    
    if (error.message.includes('nonexistent key')) {
      return null; // No deal exists for this token
    }
    
    throw error;
  }
};

// Get all deals for a user
export const getAllDeals = async (escrowContract) => {
  try {
    // Note: This is a simplified version. In a real implementation,
    // you'd need to either track deals in your backend or use events
    console.log('📋 Getting all escrow deals...');
    
    // For now, return empty array as we need to track deals separately
    // You should implement proper deal tracking in your backend
    return [];
    
  } catch (error) {
    console.error('❌ Error getting all deals:', error);
    return [];
  }
};

// Get escrow fee percentage
export const getEscrowFeePercent = async (escrowContract) => {
  try {
    const feePercent = await escrowContract.feePercent();
    return Number(feePercent); // Returns basis points (250 = 2.5%)
  } catch (error) {
    console.error('Error getting escrow fee:', error);
    return 250; // Default 2.5%
  }
};

// Setup event listeners for escrow events
export const setupEscrowEventListeners = (escrowContract, callbacks = {}) => {
  if (!escrowContract) return;

  if (callbacks.onEscrowCreated) {
    escrowContract.on('EscrowCreated', (tokenId, seller, buyer, price, event) => {
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
    escrowContract.on('FundsDeposited', (tokenId, amount, event) => {
      callbacks.onFundsDeposited({
        tokenId: tokenId.toString(),
        amount: ethers.formatEther(amount),
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
    });
  }

  if (callbacks.onEscrowCompleted) {
    escrowContract.on('EscrowCompleted', (tokenId, event) => {
      callbacks.onEscrowCompleted({
        tokenId: tokenId.toString(),
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
    });
  }

  if (callbacks.onEscrowCancelled) {
    escrowContract.on('EscrowCancelled', (tokenId, event) => {
      callbacks.onEscrowCancelled({
        tokenId: tokenId.toString(),
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
    });
  }

  if (callbacks.onFundsRefunded) {
    escrowContract.on('FundsRefunded', (tokenId, amount, event) => {
      callbacks.onFundsRefunded({
        tokenId: tokenId.toString(),
        amount: ethers.formatEther(amount),
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
    });
  }

  console.log('✅ Escrow event listeners setup completed');
};

// Remove escrow event listeners
export const removeEscrowEventListeners = (escrowContract) => {
  if (escrowContract) {
    escrowContract.removeAllListeners();
    console.log('✅ Escrow event listeners removed');
  }
};

export default {
  escrowAddress,
  escrowABI,
  connectToEscrow,
  getEscrowContract,
  createEscrow,
  depositFunds,
  completeDeal,
  cancelEscrow,
  refundBuyer,
  getDealDetails,
  getAllDeals,
  getEscrowFeePercent,
  setupEscrowEventListeners,
  removeEscrowEventListeners
};