// services/KYCContractService.js
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = "0xF989Aeb6467D7a9e82559faC859046Ec54054940";

const CONTRACT_ABI = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_admin",
				"type": "address"
			}
		],
		"name": "addAdmin",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "newAdmin",
				"type": "address"
			}
		],
		"name": "AdminAdded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "removedAdmin",
				"type": "address"
			}
		],
		"name": "AdminRemoved",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "registerUser",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_admin",
				"type": "address"
			}
		],
		"name": "removeAdmin",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "revokeUser",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "UserVerified",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "VerificationRevoked",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "verifyUser",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "checkVerified",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "isAdmin",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "isVerified",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "superAdmin",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

class KYCContractService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.account = null;
  }

  // Initialize ethers provider and contract
  async init() {
    try {
      if (window.ethereum) {
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        this.account = await this.signer.getAddress();
        
        // Create contract instance
        this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);
        
        return true;
      } else {
        throw new Error('No Ethereum provider found');
      }
    } catch (error) {
      console.error('Error initializing KYC contract service:', error);
      throw error;
    }
  }

  // Connect wallet and get account
  async connectWallet() {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      await this.init();
      return this.account;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  // Register user on blockchain (calls registerUser function)
  async registerUserOnChain() {
    try {
      if (!this.contract || !this.account) {
        await this.init();
      }

      // Estimate gas
      const gasEstimate = await this.contract.registerUser.estimateGas();
      
      // Send transaction
      const tx = await this.contract.registerUser({
        gasLimit: gasEstimate
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Error registering user on chain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check if user is verified on blockchain
  async checkUserVerification(userAddress) {
    try {
      if (!this.contract) {
        await this.init();
      }

      const isVerified = await this.contract.checkVerified(userAddress);
      return {
        success: true,
        isVerified: isVerified
      };
    } catch (error) {
      console.error('Error checking user verification:', error);
      return {
        success: false,
        error: error.message,
        isVerified: false
      };
    }
  }

  // Admin function: Verify user on blockchain
  async verifyUserOnChain(userAddress) {
    try {
      if (!this.contract || !this.account) {
        await this.init();
      }

      // Check if current user is admin
      const isAdmin = await this.contract.isAdmin(this.account);
      if (!isAdmin) {
        throw new Error('Only admins can verify users');
      }

      // Estimate gas
      const gasEstimate = await this.contract.verifyUser.estimateGas(userAddress);
      
      // Send transaction
      const tx = await this.contract.verifyUser(userAddress, {
        gasLimit: gasEstimate
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Error verifying user on chain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Admin function: Revoke user verification on blockchain
  async revokeUserOnChain(userAddress) {
    try {
      if (!this.contract || !this.account) {
        await this.init();
      }

      // Check if current user is admin
      const isAdmin = await this.contract.isAdmin(this.account);
      if (!isAdmin) {
        throw new Error('Only admins can revoke users');
      }

      // Estimate gas
      const gasEstimate = await this.contract.revokeUser.estimateGas(userAddress);
      
      // Send transaction
      const tx = await this.contract.revokeUser(userAddress, {
        gasLimit: gasEstimate
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Error revoking user on chain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check if current user is admin
  async checkIsAdmin(userAddress = null) {
    try {
      if (!this.contract) {
        await this.init();
      }

      const addressToCheck = userAddress || this.account;
      const isAdmin = await this.contract.isAdmin(addressToCheck);
      
      return {
        success: true,
        isAdmin: isAdmin
      };
    } catch (error) {
      console.error('Error checking admin status:', error);
      return {
        success: false,
        error: error.message,
        isAdmin: false
      };
    }
  }

  // Get super admin address
  async getSuperAdmin() {
    try {
      if (!this.contract) {
        await this.init();
      }

      const superAdmin = await this.contract.superAdmin();
      return {
        success: true,
        superAdmin: superAdmin
      };
    } catch (error) {
      console.error('Error getting super admin:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Super Admin function: Add new admin
  async addAdmin(adminAddress) {
    try {
      if (!this.contract || !this.account) {
        await this.init();
      }

      // Check if current user is super admin
      const superAdminResponse = await this.getSuperAdmin();
      if (!superAdminResponse.success || 
          superAdminResponse.superAdmin.toLowerCase() !== this.account.toLowerCase()) {
        throw new Error('Only super admin can add admins');
      }

      // Estimate gas
      const gasEstimate = await this.contract.addAdmin.estimateGas(adminAddress);
      
      // Send transaction
      const tx = await this.contract.addAdmin(adminAddress, {
        gasLimit: gasEstimate
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Error adding admin:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Super Admin function: Remove admin
  async removeAdmin(adminAddress) {
    try {
      if (!this.contract || !this.account) {
        await this.init();
      }

      // Check if current user is super admin
      const superAdminResponse = await this.getSuperAdmin();
      if (!superAdminResponse.success || 
          superAdminResponse.superAdmin.toLowerCase() !== this.account.toLowerCase()) {
        throw new Error('Only super admin can remove admins');
      }

      // Estimate gas
      const gasEstimate = await this.contract.removeAdmin.estimateGas(adminAddress);
      
      // Send transaction
      const tx = await this.contract.removeAdmin(adminAddress, {
        gasLimit: gasEstimate
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Error removing admin:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Listen to contract events
  setupEventListeners(callbacks = {}) {
    if (!this.contract) {
      console.error('Contract not initialized');
      return;
    }

    // Listen for UserVerified events
    if (callbacks.onUserVerified) {
      this.contract.on('UserVerified', (user, event) => {
        callbacks.onUserVerified(user, event);
      });
    }

    // Listen for VerificationRevoked events
    if (callbacks.onVerificationRevoked) {
      this.contract.on('VerificationRevoked', (user, event) => {
        callbacks.onVerificationRevoked(user, event);
      });
    }

    // Listen for AdminAdded events
    if (callbacks.onAdminAdded) {
      this.contract.on('AdminAdded', (newAdmin, event) => {
        callbacks.onAdminAdded(newAdmin, event);
      });
    }

    // Listen for AdminRemoved events
    if (callbacks.onAdminRemoved) {
      this.contract.on('AdminRemoved', (removedAdmin, event) => {
        callbacks.onAdminRemoved(removedAdmin, event);
      });
    }
  }

  // Remove event listeners
  removeEventListeners() {
    if (this.contract) {
      this.contract.removeAllListeners();
    }
  }

  // Get current account
  getCurrentAccount() {
    return this.account;
  }

  // Get contract address
  getContractAddress() {
    return CONTRACT_ADDRESS;
  }
}

// Export singleton instance
const kycContractService = new KYCContractService();
export default kycContractService;