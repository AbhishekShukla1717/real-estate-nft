// contracts/propertynft.js - Updated with new ABI and PropertyMinted event handling
import { ethers } from "ethers";

// PropertyNFT Contract Address - UPDATE THIS WITH YOUR DEPLOYED ADDRESS
export const contractAddress = "0x768AFeA04DaC07ece9aa54109eE246e80948d9C3";

// Updated Contract ABI - matches your new smart contract with PropertyMinted event
export const contractABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_kycAddress",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "AccessControlBadConfirmation",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "neededRole",
        "type": "bytes32"
      }
    ],
    "name": "AccessControlUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "ERC721IncorrectOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "ERC721InsufficientApproval",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "approver",
        "type": "address"
      }
    ],
    "name": "ERC721InvalidApprover",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      }
    ],
    "name": "ERC721InvalidOperator",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "ERC721InvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "receiver",
        "type": "address"
      }
    ],
    "name": "ERC721InvalidReceiver",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "ERC721InvalidSender",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "ERC721NonexistentToken",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "approved",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      }
    ],
    "name": "ApprovalForAll",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_fromTokenId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_toTokenId",
        "type": "uint256"
      }
    ],
    "name": "BatchMetadataUpdate",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_tokenId",
        "type": "uint256"
      }
    ],
    "name": "MetadataUpdate",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "tokenURI",
        "type": "string"
      }
    ],
    "name": "PropertyMinted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "previousAdminRole",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "newAdminRole",
        "type": "bytes32"
      }
    ],
    "name": "RoleAdminChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "RoleGranted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "RoleRevoked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "ADMIN_ROLE",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "DEFAULT_ADMIN_ROLE",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
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
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getApproved",
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
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      }
    ],
    "name": "getRoleAdmin",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "grantRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "hasRole",
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
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      }
    ],
    "name": "isApprovedForAll",
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
    "name": "kycContract",
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
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "tokenURI",
        "type": "string"
      }
    ],
    "name": "mintProperty",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
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
    "name": "ownerOf",
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
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "callerConfirmation",
        "type": "address"
      }
    ],
    "name": "renounceRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "revokeRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      }
    ],
    "name": "setApprovalForAll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes4",
        "name": "interfaceId",
        "type": "bytes4"
      }
    ],
    "name": "supportsInterface",
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
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tokenCounter",
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
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "tokenURI",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

/**
 * Connect to the PropertyNFT contract
 * @param {object} provider - Ethereum provider
 * @returns {Contract} - The contract instance
 */
export const connectToContract = async (provider) => {
  try {
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddress, contractABI, signer);
  } catch (error) {
    console.error("Failed to connect to PropertyNFT contract:", error);
    throw error;
  }
}

/**
 * Mint a new property NFT (Admin function)
 * @param {Contract} contract - The contract instance
 * @param {string} to - Address to mint the NFT to
 * @param {string} tokenURI - IPFS URI for the property metadata
 * @returns {Promise<object>} - Transaction receipt with token ID
 */
