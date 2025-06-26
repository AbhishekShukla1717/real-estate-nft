// context/EscrowContext.js - Fixed with correct WalletContext import
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { WalletContext } from './WalletContext';
import { toast } from 'react-toastify';

// Contract addresses from your deployed contracts
const ESCROW_CONTRACT_ADDRESS = "0x32f99155646d147b8A4846470b64a96dD9cBa414";
const MARKETPLACE_CONTRACT_ADDRESS = "0x6f38283c92186AEc00FFD196F444Ed0773919FCE";

// Escrow Contract ABI
const ESCROW_ABI = [
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
    "name": "refundBuyer",
    "outputs": [],
    "stateMutability": "nonpayable",
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
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"indexed": false, "internalType": "address", "name": "seller", "type": "address"},
      {"indexed": false, "internalType": "address", "name": "buyer", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "price", "type": "uint256"}
    ],
    "name": "EscrowCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "FundsDeposited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "EscrowCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "EscrowCancelled",
    "type": "event"
  }
];

// Escrow Status mapping
const ESCROW_STATUS = {
  0: 'PENDING',
  1: 'FUNDED',
  2: 'COMPLETED',
  3: 'CANCELLED',
  4: 'REFUNDED'
};

// Create context
export const EscrowContext = createContext(null);

