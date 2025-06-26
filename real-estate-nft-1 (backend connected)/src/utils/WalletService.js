// src/utils/WalletService.js
import { BrowserProvider } from "ethers";

class WalletService {
  constructor() {
    this.ethereum = window.ethereum;
    this.isConnected = false;
    this.address = "";
    this.listeners = [];
    
    // Initialize from localStorage if available (keeping wallet connection state locally for UX)
    const savedAddress = localStorage.getItem("walletAddress");
    const isWalletConnected = localStorage.getItem("walletConnected");
    
    if (savedAddress && isWalletConnected === "true") {
      this.isConnected = true;
      this.address = savedAddress;
    }
    
    // Setup event listeners for MetaMask
    this.setupEventListeners();
  }
  
  // Check if wallet is already connected
  async checkConnection() {
    if (!window.ethereum) return false;
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const isConnected = accounts && accounts.length > 0;
      
      if (isConnected) {
        this.setWalletState({
          isConnected: true,
          address: accounts[0]
        });
      }
      
      return isConnected;
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      return false;
    }
  }

  // Connect to wallet
  async connect() {
    if (!this.ethereum) {
      alert("Please install MetaMask to use this feature");
      return false;
    }
    
    try {
      const accounts = await this.ethereum.request({
        method: "eth_requestAccounts",
      });
      
      if (accounts.length > 0) {
        this.address = accounts[0];
        this.isConnected = true;
        localStorage.setItem("walletAddress", accounts[0]);
        localStorage.setItem("walletConnected", "true");
        this.notifyListeners();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      return false;
    }
  }
  
  // Disconnect wallet
  async disconnect() {
    try {
      // Clear local state first
      this.address = "";
      this.isConnected = false;
      localStorage.removeItem("walletAddress");
      localStorage.removeItem("walletConnected");
      
      // Notify listeners immediately for UI update
      this.notifyListeners();
      
      // Optional: Try to revoke permissions (might not work in all cases)
      if (this.ethereum && this.ethereum.request) {
        try {
          await this.ethereum.request({
            method: "wallet_revokePermissions",
            params: [{ eth_accounts: {} }]
          });
        } catch (revokeError) {
          // This might fail on some wallets, which is okay
          console.log("Could not revoke permissions:", revokeError.message);
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      return false;
    }
  }
  
  // Force refresh connection status
  async refreshConnection() {
    if (!this.ethereum) return false;
    
    try {
      const accounts = await this.ethereum.request({
        method: "eth_accounts",
      });
      
      const wasConnected = this.isConnected;
      const oldAddress = this.address;
      
      if (accounts.length > 0) {
        this.address = accounts[0];
        this.isConnected = true;
        localStorage.setItem("walletAddress", accounts[0]);
        localStorage.setItem("walletConnected", "true");
      } else {
        this.address = "";
        this.isConnected = false;
        localStorage.removeItem("walletAddress");
        localStorage.removeItem("walletConnected");
      }
      
      // Only notify if state actually changed
      if (wasConnected !== this.isConnected || oldAddress !== this.address) {
        this.notifyListeners();
      }
      
      return this.isConnected;
    } catch (error) {
      console.error("Error refreshing connection:", error);
      return false;
    }
  }
  
  // Get current wallet state
  getWalletState() {
    return {
      isConnected: this.isConnected,
      address: this.address,
      provider: this.ethereum ? new BrowserProvider(this.ethereum) : null
    };
  }
  
  // Subscribe to wallet changes
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }
  
  // Notify all listeners of changes
  notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.getWalletState());
    }
  }
  
  // Check if MetaMask is installed
  isMetaMaskInstalled() {
    return Boolean(this.ethereum && this.ethereum.isMetaMask);
  }

  // Add ethereum event listeners
  setupEventListeners() {
    if (!window.ethereum) return;

    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        this.disconnect();
      } else {
        this.setWalletState({
          isConnected: true,
          address: accounts[0]
        });
      }
    });

    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    });
  }

  // Set wallet state and manage localStorage
  setWalletState({ isConnected, address }) {
    this.isConnected = isConnected;
    this.address = address;
    localStorage.setItem("walletAddress", address);
    localStorage.setItem("walletConnected", isConnected ? "true" : "false");
    this.notifyListeners();
  }
}

// Create singleton instance
const walletService = new WalletService();
export default walletService;