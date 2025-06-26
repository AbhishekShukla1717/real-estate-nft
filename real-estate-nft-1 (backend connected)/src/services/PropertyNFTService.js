// services/PropertyNFTService.js - Updated to match PropertyNFT.sol
import { Contract, ethers } from "ethers";

// IMPORTANT: Update this with your actual deployed PropertyNFT contract address
const PROPERTY_NFT_ADDRESS = "0x768AFeA04DaC07ece9aa54109eE246e80948d9C3"; 

// Complete PropertyNFT ABI - Updated to match your smart contract
const PROPERTY_NFT_ABI = [
  // Constructor
  {
    "inputs": [{"internalType": "address", "name": "_kycAddress", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  // ERC721 Standard functions
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "tokenURI",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "getApproved",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "operator", "type": "address"},
      {"internalType": "bool", "name": "approved", "type": "bool"}
    ],
    "name": "setApprovalForAll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "address", "name": "operator", "type": "address"}
    ],
    "name": "isApprovedForAll",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "from", "type": "address"},
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "transferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "from", "type": "address"},
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "from", "type": "address"},
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"internalType": "bytes", "name": "data", "type": "bytes"}
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Custom PropertyNFT functions
  {
    "inputs": [],
    "name": "tokenCounter",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "kycContract",
    "outputs": [{"internalType": "contract IKYCVerification", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Admin functions
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "string", "name": "tokenURI", "type": "string"}
    ],
    "name": "mintProperty",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Access Control functions
  {
    "inputs": [],
    "name": "ADMIN_ROLE",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "DEFAULT_ADMIN_ROLE",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "role", "type": "bytes32"},
      {"internalType": "address", "name": "account", "type": "address"}
    ],
    "name": "hasRole",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "role", "type": "bytes32"},
      {"internalType": "address", "name": "account", "type": "address"}
    ],
    "name": "grantRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "role", "type": "bytes32"},
      {"internalType": "address", "name": "account", "type": "address"}
    ],
    "name": "revokeRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "role", "type": "bytes32"}
    ],
    "name": "getRoleAdmin",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "role", "type": "bytes32"},
      {"internalType": "address", "name": "callerConfirmation", "type": "address"}
    ],
    "name": "renounceRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes4", "name": "interfaceId", "type": "bytes4"}
    ],
    "name": "supportsInterface",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "owner", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "approved", "type": "address"},
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "owner", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "operator", "type": "address"},
      {"indexed": false, "internalType": "bool", "name": "approved", "type": "bool"}
    ],
    "name": "ApprovalForAll",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "from", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "to", "type": "address"},
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "to", "type": "address"},
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"indexed": false, "internalType": "string", "name": "tokenURI", "type": "string"}
    ],
    "name": "PropertyMinted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "bytes32", "name": "role", "type": "bytes32"},
      {"indexed": true, "internalType": "bytes32", "name": "previousAdminRole", "type": "bytes32"},
      {"indexed": true, "internalType": "bytes32", "name": "newAdminRole", "type": "bytes32"}
    ],
    "name": "RoleAdminChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "bytes32", "name": "role", "type": "bytes32"},
      {"indexed": true, "internalType": "address", "name": "account", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "sender", "type": "address"}
    ],
    "name": "RoleGranted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "bytes32", "name": "role", "type": "bytes32"},
      {"indexed": true, "internalType": "address", "name": "account", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "sender", "type": "address"}
    ],
    "name": "RoleRevoked",
    "type": "event"
  }
];

class PropertyNFTService {
  constructor() {
    this.contract = null;
    this.contractWithSigner = null;
    this.provider = null;
    this.signer = null;
    this.isInitialized = false;
  }