export const EscrowProvider = ({ children }) => {
  // Get wallet context - using the correct structure
  const walletContext = useContext(WalletContext);
  
  if (!walletContext) {
    throw new Error('EscrowProvider must be used within WalletProvider');
  }

  const { walletState, connectWallet, disconnectWallet, loading: walletLoading } = walletContext;

  // Escrow state
  const [escrowContract, setEscrowContract] = useState(null);
  const [userEscrows, setUserEscrows] = useState([]);
  const [escrowStats, setEscrowStats] = useState({
    totalActive: 0,
    pendingAsBuyer: 0,
    pendingAsSeller: 0,
    totalVolume: '0'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize escrow contract when wallet connects
  useEffect(() => {
    const initializeEscrowContract = async () => {
      if (walletState.isConnected && walletState.signer) {
        try {
          console.log('🔄 Initializing escrow contract...');
          const contract = new ethers.Contract(
            ESCROW_CONTRACT_ADDRESS,
            ESCROW_ABI,
            walletState.signer
          );
          
          setEscrowContract(contract);
          setError(null);
          console.log('✅ Escrow contract initialized:', ESCROW_CONTRACT_ADDRESS);
        } catch (error) {
          console.error('❌ Failed to initialize escrow contract:', error);
          setError('Failed to connect to escrow contract');
          setEscrowContract(null);
        }
      } else {
        setEscrowContract(null);
        setUserEscrows([]);
        setEscrowStats({
          totalActive: 0,
          pendingAsBuyer: 0,
          pendingAsSeller: 0,
          totalVolume: '0'
        });
      }
    };

    initializeEscrowContract();
  }, [walletState.isConnected, walletState.signer]);

  // Create escrow deal
  const createEscrow = useCallback(async (tokenId, buyerAddress, priceInWei) => {
    if (!escrowContract) {
      throw new Error('Escrow contract not available');
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Creating escrow deal...');
      console.log('Token ID:', tokenId);
      console.log('Buyer:', buyerAddress);
      console.log('Price:', ethers.formatEther(priceInWei), 'ETH');

      const tx = await escrowContract.createEscrow(
        BigInt(tokenId),
        buyerAddress,
        BigInt(priceInWei)
      );

      toast.info('Creating escrow deal...', { autoClose: 3000 });
      console.log('Transaction submitted:', tx.hash);

      const receipt = await tx.wait();
      console.log('✅ Escrow created successfully');
      
      toast.success('Escrow deal created successfully!');
      
      // Refresh user escrows
      if (walletState.address) {
        await getUserEscrows(walletState.address);
      }

      return receipt;
    } catch (error) {
      console.error('❌ Error creating escrow:', error);
      
      let errorMessage = 'Failed to create escrow deal';
      if (error.message.includes('User not KYC verified')) {
        errorMessage = 'Both buyer and seller must be KYC verified';
      } else if (error.message.includes('Not owner')) {
        errorMessage = 'You must own this property to create an escrow';
      } else if (error.message.includes('Escrow exists')) {
        errorMessage = 'An escrow already exists for this property';
      } else if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction was cancelled by user';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [escrowContract, walletState.address]);

  // Deposit funds into escrow
  const depositFunds = useCallback(async (tokenId, totalAmountInWei) => {
    if (!escrowContract) {
      throw new Error('Escrow contract not available');
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Depositing funds...');
      console.log('Token ID:', tokenId);
      console.log('Amount:', ethers.formatEther(totalAmountInWei), 'ETH');

      const tx = await escrowContract.depositFunds(BigInt(tokenId), {
        value: BigInt(totalAmountInWei)
      });

      toast.info('Depositing funds...', { autoClose: 3000 });
      console.log('Transaction submitted:', tx.hash);

      const receipt = await tx.wait();
      console.log('✅ Funds deposited successfully');
      
      toast.success('Funds deposited successfully!');
      
      // Refresh user escrows
      if (walletState.address) {
        await getUserEscrows(walletState.address);
      }

      return receipt;
    } catch (error) {
      console.error('❌ Error depositing funds:', error);
      
      let errorMessage = 'Failed to deposit funds';
      if (error.message.includes('Not buyer')) {
        errorMessage = 'Only the buyer can deposit funds';
      } else if (error.message.includes('Invalid status')) {
        errorMessage = 'Escrow is not in the correct status for funding';
      } else if (error.message.includes('Wrong amount')) {
        errorMessage = 'Incorrect payment amount (price + fee required)';
      } else if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction was cancelled by user';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [escrowContract, walletState.address]);

  // Complete escrow deal
  const completeDeal = useCallback(async (tokenId) => {
    if (!escrowContract) {
      throw new Error('Escrow contract not available');
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Completing escrow deal...');
      console.log('Token ID:', tokenId);

      const tx = await escrowContract.completeDeal(BigInt(tokenId));

      toast.info('Completing deal...', { autoClose: 3000 });
      console.log('Transaction submitted:', tx.hash);

      const receipt = await tx.wait();
      console.log('✅ Deal completed successfully');
      
      toast.success('Deal completed successfully!');
      
      // Refresh user escrows
      if (walletState.address) {
        await getUserEscrows(walletState.address);
      }

      return receipt;
    } catch (error) {
      console.error('❌ Error completing deal:', error);
      
      let errorMessage = 'Failed to complete deal';
      if (error.message.includes('Not funded')) {
        errorMessage = 'Escrow must be funded before completion';
      } else if (error.message.includes('Not authorized')) {
        errorMessage = 'Only buyer or seller can complete the deal';
      } else if (error.message.includes('User not KYC verified')) {
        errorMessage = 'Both parties must remain KYC verified to complete';
      } else if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction was cancelled by user';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [escrowContract, walletState.address]);

  // Cancel escrow deal
  const cancelEscrow = useCallback(async (tokenId) => {
    if (!escrowContract) {
      throw new Error('Escrow contract not available');
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Cancelling escrow...');
      console.log('Token ID:', tokenId);

      const tx = await escrowContract.cancelEscrow(BigInt(tokenId));

      toast.info('Cancelling escrow...', { autoClose: 3000 });
      console.log('Transaction submitted:', tx.hash);

      const receipt = await tx.wait();
      console.log('✅ Escrow cancelled successfully');
      
      toast.success('Escrow cancelled successfully!');
      
      // Refresh user escrows
      if (walletState.address) {
        await getUserEscrows(walletState.address);
      }

      return receipt;
    } catch (error) {
      console.error('❌ Error cancelling escrow:', error);
      
      let errorMessage = 'Failed to cancel escrow';
      if (error.message.includes('Cannot cancel')) {
        errorMessage = 'Escrow cannot be cancelled in current status';
      } else if (error.message.includes('Not authorized')) {
        errorMessage = 'Only buyer or seller can cancel the escrow';
      } else if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction was cancelled by user';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [escrowContract, walletState.address]);

  // Refund buyer
  const refundBuyer = useCallback(async (tokenId) => {
    if (!escrowContract) {
      throw new Error('Escrow contract not available');
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Processing refund...');
      console.log('Token ID:', tokenId);

      const tx = await escrowContract.refundBuyer(BigInt(tokenId));

      toast.info('Processing refund...', { autoClose: 3000 });
      console.log('Transaction submitted:', tx.hash);

      const receipt = await tx.wait();
      console.log('✅ Buyer refunded successfully');
      
      toast.success('Buyer refunded successfully!');
      
      // Refresh user escrows
      if (walletState.address) {
        await getUserEscrows(walletState.address);
      }

      return receipt;
    } catch (error) {
      console.error('❌ Error refunding buyer:', error);
      
      let errorMessage = 'Failed to refund buyer';
      if (error.message.includes('Only seller can refund')) {
        errorMessage = 'Only the seller can initiate a refund';
      } else if (error.message.includes('Not funded')) {
        errorMessage = 'Escrow must be funded to process refund';
      } else if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction was cancelled by user';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [escrowContract, walletState.address]);

  // Get escrow deal details
  const getDealDetails = useCallback(async (tokenId) => {
    if (!escrowContract) {
      return null;
    }

    try {
      const deal = await escrowContract.getDeal(BigInt(tokenId));
      
      // Check if deal exists (seller is not zero address)
      if (deal.seller === '0x0000000000000000000000000000000000000000') {
        return null;
      }
      
      return {
        tokenId: tokenId.toString(),
        seller: deal.seller,
        buyer: deal.buyer,
        price: deal.price.toString(),
        priceEth: ethers.formatEther(deal.price),
        fee: deal.fee.toString(),
        feeEth: ethers.formatEther(deal.fee),
        totalCost: (deal.price + deal.fee).toString(),
        totalCostEth: ethers.formatEther(deal.price + deal.fee),
        status: ESCROW_STATUS[deal.status] || 'UNKNOWN',
        fundsDeposited: deal.fundsDeposited,
        createdAt: Number(deal.createdAt) * 1000 // Convert to milliseconds
      };
    } catch (error) {
      console.error('Error getting deal details:', error);
      return null;
    }
  }, [escrowContract]);

  // Get user's escrow deals (simplified for now)
  const getUserEscrows = useCallback(async (userAddress) => {
    if (!escrowContract || !userAddress) {
      setUserEscrows([]);
      return [];
    }

    try {
      setLoading(true);
      
      // For now, return empty array
      // In production, you would need to:
      // 1. Listen to blockchain events to get user's escrow history
      // 2. Or maintain a backend service that indexes escrow events
      // 3. Or add functions to the smart contract to return user escrows
      
      const userDeals = [];
      setUserEscrows(userDeals);
      
      // Update stats
      const stats = {
        totalActive: 0,
        pendingAsBuyer: 0,
        pendingAsSeller: 0,
        totalVolume: '0'
      };
      
      setEscrowStats(stats);
      
      return userDeals;
    } catch (error) {
      console.error('Error fetching user escrows:', error);
      setUserEscrows([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [escrowContract]);

  // Get escrow fee information
  const getEscrowFee = useCallback(async () => {
    if (!escrowContract) {
      return { percent: 2.5, recipient: null };
    }

    try {
      const [feePercent, feeRecipient] = await Promise.all([
        escrowContract.feePercent(),
        escrowContract.feeRecipient()
      ]);

      return {
        percent: Number(feePercent) / 100, // Convert from basis points to percentage
        recipient: feeRecipient
      };
    } catch (error) {
      console.error('Error getting escrow fee:', error);
      return { percent: 2.5, recipient: null };
    }
  }, [escrowContract]);

  // Calculate total cost including fees
  const calculateTotalCost = useCallback(async (priceInEth) => {
    try {
      const feeInfo = await getEscrowFee();
      const priceWei = ethers.parseEther(priceInEth);
      const feeWei = (priceWei * BigInt(Math.floor(feeInfo.percent * 100))) / BigInt(10000);
      const totalWei = priceWei + feeWei;

      return {
        price: priceWei.toString(),
        fee: feeWei.toString(),
        total: totalWei.toString(),
        priceEth: priceInEth,
        feeEth: ethers.formatEther(feeWei),
        totalEth: ethers.formatEther(totalWei),
        feePercent: feeInfo.percent
      };
    } catch (error) {
      console.error('Error calculating total cost:', error);
      return null;
    }
  }, [getEscrowFee]);

  // Context value
  const value = {
    // Contract info
    escrowContract,
    contractAddress: ESCROW_CONTRACT_ADDRESS,
    marketplaceAddress: MARKETPLACE_CONTRACT_ADDRESS,
    
    // State
    userEscrows,
    escrowStats,
    loading,
    error,
    
    // Wallet integration
    walletState,
    connectWallet,
    disconnectWallet,
    walletLoading,
    
    // Functions
    createEscrow,
    depositFunds,
    completeDeal,
    cancelEscrow,
    refundBuyer,
    getDealDetails,
    getUserEscrows,
    getEscrowFee,
    calculateTotalCost,
    
    // Constants
    ESCROW_STATUS
  };

  return (
    <EscrowContext.Provider value={value}>
      {children}
    </EscrowContext.Provider>
  );
};

// Custom hook to use escrow context
export const useEscrow = () => {
  const context = useContext(EscrowContext);
  if (!context) {
    throw new Error('useEscrow must be used within EscrowProvider');
  }
  return context;
};

export default EscrowContext;