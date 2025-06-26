// config/contracts.js - Centralized contract configuration
// Update these addresses with your deployed contract addresses

const contracts = {
  // Network configuration
  network: {
    name: "localhost", // Change to "sepolia", "mainnet", etc. as needed
    chainId: 31337,    // Change to appropriate chain ID (11155111 for Sepolia, 1 for Mainnet)
    rpcUrl: "http://localhost:8545" // Your RPC URL
  },
  
  // Contract addresses - UPDATE THESE WITH YOUR DEPLOYED ADDRESSES
  addresses: {
    // KYC Verification Contract
    kycVerification: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    
    // Property NFT Contract
    propertyNFT: "0x768AFeA04DaC07ece9aa54109eE246e80948d9C3",
    
    // Property Registry Contract  
    propertyRegistry: "0x5A86858aA3b595FD6663c2296741eF4cd8BC4d01",
    
    // Marketplace Contract
    marketplace: "0x6f38283c92186AEc00FFD196F444Ed0773919FCE",
    
    // Escrow Contract
    escrow: "0x32f99155646d147b8A4846470b64a96dD9cBa414"
  },
  
  // IPFS Configuration
  ipfs: {
    // Pinata credentials - Store these in .env file
    pinataApiKey: process.env.REACT_APP_PINATA_API_KEY,
    pinataSecretKey: process.env.REACT_APP_PINATA_SECRET_API_KEY,
    
    // IPFS gateways
    gateways: {
      primary: "https://gateway.pinata.cloud/ipfs/",
      fallback: "https://ipfs.io/ipfs/"
    }
  }
};

// Helper function to get contract address by name
export const getContractAddress = (contractName) => {
  return contracts.addresses[contractName] || null;
};

// Helper function to check if all contracts are configured
export const areContractsConfigured = () => {
  const required = ['kycVerification', 'propertyNFT', 'propertyRegistry', 'marketplace', 'escrow'];
  return required.every(name => contracts.addresses[name] && contracts.addresses[name] !== "0x0");
};

// Helper function to get network configuration
export const getNetworkConfig = () => {
  return contracts.network;
};

// Helper function to check if on correct network
export const isCorrectNetwork = async (provider) => {
  try {
    const network = await provider.getNetwork();
    return Number(network.chainId) === contracts.network.chainId;
  } catch (error) {
    console.error("Error checking network:", error);
    return false;
  }
};

export default contracts;