export const mintProperty = async (contract, to, tokenURI) => {
  try {
    console.log("Minting property with params:", { to, tokenURI });
    
    // Validate inputs
    if (!to || !ethers.isAddress(to)) {
      throw new Error("Invalid recipient address");
    }
    
    if (!tokenURI || tokenURI.trim() === "") {
      throw new Error("Token URI cannot be empty");
    }
    
    // Call the contract function
    const tx = await contract.mintProperty(to, tokenURI);
    console.log("Transaction sent:", tx.hash);
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt);
    
    let tokenId = null;
    let mintedTokenURI = null;
    
    // First, try to get token ID from PropertyMinted event (most reliable)
    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog({
          topics: log.topics,
          data: log.data
        });
        
        if (parsedLog && parsedLog.name === "PropertyMinted") {
          const { to: eventTo, tokenId: eventTokenId, tokenURI: eventTokenURI } = parsedLog.args;
          
          if (eventTo.toLowerCase() === to.toLowerCase()) {
            tokenId = eventTokenId.toString();
            mintedTokenURI = eventTokenURI;
            console.log("Token ID from PropertyMinted event:", tokenId);
            console.log("Token URI from PropertyMinted event:", mintedTokenURI);
            break;
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    // Fallback: Parse Transfer event from zero address (minting)
    if (tokenId === null) {
      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          
          if (parsedLog && parsedLog.name === "Transfer") {
            const { from, to: transferTo, tokenId: eventTokenId } = parsedLog.args;
            
            if (from === "0x0000000000000000000000000000000000000000" && 
                transferTo.toLowerCase() === to.toLowerCase()) {
              tokenId = eventTokenId.toString();
              console.log("Token ID from Transfer event:", tokenId);
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }
    }
    
    // Last fallback: Get from token counter
    if (tokenId === null) {
      try {
        const currentCounter = await contract.tokenCounter();
        tokenId = (currentCounter - 1n).toString();
        console.log("Token ID from counter:", tokenId);
      } catch (e) {
        console.log("Failed to get token ID from counter:", e);
      }
    }
    
    return {
      receipt,
      tokenId,
      tokenURI: mintedTokenURI || tokenURI,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      from: receipt.from,
      to: receipt.to,
      status: receipt.status
    };
    
  } catch (error) {
    console.error("Failed to mint property:", error);
    
    // Enhanced error handling for contract-specific errors
    if (error.message && error.message.includes("Not an admin")) {
      throw new Error("Insufficient permissions: Only admins can mint properties");
    }
    
    if (error.message && error.message.includes("User not KYC-verified")) {
      throw new Error("KYC verification required: The recipient must be KYC-verified");
    }
    
    if (error.message && error.message.includes("Token URI is empty")) {
      throw new Error("Token URI cannot be empty");
    }
    
    if (error.message && error.message.includes("KYC contract not set")) {
      throw new Error("KYC contract is not properly configured");
    }
    
    // Handle common transaction errors
    if (error.code === "INSUFFICIENT_FUNDS") {
      throw new Error("Insufficient funds for gas fees");
    }
    
    if (error.code === "USER_REJECTED") {
      throw new Error("Transaction was rejected by user");
    }
    
    throw error;
  }
}

/**
 * Get token URI
 * @param {Contract} contract - The contract instance
 * @param {number|string} tokenId - The NFT token ID
 * @returns {Promise<string>} - Token URI
 */
export const getTokenURI = async (contract, tokenId) => {
  try {
    return await contract.tokenURI(tokenId);
  } catch (error) {
    console.error("Failed to get token URI:", error);
    
    if (error.message && error.message.includes("ERC721NonexistentToken")) {
      throw new Error(`Token ID ${tokenId} does not exist`);
    }
    
    throw error;
  }
}

/**
 * Transfer a property to another address
 * @param {Contract} contract - The contract instance
 * @param {string} to - Recipient address
 * @param {number|string} tokenId - The NFT token ID
 * @returns {Promise<object>} - Transaction receipt
 */
export const transferProperty = async (contract, to, tokenId) => {
  try {
    // Validate inputs
    if (!to || !ethers.isAddress(to)) {
      throw new Error("Invalid recipient address");
    }
    
    const signer = contract.signer;
    const from = await signer.getAddress();
    
    const tx = await contract.transferFrom(from, to, tokenId);
    const receipt = await tx.wait();
    
    return receipt;
  } catch (error) {
    console.error("Failed to transfer property:", error);
    
    if (error.message && error.message.includes("ERC721IncorrectOwner")) {
      throw new Error("You do not own this token");
    }
    
    if (error.message && error.message.includes("ERC721NonexistentToken")) {
      throw new Error(`Token ID ${tokenId} does not exist`);
    }
    
    throw error;
  }
}

/**
 * Get owner of a token
 * @param {Contract} contract - The contract instance
 * @param {number|string} tokenId - The NFT token ID
 * @returns {Promise<string>} - Owner address
 */
export const getTokenOwner = async (contract, tokenId) => {
  try {
    return await contract.ownerOf(tokenId);
  } catch (error) {
    console.error("Failed to get token owner:", error);
    
    if (error.message && error.message.includes("ERC721NonexistentToken")) {
      throw new Error(`Token ID ${tokenId} does not exist`);
    }
    
    throw error;
  }
}

/**
 * Get balance of an address
 * @param {Contract} contract - The contract instance
 * @param {string} address - Address to check balance for
 * @returns {Promise<string>} - Number of tokens owned
 */
export const getBalanceOf = async (contract, address) => {
  try {
    if (!address || !ethers.isAddress(address)) {
      throw new Error("Invalid address");
    }
    
    const balance = await contract.balanceOf(address);
    return balance.toString();
  } catch (error) {
    console.error("Failed to get balance:", error);
    throw error;
  }
}

/**
 * Get current token counter
 * @param {Contract} contract - The contract instance
 * @returns {Promise<string>} - Current token counter
 */
export const getTokenCounter = async (contract) => {
  try {
    const counter = await contract.tokenCounter();
    return counter.toString();
  } catch (error) {
    console.error("Failed to get token counter:", error);
    throw error;
  }
}

/**
 * Check if address has admin role
 * @param {Contract} contract - The contract instance
 * @param {string} address - Address to check
 * @returns {Promise<boolean>} - True if has admin role
 */
export const hasAdminRole = async (contract, address) => {
  try {
    if (!address || !ethers.isAddress(address)) {
      throw new Error("Invalid address");
    }
    
    const adminRole = await contract.ADMIN_ROLE();
    return await contract.hasRole(adminRole, address);
  } catch (error) {
    console.error("Failed to check admin role:", error);
    throw error;
  }
}

/**
 * Get KYC contract address
 * @param {Contract} contract - The contract instance
 * @returns {Promise<string>} - KYC contract address
 */
export const getKYCContract = async (contract) => {
  try {
    return await contract.kycContract();
  } catch (error) {
    console.error("Failed to get KYC contract:", error);
    throw error;
  }
}

/**
 * Grant admin role to an address (only for current admins)
 * @param {Contract} contract - The contract instance
 * @param {string} address - Address to grant admin role to
 * @returns {Promise<object>} - Transaction receipt
 */
export const grantAdminRole = async (contract, address) => {
  try {
    if (!address || !ethers.isAddress(address)) {
      throw new Error("Invalid address");
    }
    
    const adminRole = await contract.ADMIN_ROLE();
    const tx = await contract.grantRole(adminRole, address);
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error("Failed to grant admin role:", error);
    
    if (error.message && error.message.includes("AccessControlUnauthorizedAccount")) {
      throw new Error("You do not have permission to grant admin roles");
    }
    
    throw error;
  }
}

/**
 * Revoke admin role from an address (only for current admins)
 * @param {Contract} contract - The contract instance
 * @param {string} address - Address to revoke admin role from
 * @returns {Promise<object>} - Transaction receipt
 */
export const revokeAdminRole = async (contract, address) => {
  try {
    if (!address || !ethers.isAddress(address)) {
      throw new Error("Invalid address");
    }
    
    const adminRole = await contract.ADMIN_ROLE();
    const tx = await contract.revokeRole(adminRole, address);
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error("Failed to revoke admin role:", error);
    
    if (error.message && error.message.includes("AccessControlUnauthorizedAccount")) {
      throw new Error("You do not have permission to revoke admin roles");
    }
    
    throw error;
  }
}

/**
 * Listen for PropertyMinted events
 * @param {Contract} contract - The contract instance
 * @param {function} callback - Callback function to handle the event
 * @returns {function} - Function to remove the listener
 */
export const listenForPropertyMinted = (contract, callback) => {
  try {
    const filter = contract.filters.PropertyMinted();
    
    const eventHandler = (to, tokenId, tokenURI, event) => {
      callback({
        to,
        tokenId: tokenId.toString(),
        tokenURI,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        blockHash: event.blockHash,
        logIndex: event.logIndex
      });
    };
    
    contract.on(filter, eventHandler);
    
    // Return cleanup function
    return () => {
      contract.off(filter, eventHandler);
    };
  } catch (error) {
    console.error("Failed to listen for PropertyMinted events:", error);
    throw error;
  }
}

/**
 * Get past PropertyMinted events
 * @param {Contract} contract - The contract instance
 * @param {number} fromBlock - Starting block number (optional)
 * @param {number} toBlock - Ending block number (optional)
 * @returns {Promise<Array>} - Array of PropertyMinted events
 */
export const getPastPropertyMintedEvents = async (contract, fromBlock = 0, toBlock = 'latest') => {
  try {
    const filter = contract.filters.PropertyMinted();
    const events = await contract.queryFilter(filter, fromBlock, toBlock);
    
    return events.map(event => ({
      to: event.args.to,
      tokenId: event.args.tokenId.toString(),
      tokenURI: event.args.tokenURI,
      transactionHash: event.transactionHash,
      blockNumber: event.blockNumber,
      blockHash: event.blockHash,
      logIndex: event.logIndex
    }));
  } catch (error) {
    console.error("Failed to get past PropertyMinted events:", error);
    throw error;
  }
}

/**
 * Approve another address to transfer a specific token
 * @param {Contract} contract - The contract instance
 * @param {string} to - Address to approve
 * @param {number|string} tokenId - The NFT token ID
 * @returns {Promise<object>} - Transaction receipt
 */
export const approveToken = async (contract, to, tokenId) => {
  try {
    if (!to || !ethers.isAddress(to)) {
      throw new Error("Invalid address to approve");
    }
    
    const tx = await contract.approve(to, tokenId);
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error("Failed to approve token:", error);
    
    if (error.message && error.message.includes("ERC721NonexistentToken")) {
      throw new Error(`Token ID ${tokenId} does not exist`);
    }
    
    if (error.message && error.message.includes("ERC721IncorrectOwner")) {
      throw new Error("You do not own this token");
    }
    
    throw error;
  }
}

/**
 * Get approved address for a token
 * @param {Contract} contract - The contract instance
 * @param {number|string} tokenId - The NFT token ID
 * @returns {Promise<string>} - Approved address
 */
export const getApproved = async (contract, tokenId) => {
  try {
    return await contract.getApproved(tokenId);
  } catch (error) {
    console.error("Failed to get approved address:", error);
    
    if (error.message && error.message.includes("ERC721NonexistentToken")) {
      throw new Error(`Token ID ${tokenId} does not exist`);
    }
    
    throw error;
  }
}

/**
 * Set approval for all tokens
 * @param {Contract} contract - The contract instance
 * @param {string} operator - Address to set approval for
 * @param {boolean} approved - Whether to approve or revoke
 * @returns {Promise<object>} - Transaction receipt
 */
export const setApprovalForAll = async (contract, operator, approved) => {
  try {
    if (!operator || !ethers.isAddress(operator)) {
      throw new Error("Invalid operator address");
    }
    
    const tx = await contract.setApprovalForAll(operator, approved);
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error("Failed to set approval for all:", error);
    throw error;
  }
}

/**
 * Check if an operator is approved for all tokens of an owner
 * @param {Contract} contract - The contract instance
 * @param {string} owner - Owner address
 * @param {string} operator - Operator address
 * @returns {Promise<boolean>} - True if approved for all
 */
export const isApprovedForAll = async (contract, owner, operator) => {
  try {
    if (!owner || !ethers.isAddress(owner)) {
      throw new Error("Invalid owner address");
    }
    
    if (!operator || !ethers.isAddress(operator)) {
      throw new Error("Invalid operator address");
    }
    
    return await contract.isApprovedForAll(owner, operator);
  } catch (error) {
    console.error("Failed to check approval for all:", error);
    throw error;
  }
}