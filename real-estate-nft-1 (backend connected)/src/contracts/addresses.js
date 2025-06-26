// contracts/addresses.js - CENTRALIZED CONTRACT ADDRESSES
// Update these with your actual deployed contract addresses

export const CONTRACT_ADDRESSES = {
  // Your deployed PropertyNFT contract address
  PROPERTY_NFT: "0x768AFeA04DaC07ece9aa54109eE246e80948d9C3",
  
  // Your deployed Marketplace contract address  
  MARKETPLACE: "0xE73E34dc58E839eF58B64B3FC81F37BC864a9065",
  
  // Your deployed PropertyRegistry contract address
  PROPERTY_REGISTRY: "0x5A86858aA3b595FD6663c2296741eF4cd8BC4d01",
  
  // Your deployed KYC contract address (if separate)
  KYC_CONTRACT: "0xF989Aeb6467D7a9e82559faC859046Ec54054940",
  
  // Your deployed Escrow contract address
  ESCROW: "0x32f99155646d147b8A4846470b64a96dD9cBa414"
};

// Export individual addresses for backward compatibility
export const {
  PROPERTY_NFT: contractAddress,
  MARKETPLACE: marketplaceAddress,
  PROPERTY_REGISTRY: propertyRegistryAddress,
  KYC_CONTRACT: kycContractAddress,
  ESCROW: escrowAddress
} = CONTRACT_ADDRESSES;

// Network configuration
export const NETWORK_CONFIG = {
  chainId: 11155111, // Sepolia testnet
  chainName: "Sepolia",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrls: ["https://sepolia.infura.io/v3/YOUR_INFURA_KEY"],
  blockExplorerUrls: ["https://sepolia.etherscan.io"]
};

export default CONTRACT_ADDRESSES;