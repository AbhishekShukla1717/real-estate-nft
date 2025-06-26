// services/EscrowService.js - Backend Escrow Service
const { ethers } = require('ethers');

const ESCROW_CONTRACT_ADDRESS = '0x32f99155646d147b8A4846470b64a96dD9cBa414';
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
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "FundsRefunded",
    "type": "event"
  }
];

// EscrowStatus enum mapping
const ESCROW_STATUS = {
  0: 'PENDING',
  1: 'FUNDED',
  2: 'COMPLETED',
  3: 'CANCELLED',
  4: 'REFUNDED'
};

class EscrowService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.initializeProvider();
  }

  initializeProvider() {
    try {
      // Initialize provider - use appropriate RPC URL for your network
      this.provider = new ethers.JsonRpcProvider(
        process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/your-api-key'
      );
      
      // Initialize contract
      this.contract = new ethers.Contract(
        ESCROW_CONTRACT_ADDRESS,
        ESCROW_ABI,
        this.provider
      );

      console.log('✅ Escrow service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize escrow service:', error);
    }
  }

  /**
   * Get escrow deal details by token ID
   */
  async getEscrowDeal(tokenId) {
    try {
      const deal = await this.contract.getDeal(tokenId);
      
      return {
        tokenId: tokenId.toString(),
        seller: deal.seller,
        buyer: deal.buyer,
        price: deal.price.toString(),
        fee: deal.fee.toString(),
        status: ESCROW_STATUS[deal.status] || 'UNKNOWN',
        fundsDeposited: deal.fundsDeposited,
        createdAt: new Date(Number(deal.createdAt) * 1000).toISOString()
      };
    } catch (error) {
      console.error('Error getting escrow deal:', error);
      throw new Error(`Failed to get escrow deal: ${error.message}`);
    }
  }

  /**
   * Get multiple escrow deals
   */
  async getMultipleEscrowDeals(tokenIds) {
    try {
      const deals = await Promise.allSettled(
        tokenIds.map(tokenId => this.getEscrowDeal(tokenId))
      );

      return deals
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
    } catch (error) {
      console.error('Error getting multiple escrow deals:', error);
      throw new Error(`Failed to get escrow deals: ${error.message}`);
    }
  }

  /**
   * Get escrows for a specific user (as buyer or seller)
   */
  async getUserEscrows(userAddress, tokenIds = []) {
    try {
      if (!tokenIds.length) {
        // If no token IDs provided, you might need to get them from your database
        // or by listening to events
        return [];
      }

      const deals = await this.getMultipleEscrowDeals(tokenIds);
      
      // Filter deals where user is participant
      return deals.filter(deal => 
        deal.seller.toLowerCase() === userAddress.toLowerCase() ||
        deal.buyer.toLowerCase() === userAddress.toLowerCase()
      );
    } catch (error) {
      console.error('Error getting user escrows:', error);
      throw new Error(`Failed to get user escrows: ${error.message}`);
    }
  }

  /**
   * Get escrow statistics
   */
  async getEscrowStats() {
    try {
      const feePercent = await this.contract.feePercent();
      const feeRecipient = await this.contract.feeRecipient();

      return {
        feePercent: feePercent.toString(),
        feeRecipient: feeRecipient,
        feePercentageFormatted: `${(Number(feePercent) / 100).toFixed(2)}%`
      };
    } catch (error) {
      console.error('Error getting escrow stats:', error);
      throw new Error(`Failed to get escrow stats: ${error.message}`);
    }
  }

  /**
   * Listen to escrow events
   */
  setupEventListeners(callback) {
    try {
      // Listen for EscrowCreated events
      this.contract.on('EscrowCreated', (tokenId, seller, buyer, price, event) => {
        callback({
          type: 'EscrowCreated',
          tokenId: tokenId.toString(),
          seller,
          buyer,
          price: price.toString(),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        });
      });

      // Listen for FundsDeposited events
      this.contract.on('FundsDeposited', (tokenId, amount, event) => {
        callback({
          type: 'FundsDeposited',
          tokenId: tokenId.toString(),
          amount: amount.toString(),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        });
      });

      // Listen for EscrowCompleted events
      this.contract.on('EscrowCompleted', (tokenId, event) => {
        callback({
          type: 'EscrowCompleted',
          tokenId: tokenId.toString(),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        });
      });

      // Listen for EscrowCancelled events
      this.contract.on('EscrowCancelled', (tokenId, event) => {
        callback({
          type: 'EscrowCancelled',
          tokenId: tokenId.toString(),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        });
      });

      // Listen for FundsRefunded events
      this.contract.on('FundsRefunded', (tokenId, amount, event) => {
        callback({
          type: 'FundsRefunded',
          tokenId: tokenId.toString(),
          amount: amount.toString(),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        });
      });

      console.log('✅ Escrow event listeners set up');
    } catch (error) {
      console.error('Error setting up event listeners:', error);
    }
  }

  /**
   * Get historical escrow events
   */
  async getEscrowEvents(fromBlock = 0, toBlock = 'latest') {
    try {
      const filter = {
        address: ESCROW_CONTRACT_ADDRESS,
        fromBlock,
        toBlock
      };

      const events = await this.provider.getLogs(filter);
      
      return events.map(event => {
        const parsedLog = this.contract.interface.parseLog(event);
        return {
          type: parsedLog.name,
          args: parsedLog.args,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          logIndex: event.logIndex
        };
      });
    } catch (error) {
      console.error('Error getting escrow events:', error);
      throw new Error(`Failed to get escrow events: ${error.message}`);
    }
  }

  /**
   * Check if an escrow exists for a token
   */
  async escrowExists(tokenId) {
    try {
      const deal = await this.getEscrowDeal(tokenId);
      return deal.seller !== ethers.ZeroAddress;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get escrow requirements (fee percentage, etc.)
   */
  async getEscrowRequirements() {
    try {
      const stats = await this.getEscrowStats();
      return {
        feePercent: stats.feePercent,
        feePercentageFormatted: stats.feePercentageFormatted,
        contractAddress: ESCROW_CONTRACT_ADDRESS
      };
    } catch (error) {
      console.error('Error getting escrow requirements:', error);
      throw new Error(`Failed to get escrow requirements: ${error.message}`);
    }
  }

  /**
   * Validate escrow transaction data
   */
  validateEscrowData(data) {
    const errors = [];

    if (!data.tokenId || isNaN(data.tokenId)) {
      errors.push('Valid token ID is required');
    }

    if (!data.buyer || !ethers.isAddress(data.buyer)) {
      errors.push('Valid buyer address is required');
    }

    if (!data.seller || !ethers.isAddress(data.seller)) {
      errors.push('Valid seller address is required');
    }

    if (!data.price || isNaN(data.price) || Number(data.price) <= 0) {
      errors.push('Valid price is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate total cost including fees
   */
  async calculateTotalCost(price) {
    try {
      const stats = await this.getEscrowStats();
      const feePercent = Number(stats.feePercent);
      const priceWei = ethers.parseEther(price.toString());
      const feeWei = (priceWei * BigInt(feePercent)) / BigInt(10000);
      const totalWei = priceWei + feeWei;

      return {
        price: priceWei.toString(),
        fee: feeWei.toString(),
        total: totalWei.toString(),
        priceEth: ethers.formatEther(priceWei),
        feeEth: ethers.formatEther(feeWei),
        totalEth: ethers.formatEther(totalWei)
      };
    } catch (error) {
      console.error('Error calculating total cost:', error);
      throw new Error(`Failed to calculate total cost: ${error.message}`);
    }
  }
}

module.exports = new EscrowService();