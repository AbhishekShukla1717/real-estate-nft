import { Contract, ethers } from "ethers";
import { propertyRegistryAddress, propertyRegistryABI } from "../contracts/propertyregistry";
import walletService from "./WalletService";

class PropertyRegistryService {
  constructor() {
    this.contract = null;
    this.contractWithSigner = null;
  }

  // Initialize contract instance
  initializeContract() {
    const walletState = walletService.getWalletState();
    if (walletState.provider) {
      this.contract = new Contract(propertyRegistryAddress, propertyRegistryABI, walletState.provider);
      
      if (walletState.signer) {
        this.contractWithSigner = new Contract(propertyRegistryAddress, propertyRegistryABI, walletState.signer);
      }
    }
  }

  // Get property information by token ID
  async getPropertyInfo(tokenId) {
    try {
      if (!this.contract) {
        this.initializeContract();
      }

      if (!this.contract) {
        throw new Error("Contract not initialized. Please connect your wallet.");
      }

      const propertyInfo = await this.contract.getPropertyInfo(tokenId);
      
      return {
        physicalAddress: propertyInfo.physicalAddress,
        areaInSqFt: propertyInfo.areaInSqFt.toString(),
        propertyType: propertyInfo.propertyType,
        tokenId: propertyInfo.tokenId.toString(),
        currentOwner: propertyInfo.currentOwner
      };
    } catch (error) {
      console.error("Error fetching property info:", error);
      
      // If property not registered, return null instead of throwing
      if (error.message.includes("Property not registered")) {
        return null;
      }
      
      throw error;
    }
  }

  // Register a new property (admin only)
  async registerProperty(tokenId, physicalAddress, areaInSqFt, propertyType) {
    try {
      if (!this.contractWithSigner) {
        this.initializeContract();
      }

      if (!this.contractWithSigner) {
        throw new Error("Contract not initialized or no signer available. Please connect your wallet.");
      }

      // Check if user is admin
      const admin = await this.contract.admin();
      const walletState = walletService.getWalletState();
      
      if (admin.toLowerCase() !== walletState.address.toLowerCase()) {
        throw new Error("Only admin can register properties");
      }

      const tx = await this.contractWithSigner.registerProperty(
        tokenId,
        physicalAddress,
        parseInt(areaInSqFt),
        propertyType
      );

      console.log("Registration transaction sent:", tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log("Property registered successfully:", receipt);

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error("Error registering property:", error);
      throw error;
    }
  }

  // Update ownership (admin only - should be called when NFT ownership changes)
  async updateOwnership(tokenId) {
    try {
      if (!this.contractWithSigner) {
        this.initializeContract();
      }

      if (!this.contractWithSigner) {
        throw new Error("Contract not initialized or no signer available. Please connect your wallet.");
      }

      // Check if user is admin
      const admin = await this.contract.admin();
      const walletState = walletService.getWalletState();
      
      if (admin.toLowerCase() !== walletState.address.toLowerCase()) {
        throw new Error("Only admin can update ownership");
      }

      const tx = await this.contractWithSigner.updateOwnership(tokenId);
      console.log("Update ownership transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Ownership updated successfully:", receipt);

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error("Error updating ownership:", error);
      throw error;
    }
  }

  // Check if connected user is admin
  async isAdmin() {
    try {
      if (!this.contract) {
        this.initializeContract();
      }

      if (!this.contract) {
        return false;
      }

      const admin = await this.contract.admin();
      const walletState = walletService.getWalletState();
      
      return admin.toLowerCase() === walletState.address.toLowerCase();
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  }

  // Get admin address
  async getAdmin() {
    try {
      if (!this.contract) {
        this.initializeContract();
      }

      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      return await this.contract.admin();
    } catch (error) {
      console.error("Error getting admin address:", error);
      throw error;
    }
  }

  // Listen to PropertyRegistered events
  async listenToPropertyRegistered(callback) {
    try {
      if (!this.contract) {
        this.initializeContract();
      }

      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      this.contract.on("PropertyRegistered", (tokenId, owner, physicalAddress, event) => {
        callback({
          tokenId: tokenId.toString(),
          owner: owner,
          physicalAddress: physicalAddress,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      });
    } catch (error) {
      console.error("Error setting up event listener:", error);
      throw error;
    }
  }

  // Listen to OwnershipTransferred events
  async listenToOwnershipTransferred(callback) {
    try {
      if (!this.contract) {
        this.initializeContract();
      }

      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      this.contract.on("OwnershipTransferred", (tokenId, oldOwner, newOwner, event) => {
        callback({
          tokenId: tokenId.toString(),
          oldOwner: oldOwner,
          newOwner: newOwner,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      });
    } catch (error) {
      console.error("Error setting up event listener:", error);
      throw error;
    }
  }

  // Remove all event listeners
  removeAllListeners() {
    if (this.contract) {
      this.contract.removeAllListeners();
    }
  }
}

// Export singleton instance
const propertyRegistryService = new PropertyRegistryService();
export default propertyRegistryService;