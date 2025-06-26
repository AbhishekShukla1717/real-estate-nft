// context/WalletContext.js - SAFE IMPLEMENTATION
import React, { createContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [walletState, setWalletState] = useState({
    isConnected: false,
    address: null,
    provider: null,
    signer: null
  });

  const [loading, setLoading] = useState(false);

  // Check if wallet is already connected on page load
  useEffect(() => {
    checkWalletConnection();
  }, []);

  // Check existing wallet connection
  const checkWalletConnection = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        if (accounts.length > 0) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          
          setWalletState({
            isConnected: true,
            address: accounts[0],
            provider: provider,
            signer: signer
          });
          
          console.log('✅ Wallet auto-connected:', accounts[0]);
        }
      }
    } catch (error) {
      console.error('❌ Error checking wallet connection:', error);
    }
  };

  // Connect wallet function
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask to use this application');
      return false;
    }

    setLoading(true);
    try {
      console.log('🔄 Requesting wallet connection...');
      
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        setWalletState({
          isConnected: true,
          address: accounts[0],
          provider: provider,
          signer: signer
        });

        console.log('✅ Wallet connected successfully:', accounts[0]);
        return true;
      }
    } catch (error) {
      console.error('❌ Error connecting wallet:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    setWalletState({
      isConnected: false,
      address: null,
      provider: null,
      signer: null
    });
    console.log('🔌 Wallet disconnected');
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          // Reconnect with new account
          connectWallet();
        }
      };

      const handleChainChanged = () => {
        // Reload page on chain change
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Cleanup
      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  const contextValue = {
    walletState,
    connectWallet,
    disconnectWallet,
    loading
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

// Custom hook for using wallet context
export const useWallet = () => {
  const context = React.useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

export default WalletProvider;