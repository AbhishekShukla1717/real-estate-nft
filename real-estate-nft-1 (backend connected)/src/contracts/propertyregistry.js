// contracts/propertyregistry.js - UPDATED TO MATCH YOUR SMART CONTRACT
import { Contract, ethers } from "ethers";

// Updated PropertyRegistry Contract Address from your files
export const propertyRegistryAddress = "0x5A86858aA3b595FD6663c2296741eF4cd8BC4d01";

// CORRECT ABI from your uploaded Registry ABI.txt
export const propertyRegistryABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_kycAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_propertyNFT",
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
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "uri",
        "type": "string"
      }
    ],
    "name": "PropertyRegistered",
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
      }
    ],
    "name": "PropertyTransferred",
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
    "inputs": [],
    "name": "propertyNFT",
    "outputs": [
      {
        "internalType": "contract PropertyNFT",
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
    "name": "registerProperty",
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
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      }
    ],
    "name": "transferProperty",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

/**
 * Connect to the PropertyRegistry contract
 */
export const connectToPropertyRegistry = async (provider) => {
  try {
    const signer = await provider.getSigner();
    return new ethers.Contract(propertyRegistryAddress, propertyRegistryABI, signer);
  } catch (error) {
    console.error("Failed to connect to PropertyRegistry contract:", error);
    throw error;
  }
}

/**
 * Register a new property (Admin function) - FIXED
 */
export const registerProperty = async (contract, to, tokenURI) => {
  try {
    console.log("📋 Registering property with params:", { to, tokenURI });
    
    const tx = await contract.registerProperty(to, tokenURI);
    console.log("✅ Registration transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ Registration confirmed:", receipt);
    
    let tokenId = null;
    
    // Parse PropertyRegistered event to get token ID
    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog({
          topics: log.topics,
          data: log.data
        });
        
        if (parsedLog && parsedLog.name === "PropertyRegistered") {
          tokenId = parsedLog.args.tokenId.toString();
          console.log("✅ Token ID from PropertyRegistered event:", tokenId);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    return {
      receipt,
      tokenId,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber
    };
    
  } catch (error) {
    console.error("❌ Failed to register property:", error);
    
    if (error.message && error.message.includes("Caller is not an admin")) {
      throw new Error("Insufficient permissions: Only admins can register properties");
    }
    
    if (error.message && error.message.includes("User is not KYC-verified")) {
      throw new Error("KYC verification required: The recipient must be KYC-verified");
    }
    
    throw error;
  }
}

/**
 * Transfer property to another address (Owner function) - FIXED
 */
export const transferProperty = async (contract, tokenId, to) => {
  try {
    console.log("🔄 Transferring property:", { tokenId, to });
    
    const tx = await contract.transferProperty(tokenId, to);
    console.log("✅ Transfer transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ Transfer confirmed:", receipt);
    
    return {
      receipt,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber
    };
    
  } catch (error) {
    console.error("❌ Failed to transfer property:", error);
    
    if (error.message && error.message.includes("Caller is not the property owner")) {
      throw new Error("Only the property owner can transfer");
    }
    
    if (error.message && error.message.includes("User is not KYC-verified")) {
      throw new Error("KYC verification required: The recipient must be KYC-verified");
    }
    
    throw error;
  }
}

/**
 * Check if address has admin role - FIXED
 */
export const hasAdminRole = async (contract, address) => {
  try {
    const adminRole = await contract.ADMIN_ROLE();
    return await contract.hasRole(adminRole, address);
  } catch (error) {
    console.error("Failed to check admin role:", error);
    return false;
  }
}

/**
 * Get KYC contract address
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
 * Get PropertyNFT contract address
 */
export const getPropertyNFTContract = async (contract) => {
  try {
    return await contract.propertyNFT();
  } catch (error) {
    console.error("Failed to get PropertyNFT contract:", error);
    throw error;
  }
}

/**
 * Grant admin role to an address (only for current admins)
 */
export const grantAdminRole = async (contract, address) => {
  try {
    const adminRole = await contract.ADMIN_ROLE();
    const tx = await contract.grantRole(adminRole, address);
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error("Failed to grant admin role:", error);
    throw error;
  }
}

/**
 * Revoke admin role from an address (only for current admins)
 */
export const revokeAdminRole = async (contract, address) => {
  try {
    const adminRole = await contract.ADMIN_ROLE();
    const tx = await contract.revokeRole(adminRole, address);
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error("Failed to revoke admin role:", error);
    throw error;
  }
}

// Export all functions
export default {
  propertyRegistryAddress,
  propertyRegistryABI,
  connectToPropertyRegistry,
  registerProperty,
  transferProperty,
  hasAdminRole,
  getKYCContract,
  getPropertyNFTContract,
  grantAdminRole,
  revokeAdminRole
};