  // Initialize contract instance with better error handling
  async initializeContract(provider) {
    try {
      console.log('🔄 Initializing PropertyNFT contract...');
      
      if (!provider) {
        throw new Error("Provider is required to initialize contract");
      }

      // Store provider reference
      this.provider = provider;
      
      // Check if contract is deployed at the address
      const code = await provider.getCode(PROPERTY_NFT_ADDRESS);
      if (code === '0x' || code === '0x0') {
        throw new Error(`No contract deployed at address ${PROPERTY_NFT_ADDRESS}`);
      }
      
      // Create contract instance with provider for read operations
      this.contract = new Contract(PROPERTY_NFT_ADDRESS, PROPERTY_NFT_ABI, provider);
      
      // Try to get signer for write operations
      try {
        this.signer = await provider.getSigner();
        this.contractWithSigner = new Contract(PROPERTY_NFT_ADDRESS, PROPERTY_NFT_ABI, this.signer);
        console.log('✅ Contract with signer initialized');
      } catch (signerError) {
        console.warn('⚠️ Could not get signer (read-only mode):', signerError.message);
      }
      
      // Test the contract by calling a simple function
      try {
        const name = await this.contract.name();
        const symbol = await this.contract.symbol();
        console.log('✅ PropertyNFT contract initialized successfully:', `${name} (${symbol})`);
      } catch (testError) {
        console.warn('⚠️ Contract test call failed:', testError);
      }
      
      this.isInitialized = true;
      return this.contract;
      
    } catch (error) {
      console.error('❌ Failed to initialize PropertyNFT contract:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  // Enhanced test connection with multiple checks
  async testContractConnection() {
    try {
      console.log('🧪 Testing PropertyNFT contract connection...');
      
      if (!this.provider) {
        console.error('❌ No provider available');
        return false;
      }
      
      // Test 1: Check if contract exists
      const code = await this.provider.getCode(PROPERTY_NFT_ADDRESS);
      if (!code || code === '0x' || code === '0x0') {
        console.error('❌ No contract code at address:', PROPERTY_NFT_ADDRESS);
        return false;
      }
      console.log('✅ Contract code found');
      
      // Test 2: Try to call a view function
      if (this.contract) {
        try {
          const tokenCounter = await this.contract.tokenCounter();
          const name = await this.contract.name();
          console.log('✅ Contract responds to calls:', `${name}, tokens: ${tokenCounter.toString()}`);
          return true;
        } catch (callError) {
          console.error('❌ Contract call failed:', callError);
          return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }

  // Get all minted tokens
  async getAllTokens() {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      console.log('📋 Getting all minted tokens...');
      
      // Get token counter
      const tokenCounter = await this.contract.tokenCounter();
      const tokenCount = parseInt(tokenCounter.toString());
      
      console.log(`Total tokens minted: ${tokenCount}`);
      
      if (tokenCount === 0) {
        return [];
      }
      
      const tokens = [];
      
      // Token IDs start from 0 based on your smart contract
      for (let i = 0; i < tokenCount; i++) {
        try {
          // Verify token exists by checking owner
          await this.contract.ownerOf(i);
          tokens.push(i.toString());
        } catch (error) {
          // Token might be burned or not exist
          console.warn(`Token ${i} might not exist:`, error.message);
        }
      }
      
      console.log('✅ Found tokens:', tokens);
      return tokens;
      
    } catch (error) {
      console.error('❌ Error getting all tokens:', error);
      return [];
    }
  }

  // Get property metadata with better error handling
  async getPropertyMetadata(tokenId) {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      const tokenURI = await this.contract.tokenURI(tokenId);
      console.log(`Token ${tokenId} URI:`, tokenURI);
      
      // Handle data URI format
      if (tokenURI.startsWith('data:application/json;base64,')) {
        const base64Data = tokenURI.split(',')[1];
        const jsonString = atob(base64Data);
        const metadata = JSON.parse(jsonString);
        return metadata;
      }
      
      // Handle IPFS URI
      if (tokenURI.startsWith('ipfs://')) {
        const ipfsHash = tokenURI.replace('ipfs://', '');
        const metadataUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
        
        try {
          const response = await fetch(metadataUrl);
          const metadata = await response.json();
          return metadata;
        } catch (fetchError) {
          console.error('Failed to fetch from IPFS:', fetchError);
        }
      }
      
      // Handle HTTP(S) URI
      if (tokenURI.startsWith('http')) {
        try {
          const response = await fetch(tokenURI);
          const metadata = await response.json();
          return metadata;
        } catch (fetchError) {
          console.error('Failed to fetch metadata:', fetchError);
        }
      }
      
      // Return basic metadata if all else fails
      return {
        name: `Property #${tokenId}`,
        description: 'Metadata unavailable',
        image: null,
        attributes: []
      };
      
    } catch (error) {
      console.error(`❌ Error getting metadata for token ${tokenId}:`, error);
      return {
        name: `Property #${tokenId}`,
        description: 'Error loading metadata',
        image: null,
        attributes: []
      };
    }
  }

  // Get property details
  async getPropertyDetails(tokenId) {
    try {
      console.log(`📋 Getting details for token ${tokenId}`);
      
      const [owner, metadata] = await Promise.all([
        this.contract.ownerOf(tokenId),
        this.getPropertyMetadata(tokenId)
      ]);
      
      return {
        tokenId: tokenId.toString(),
        owner: owner,
        name: metadata.name || `Property #${tokenId}`,
        description: metadata.description || 'No description available',
        image: metadata.image || null,
        attributes: metadata.attributes || [],
        metadata: metadata
      };
      
    } catch (error) {
      console.error(`❌ Error getting property details for token ${tokenId}:`, error);
      throw error;
    }
  }

  // Get user properties
  async getUserProperties(userAddress) {
    try {
      console.log(`📋 Getting properties for user: ${userAddress}`);
      
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }
      
      const allTokens = await this.getAllTokens();
      console.log(`Checking ${allTokens.length} tokens...`);
      
      const userProperties = [];
      
      for (const tokenId of allTokens) {
        try {
          const owner = await this.contract.ownerOf(tokenId);
          
          if (owner.toLowerCase() === userAddress.toLowerCase()) {
            const details = await this.getPropertyDetails(tokenId);
            userProperties.push(details);
          }
        } catch (error) {
          console.warn(`Error checking token ${tokenId}:`, error);
        }
      }
      
      console.log(`✅ Found ${userProperties.length} properties for user`);
      return userProperties;
      
    } catch (error) {
      console.error(`❌ Error getting user properties:`, error);
      return [];
    }
  }

  // Check if user has admin role
  async hasAdminRole(userAddress) {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }
      
      const adminRole = await this.contract.ADMIN_ROLE();
      const isAdmin = await this.contract.hasRole(adminRole, userAddress);
      console.log(`Admin check - User: ${userAddress}, IsAdmin: ${isAdmin}`);
      return isAdmin;
    } catch (error) {
      console.error(`❌ Error checking admin role:`, error);
      return false;
    }
  }

  // Mint property (admin only)
  async mintProperty(to, tokenURI) {
    try {
      if (!this.contractWithSigner) {
        throw new Error("Contract with signer not initialized. Please connect your wallet.");
      }
      
      console.log(`🏠 Minting property to: ${to}, URI: ${tokenURI}`);
      
      const tx = await this.contractWithSigner.mintProperty(to, tokenURI);
      console.log(`✅ Mint transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Mint confirmed in block ${receipt.blockNumber}`);
      
      // Look for PropertyMinted event
      let tokenId = null;
      for (const log of receipt.logs) {
        try {
          const parsedLog = this.contractWithSigner.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          
          if (parsedLog && parsedLog.name === "PropertyMinted") {
            tokenId = parsedLog.args.tokenId.toString();
            console.log(`Token ID from PropertyMinted event: ${tokenId}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      // Fallback: Get from token counter
      if (tokenId === null) {
        try {
          const currentCounter = await this.contract.tokenCounter();
          tokenId = (currentCounter - 1n).toString();
          console.log("Token ID from counter:", tokenId);
        } catch (e) {
          console.log("Failed to get token ID from counter:", e);
        }
      }
      
      return {
        receipt,
        tokenId,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      };
      
    } catch (error) {
      console.error(`❌ Error minting property:`, error);
      
      if (error.message && error.message.includes("Not an admin")) {
        throw new Error("Insufficient permissions: Only admins can mint properties");
      }
      
      if (error.message && error.message.includes("User not KYC-verified")) {
        throw new Error("KYC verification required: The recipient must be KYC-verified");
      }
      
      throw error;
    }
  }

  // Grant admin role (only for existing admins)
  async grantAdminRole(userAddress) {
    try {
      if (!this.contractWithSigner) {
        throw new Error("Contract with signer not initialized. Please connect your wallet.");
      }
      
      console.log(`🔐 Granting admin role to: ${userAddress}`);
      
      const adminRole = await this.contract.ADMIN_ROLE();
      const tx = await this.contractWithSigner.grantRole(adminRole, userAddress);
      console.log(`✅ Grant role transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Grant role confirmed in block ${receipt.blockNumber}`);
      
      return receipt;
    } catch (error) {
      console.error(`❌ Error granting admin role:`, error);
      throw error;
    }
  }

  // Revoke admin role (only for existing admins)
  async revokeAdminRole(userAddress) {
    try {
      if (!this.contractWithSigner) {
        throw new Error("Contract with signer not initialized. Please connect your wallet.");
      }
      
      console.log(`🔐 Revoking admin role from: ${userAddress}`);
      
      const adminRole = await this.contract.ADMIN_ROLE();
      const tx = await this.contractWithSigner.revokeRole(adminRole, userAddress);
      console.log(`✅ Revoke role transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Revoke role confirmed in block ${receipt.blockNumber}`);
      
      return receipt;
    } catch (error) {
      console.error(`❌ Error revoking admin role:`, error);
      throw error;
    }
  }

  // Get KYC contract address
  async getKYCContract() {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }
      
      const kycAddress = await this.contract.kycContract();
      console.log(`KYC contract address: ${kycAddress}`);
      return kycAddress;
    } catch (error) {
      console.error(`❌ Error getting KYC contract:`, error);
      throw error;
    }
  }

  // Check if approved for all
  async isApprovedForAll(owner, operator) {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }
      
      const isApproved = await this.contract.isApprovedForAll(owner, operator);
      console.log(`Approval check - Owner: ${owner}, Operator: ${operator}, Approved: ${isApproved}`);
      return isApproved;
    } catch (error) {
      console.error(`❌ Error checking approval:`, error);
      return false;
    }
  }

  // Set approval for all
  async setApprovalForAll(operator, approved) {
    try {
      if (!this.contractWithSigner) {
        throw new Error("Contract with signer not initialized. Please connect your wallet.");
      }
      
      console.log(`📋 Setting approval for operator: ${operator}, approved: ${approved}`);
      
      const tx = await this.contractWithSigner.setApprovalForAll(operator, approved);
      console.log(`✅ Approval transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Approval confirmed in block ${receipt.blockNumber}`);
      
      return receipt;
    } catch (error) {
      console.error(`❌ Error setting approval:`, error);
      throw error;
    }
  }

  // Transfer property
  async transferProperty(to, tokenId) {
    try {
      if (!this.contractWithSigner) {
        throw new Error("Contract with signer not initialized. Please connect your wallet.");
      }
      
      const from = await this.signer.getAddress();
      console.log(`🔄 Transferring token ${tokenId} from ${from} to ${to}`);
      
      const tx = await this.contractWithSigner.transferFrom(from, to, tokenId);
      console.log(`✅ Transfer transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Transfer confirmed in block ${receipt.blockNumber}`);
      
      return receipt;
    } catch (error) {
      console.error(`❌ Error transferring property:`, error);
      throw error;
    }
  }

  // Get contract address
  getContractAddress() {
    return PROPERTY_NFT_ADDRESS;
  }

  // Check if service is initialized
  isServiceInitialized() {
    return this.isInitialized;
  }

  // Get contract info
  async getContractInfo() {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }
      
      const [name, symbol, tokenCounter, kycContract] = await Promise.all([
        this.contract.name(),
        this.contract.symbol(),
        this.contract.tokenCounter(),
        this.contract.kycContract()
      ]);
      
      return {
        name,
        symbol,
        tokenCounter: tokenCounter.toString(),
        kycContract,
        address: PROPERTY_NFT_ADDRESS
      };
    } catch (error) {
      console.error(`❌ Error getting contract info:`, error);
      throw error;
    }
  }
}

// Create singleton instance
const propertyNFTService = new PropertyNFTService();

export { propertyNFTService };
export default propertyNFTService;