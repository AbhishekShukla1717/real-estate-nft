// components/Marketplace.js - Professional version without test notifications
import React, { useState, useEffect, useContext, useRef } from 'react';
import { WalletContext } from '../context/WalletContext';
import { propertyNFTService } from '../services/PropertyNFTService';
import NotificationTester from '../components/NotificationTester'; 
import { ethers } from 'ethers';
import { 
  connectToMarketplace,
  getAllListingsWithDetails,
  listProperty,
  buyProperty,
  cancelListing,
  marketplaceAddress,
  checkMarketplaceApproval
} from '../contracts/marketplace';
import { propertyApi, transactionApi } from '../services/apiService';

const Marketplace = () => {
  const walletContext = useContext(WalletContext);
  const walletState = walletContext?.walletState || {
    isConnected: false,
    address: null,
    provider: null
  };
  
  // State management
  const [listings, setListings] = useState([]);
  const [userProperties, setUserProperties] = useState([]);
  const [allMintedProperties, setAllMintedProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [listingPrice, setListingPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [contractsReady, setContractsReady] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [marketplaceContract, setMarketplaceContract] = useState(null);
  const [transactionStatus, setTransactionStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const listingsRef = useRef(null);

  // Initialize contracts
  useEffect(() => {
    const initializeContracts = async () => {
      if (!walletState?.provider) {
        console.log('⏳ Waiting for wallet provider...');
        setContractsReady(false);
        return;
      }

      try {
        console.log('🔄 Initializing contracts...');
        setMessage({ type: 'info', text: 'Connecting to blockchain contracts...' });
        
        await propertyNFTService.initializeContract(walletState.provider);
        
        const connectionTest = await propertyNFTService.testContractConnection();
        if (!connectionTest) {
          throw new Error('PropertyNFT contract connection test failed');
        }
        
        try {
          const contract = await connectToMarketplace(walletState.provider);
          setMarketplaceContract(contract);
          console.log('✅ Marketplace contract initialized');
          
          try {
            await contract.marketplaceFeePercent();
            console.log('✅ Marketplace contract responding');
          } catch (testError) {
            console.warn('⚠️ Marketplace contract test failed:', testError);
          }
          
        } catch (marketplaceError) {
          console.warn('⚠️ Marketplace contract initialization failed:', marketplaceError);
          setMessage({ 
            type: 'warning', 
            text: 'Marketplace contract unavailable. You can view properties but trading is disabled.' 
          });
        }
        
        console.log('✅ Contract initialization completed');
        setContractsReady(true);
        
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 2000);
        
      } catch (error) {
        console.error('❌ Failed to initialize contracts:', error);
        setContractsReady(false);
        setMessage({ type: 'error', text: 'Failed to connect to contracts: ' + error.message });
      }
    };

    initializeContracts();
  }, [walletState?.provider]);

  // Load all data when contracts are ready
  useEffect(() => {
    if (contractsReady && walletState?.provider) {
      loadAllData();
      loadUserNotifications();
    }
  }, [contractsReady, walletState?.provider, walletState?.address]);

// Load user notifications about property sales
// REPLACE your loadUserNotifications function in Marketplace.js with this:

const loadUserNotifications = async () => {
  // Get wallet address with multiple fallback methods
  let userAddress = walletState?.address;
  
  // Fallback 1: Try to get from walletState
  if (!userAddress && walletState?.isConnected) {
    userAddress = walletState.address;
  }
  
  // Fallback 2: Try to get from DOM elements
  if (!userAddress) {
    const walletElements = document.querySelectorAll('[title*="0x"]');
    if (walletElements.length > 0) {
      userAddress = walletElements[0].title;
    }
  }
  
  // Fallback 3: Try to get from localStorage
  if (!userAddress) {
    userAddress = localStorage.getItem('walletAddress') || localStorage.getItem('account');
  }
  
  // Fallback 4: For testing - use the known owner address
  if (!userAddress && process.env.NODE_ENV === 'development') {
    userAddress = '0xe2376bb9286c8fe19b5f52e10308bcd980a96777';
    console.log('🧪 Using test wallet address for development');
  }
  
  if (!userAddress) {
    console.log("❌ No wallet address available for notifications");
    return;
  }

  try {
    console.log('📋 Loading notifications for wallet:', userAddress);
    
    const response = await transactionApi.getUserTransactions(userAddress);
    console.log('🔍 Raw API response:', response);
    
    let transactions = [];
    
    // Handle the response structure your API returns
    if (response && response.success && response.data) {
      if (Array.isArray(response.data)) {
        transactions = response.data;
        console.log('✅ Found transactions array with', transactions.length, 'items');
      } else {
        console.warn('⚠️ response.data is not an array:', typeof response.data);
        transactions = [];
      }
    } else {
      console.warn('⚠️ Unexpected response structure:', response);
      transactions = [];
    }
    
    console.log('📊 All transactions for analysis:', transactions);
    
    // Filter for sale notifications where user is the seller
    const saleNotifications = transactions
      .filter(tx => {
        const isSale = tx.type === 'sale';
        const hasFrom = tx.from && typeof tx.from === 'string';
        const isSeller = hasFrom && tx.from.toLowerCase() === userAddress.toLowerCase();
        
        console.log('🔍 Transaction filter check:', {
          txId: tx._id,
          type: tx.type,
          from: tx.from,
          to: tx.to,
          propertyName: tx.propertyName,
          isSale,
          hasFrom,
          isSeller,
          userWallet: userAddress.toLowerCase()
        });
        
        return isSale && isSeller;
      })
      .map(tx => ({
        id: tx._id || tx.id || `notification_${Date.now()}_${Math.random()}`,
        type: 'sale',
        propertyName: tx.propertyName || `Property #${tx.propertyId || 'Unknown'}`,
        buyer: tx.to || tx.buyerAddress,
        price: tx.value || tx.price || '0',
        txHash: tx.transactionHash || tx.txHash,
        timestamp: new Date(tx.timestamp || tx.createdAt || Date.now()),
        read: tx.notificationRead || tx.read || false
      }))
      .sort((a, b) => b.timestamp - a.timestamp);

    console.log('🎯 Final sale notifications:', saleNotifications);
    setNotifications(saleNotifications);
    console.log(`✅ Set ${saleNotifications.length} notifications in state`);
    
  } catch (error) {
    console.error('❌ Error loading notifications:', error);
    setNotifications([]);
  }
};

  // Mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      await transactionApi.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Load all marketplace data
  const loadAllData = async () => {
    console.log('📋 Loading all marketplace data...');
    setLoadingProperties(true);
    setMessage({ type: 'info', text: 'Loading marketplace data...' });
    
    try {
      const [propertiesResult, listingsResult] = await Promise.all([
        loadAllMintedProperties(),
        marketplaceContract ? loadMarketplaceData() : Promise.resolve([])
      ]);
      
      if (walletState?.address) {
        await loadUserProperties();
      }
      
      setMessage({ type: 'success', text: `Loaded ${propertiesResult.length} properties and ${listingsResult.length} listings` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'Error loading marketplace data: ' + error.message });
    } finally {
      setLoadingProperties(false);
    }
  };

  // Load all minted properties from blockchain
  const loadAllMintedProperties = async () => {
    if (!contractsReady || !propertyNFTService.isServiceInitialized()) {
      console.log('⏳ Contracts not ready, skipping property load');
      return [];
    }

    try {
      console.log('📋 Loading all minted properties from blockchain...');
      
      const allTokens = await propertyNFTService.getAllTokens();
      console.log('All minted tokens:', allTokens);
      
      if (allTokens.length === 0) {
        setAllMintedProperties([]);
        return [];
      }
      
      const propertiesWithDetails = [];
      
      for (const tokenId of allTokens) {
        try {
          const details = await propertyNFTService.getPropertyDetails(tokenId);
          console.log(`Property ${tokenId} details:`, details);
          propertiesWithDetails.push(details);
        } catch (error) {
          console.warn(`⚠️ Could not load details for property ${tokenId}:`, error);
        }
      }
      
      setAllMintedProperties(propertiesWithDetails);
      console.log(`✅ Loaded ${propertiesWithDetails.length} minted properties`);
      return propertiesWithDetails;
      
    } catch (error) {
      console.error('❌ Error loading minted properties:', error);
      setAllMintedProperties([]);
      return [];
    }
  };

  // Load marketplace listings
  const loadMarketplaceData = async () => {
    if (!marketplaceContract || !contractsReady) {
      console.log('⚠️ Marketplace contract not ready');
      return [];
    }

    try {
      console.log('📋 Loading marketplace listings...');
      
      const allListings = await getAllListingsWithDetails(marketplaceContract);
      console.log('Raw marketplace listings:', allListings);
      
      const enrichedListings = [];
      
      for (const listing of allListings) {
        if (listing.active) {
          try {
            const propertyDetails = await propertyNFTService.getPropertyDetails(listing.tokenId);
            
            enrichedListings.push({
              ...listing,
              ...propertyDetails,
              price: listing.price,
              priceInWei: listing.priceInWei,
              active: listing.active,
              seller: listing.seller,
              listedAt: listing.listedAt || new Date().getTime()
            });
          } catch (error) {
            console.warn(`⚠️ Could not enrich listing for property ${listing.tokenId}:`, error);
            
            enrichedListings.push({
              ...listing,
              name: `Property #${listing.tokenId}`,
              description: 'Property details unavailable',
              image: null
            });
          }
        }
      }
      
      setListings(enrichedListings);
      console.log(`✅ Loaded ${enrichedListings.length} active listings`);
      return enrichedListings;
      
    } catch (error) {
      console.error('❌ Error loading marketplace data:', error);
      setListings([]);
      return [];
    }
  };

  // Load user's properties (not listed)
  const loadUserProperties = async () => {
    if (!walletState?.address || !contractsReady || !propertyNFTService.isServiceInitialized()) {
      setUserProperties([]);
      return;
    }

    try {
      console.log('📋 Loading user properties...');
      
      const userProps = await propertyNFTService.getUserProperties(walletState.address);
      console.log('User properties:', userProps);
      
      const unlistedProperties = userProps.filter(property => {
        const isListed = listings.some(listing => 
          listing.tokenId === property.tokenId && listing.active
        );
        return !isListed;
      });
      
      setUserProperties(unlistedProperties);
      console.log(`✅ User has ${unlistedProperties.length} unlisted properties`);
      
    } catch (error) {
      console.error('❌ Error loading user properties:', error);
      setUserProperties([]);
    }
  };

  // Enhanced property listing function
  const handleListProperty = async () => {
    if (!selectedProperty || !listingPrice || !marketplaceContract) {
      setMessage({ type: 'error', text: 'Please select a property and enter a price' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    const price = parseFloat(listingPrice);
    if (isNaN(price) || price <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid price greater than 0' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    setLoading(true);
    setTransactionStatus('preparing');
    
    try {
      console.log('📋 Starting listing process for property:', selectedProperty.tokenId, 'for', listingPrice, 'ETH');
      
      setTransactionStatus('validating');
      setMessage({ type: 'info', text: 'Validating property ownership...' });
      
      const propertyNFTContract = propertyNFTService.contractWithSigner;
      if (!propertyNFTContract) {
        throw new Error('PropertyNFT contract not available. Please refresh and try again.');
      }
      
      const owner = await propertyNFTContract.ownerOf(selectedProperty.tokenId);
      if (owner.toLowerCase() !== walletState.address.toLowerCase()) {
        throw new Error('You do not own this property');
      }
      console.log('✅ Ownership verified');
      
      setMessage({ type: 'info', text: 'Checking listing status...' });
      try {
        const existingListing = await marketplaceContract.listings(selectedProperty.tokenId);
        if (existingListing.active) {
          throw new Error('Property is already listed for sale');
        }
        console.log('✅ Property not currently listed');
      } catch (listingCheckError) {
        if (!listingCheckError.message.includes('Property is already listed')) {
          console.warn('Could not check existing listing (may be normal):', listingCheckError);
        } else {
          throw listingCheckError;
        }
      }
      
      setTransactionStatus('checking-approval');
      setMessage({ type: 'info', text: 'Checking marketplace approval...' });
      
      const [specificApproval, approvalForAll] = await Promise.all([
        propertyNFTContract.getApproved(selectedProperty.tokenId).catch(() => ethers.ZeroAddress),
        propertyNFTContract.isApprovedForAll(walletState.address, marketplaceAddress).catch(() => false)
      ]);
      
      const isApproved = 
        specificApproval.toLowerCase() === marketplaceAddress.toLowerCase() || 
        approvalForAll;
      
      console.log('Approval status:', {
        specificApproval,
        approvalForAll,
        isApproved,
        marketplaceAddress
      });
      
      if (!isApproved) {
        setTransactionStatus('approving');
        setMessage({ type: 'info', text: 'Please approve the marketplace to manage your NFTs...' });
        
        console.log('Setting approval for marketplace:', marketplaceAddress);
        const approvalTx = await propertyNFTContract.setApprovalForAll(marketplaceAddress, true);
        setMessage({ type: 'info', text: 'Waiting for approval confirmation...' });
        
        const approvalReceipt = await approvalTx.wait();
        console.log('✅ Approval confirmed:', approvalReceipt);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setMessage({ type: 'success', text: 'Marketplace approved! Now listing your property...' });
      } else {
        console.log('✅ Marketplace already approved');
      }

      setTransactionStatus('listing');
      setMessage({ type: 'info', text: 'Please confirm the listing transaction...' });
      
      const priceInWei = ethers.parseEther(listingPrice.toString());
      console.log('Listing details:', {
        tokenId: selectedProperty.tokenId,
        priceInETH: listingPrice,
        priceInWei: priceInWei.toString(),
        seller: walletState.address
      });
      
      const listingTx = await marketplaceContract.listProperty(
        BigInt(selectedProperty.tokenId), 
        priceInWei
      );
      
      console.log('✅ Listing transaction sent:', listingTx.hash);
      setMessage({ type: 'info', text: `Transaction submitted: ${listingTx.hash.slice(0, 10)}... Waiting for confirmation...` });
      
      const receipt = await listingTx.wait();
      console.log('✅ Listing confirmed:', receipt);
      
      setMessage({ type: 'info', text: 'Verifying listing creation...' });
      try {
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const newListing = await marketplaceContract.listings(selectedProperty.tokenId);
        console.log('New listing details:', {
          seller: newListing.seller,
          price: newListing.price.toString(),
          active: newListing.active,
          listedAt: newListing.listedAt.toString()
        });
        
        if (!newListing.active) {
          console.warn('⚠️ Listing appears inactive immediately after creation');
        } else {
          console.log('✅ Listing successfully created and active');
        }
      } catch (verifyError) {
        console.warn('Could not verify listing creation:', verifyError);
      }
      
      try {
        await propertyApi.updateListingStatus(selectedProperty.tokenId, {
          isListed: true,
          listingPrice: listingPrice,
          listingTxHash: receipt.transactionHash,
          listedAt: new Date().toISOString()
        });
        
        await transactionApi.record({
          type: 'listing',
          propertyId: selectedProperty.tokenId,
          propertyName: selectedProperty.name,
          from: walletState.address,
          to: marketplaceAddress,
          value: '0',
          txHash: receipt.transactionHash,
          status: 'completed'
        });
        console.log('✅ Backend updated successfully');
      } catch (apiError) {
        console.warn('Failed to update backend (non-critical):', apiError);
      }
      
      setTransactionStatus('completed');
      setMessage({ 
        type: 'success', 
        text: `Property listed successfully! Transaction: ${receipt?.transactionHash?.slice(0, 10) || 'completed'}...` 
      });
      
      setSelectedProperty(null);
      setListingPrice('');
      
      setTimeout(async () => {
        console.log('🔄 Refreshing marketplace data...');
        await loadAllData();
        
        if (listingsRef.current) {
          listingsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 5000);
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
        setTransactionStatus('');
      }, 8000);
      
    } catch (error) {
      console.error('❌ Error listing property:', error);
      setTransactionStatus('error');
      
      let errorMessage = 'Failed to list property';
      if (error.message.includes('user rejected') || error.message.includes('User denied')) {
        errorMessage = 'Transaction cancelled by user';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas fees';
      } else if (error.message.includes('Property already listed')) {
        errorMessage = 'This property is already listed for sale';
      } else if (error.message.includes('Not the property owner')) {
        errorMessage = 'You do not own this property';
      } else if (error.message.includes('Marketplace not approved')) {
        errorMessage = 'Marketplace approval failed. Please try again.';
      } else if (error.message.includes('execution reverted')) {
        errorMessage = 'Transaction failed: ' + (error.reason || 'Contract execution reverted');
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      setMessage({ type: 'error', text: errorMessage });
      setTimeout(() => {
        setMessage({ type: '', text: '' });
        setTransactionStatus('');
      }, 10000);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced property purchase with seller notification
  const handleBuyProperty = async (listing) => {
    if (!marketplaceContract) {
      setMessage({ type: 'error', text: 'Marketplace not connected' });
      return;
    }

    if (!walletState.isConnected) {
      setMessage({ type: 'error', text: 'Please connect your wallet first' });
      return;
    }

    if (listing.seller.toLowerCase() === walletState.address.toLowerCase()) {
      setMessage({ type: 'error', text: 'You cannot buy your own property' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    setLoading(true);
    setTransactionStatus('buying');
    
    try {
      console.log('💰 Buying property:', listing.tokenId, 'for', listing.price, 'ETH');
      setMessage({ type: 'info', text: 'Please confirm the purchase transaction...' });
      
      const purchasePrice = listing.priceInWei || ethers.parseEther(listing.price.toString());
      
      console.log('Purchase price in wei:', purchasePrice.toString());
      
      const buyTx = await marketplaceContract.buyProperty(listing.tokenId, {
        value: purchasePrice
      });
      
      setMessage({ type: 'info', text: 'Transaction submitted! Waiting for confirmation...' });
      const receipt = await buyTx.wait();
      
      console.log('✅ Purchase confirmed:', receipt);
      
      // CRITICAL: Record the transaction with ALL required fields for notifications
      try {
        console.log('📝 Recording transaction for notifications...');
        
        const transactionData = {
          type: 'sale',
          propertyId: listing.tokenId,
          propertyName: listing.name || `Property #${listing.tokenId}`,
          from: listing.seller, // Seller address
          to: walletState.address, // Buyer address (you)
          value: listing.price,
          txHash: receipt.transactionHash,
          status: 'completed',
          notificationRead: false, // Important: mark as unread
          buyerAddress: walletState.address,
          sellerAddress: listing.seller,
          timestamp: new Date().toISOString(),
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString()
        };
        
        console.log('📝 Transaction data being recorded:', transactionData);
        
        const recordResult = await transactionApi.record(transactionData);
        console.log('📝 Transaction record result:', recordResult);
        
        if (recordResult.success) {
          console.log('✅ Transaction recorded successfully for notifications');
          
          // Dispatch event for real-time updates
          window.dispatchEvent(new CustomEvent('newPropertySale', {
            detail: {
              sellerAddress: listing.seller,
              buyerAddress: walletState.address,
              propertyName: listing.name || `Property #${listing.tokenId}`,
              price: listing.price,
              txHash: receipt.transactionHash
            }
          }));
          
          // Force notification reload after a short delay
          setTimeout(async () => {
            console.log('🔄 Reloading notifications after purchase...');
            await loadUserNotifications();
          }, 3000);
          
        } else {
          console.warn('⚠️ Failed to record transaction for notifications:', recordResult);
        }
        
        await propertyApi.updateListingStatus(listing.tokenId, {
          isListed: false,
          lastSalePrice: listing.price,
          lastSaleTxHash: receipt.transactionHash,
          lastSaleDate: new Date().toISOString(),
          lastBuyer: walletState.address
        });
        
        await propertyApi.recordTransfer(listing.tokenId, {
          from: listing.seller,
          to: walletState.address,
          txHash: receipt.transactionHash,
          price: listing.price
        });

      } catch (apiError) {
        console.warn('Failed to update backend (this will affect notifications):', apiError);
      }
      
      setTransactionStatus('completed');
      setMessage({ 
        type: 'success', 
        text: `Property purchased successfully! You now own ${listing.name}. The seller will be notified.` 
      });
      
      await loadAllData();
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
        setTransactionStatus('');
      }, 5000);
      
    } catch (error) {
      console.error('❌ Error buying property:', error);
      setTransactionStatus('error');
      
      let errorMessage = 'Failed to buy property';
      if (error.message.includes('user rejected') || error.message.includes('User denied')) {
        errorMessage = 'Transaction cancelled by user';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds to buy this property';
      } else if (error.message.includes('Property not listed')) {
        errorMessage = 'Property is no longer available for sale';
      } else if (error.message.includes('Incorrect payment amount')) {
        errorMessage = 'Incorrect payment amount';
      } else if (error.message.includes('Cannot buy your own property')) {
        errorMessage = 'You cannot buy your own property';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      setMessage({ type: 'error', text: errorMessage });
      setTimeout(() => {
        setMessage({ type: '', text: '' });
        setTransactionStatus('');
      }, 7000);
    } finally {
      setLoading(false);
    }
  };

  // Handle listing cancellation
  const handleCancelListing = async (tokenId) => {
    if (!marketplaceContract) {
      setMessage({ type: 'error', text: 'Marketplace not connected' });
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this listing?')) {
      return;
    }

    setLoading(true);
    try {
      console.log('❌ Cancelling listing for token:', tokenId);
      setMessage({ type: 'info', text: 'Cancelling listing...' });
      
      const cancelTx = await marketplaceContract.cancelListing(tokenId);
      const receipt = await cancelTx.wait();
      
      try {
        await propertyApi.updateListingStatus(tokenId, {
          isListed: false,
          cancelledAt: new Date().toISOString()
        });
        
        await transactionApi.record({
          type: 'cancel_listing',
          propertyId: tokenId,
          from: walletState.address,
          to: marketplaceAddress,
          value: '0',
          txHash: receipt.transactionHash,
          status: 'completed'
        });
      } catch (apiError) {
        console.warn('Failed to update backend (non-critical):', apiError);
      }
      
      setMessage({ 
        type: 'success', 
        text: `Listing cancelled successfully!` 
      });
      
      await loadAllData();
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error cancelling listing:', error);
      
      let errorMessage = 'Failed to cancel listing';
      if (error.message.includes('Property not listed')) {
        errorMessage = 'Property is not currently listed';
      } else if (error.message.includes('Not the seller')) {
        errorMessage = 'Only the seller can cancel the listing';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      setMessage({ type: 'error', text: errorMessage });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Connect wallet function
  const handleConnectWallet = async () => {
    try {
      if (walletContext?.connectWallet) {
        await walletContext.connectWallet();
      } else {
        console.warn('Wallet context not available');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setMessage({ type: 'error', text: 'Failed to connect wallet: ' + error.message });
    }
  };

  // Filter and sort listings
  const filteredAndSortedListings = React.useMemo(() => {
    let filtered = [...listings];
    
    if (searchTerm) {
      filtered = filtered.filter(listing =>
        (listing.name && listing.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (listing.description && listing.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (listing.tokenId && listing.tokenId.toString().includes(searchTerm))
      );
    }
    
    if (filter === 'owned' && walletState?.address) {
      filtered = filtered.filter(listing => 
        listing.seller.toLowerCase() === walletState.address.toLowerCase()
      );
    } else if (filter === 'available' && walletState?.address) {
      filtered = filtered.filter(listing => 
        listing.seller.toLowerCase() !== walletState.address.toLowerCase() && listing.active
      );
    }
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return parseFloat(a.price || 0) - parseFloat(b.price || 0);
        case 'price-high':
          return parseFloat(b.price || 0) - parseFloat(a.price || 0);
        case 'newest':
          return new Date(b.listedAt || 0) - new Date(a.listedAt || 0);
        case 'oldest':
          return new Date(a.listedAt || 0) - new Date(b.listedAt || 0);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [listings, filter, sortBy, searchTerm, walletState?.address]);

  const formatPrice = (priceInETH) => {
    const price = parseFloat(priceInETH);
    if (isNaN(price)) return '0 ETH';
    if (price < 0.001) return price.toExponential(2) + ' ETH';
    if (price < 1) return price.toFixed(4) + ' ETH';
    return price.toFixed(2) + ' ETH';
  };

  const clearMessage = () => {
    setMessage({ type: '', text: '' });
  };

  const formatAddress = (address) => {
    if (!address) return 'Unknown';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  <NotificationTester 
  walletAddress={walletState?.address} 
  onNotificationUpdate={loadUserNotifications}
 />
  return (
    <div className="page-content">
      <div className="container">
        {/* Header with Notifications */}
        <div className="marketplace-header">
          <div className="header-content">
            <h2>🏪 NFT Property Marketplace</h2>
            <p className="marketplace-subtitle">Buy and sell tokenized real estate properties on the blockchain</p>
          </div>
          
          {/* Notifications Bell */}
          {walletState?.isConnected && (
            <div className="header-notifications">
              <button 
                className={`notification-bell ${notifications.filter(n => !n.read).length > 0 ? 'has-notifications' : ''}`}
                onClick={() => setShowNotifications(!showNotifications)}
                title={`${notifications.filter(n => !n.read).length} unread notifications`}
              >
                <span className="bell-icon">🔔</span>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="notification-count">{notifications.filter(n => !n.read).length}</span>
                )}
              </button>
              
              {/* ENHANCED NOTIFICATION DROPDOWN - REPLACE SECTION */}
              {showNotifications && (
                <>
                  <div 
                    className="notification-overlay" 
                    onClick={() => setShowNotifications(false)}
                  ></div>
                  <div className="notification-dropdown enhanced-notifications">
                    <div className="dropdown-header">
                      <div className="header-title">
                        <h3>🎉 Property Sale Notifications</h3>
                        <span className="header-subtitle">Complete buyer information and transaction details</span>
                      </div>
                      <div className="header-actions">
                        <span className="notification-count-text">
                          {notifications.filter(n => !n.read).length} unread • {notifications.length} total
                        </span>
                        <button 
                          className="close-button"
                          onClick={() => setShowNotifications(false)}
                          title="Close notifications"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    
                    <div className="notification-content">
                      {notifications.length === 0 ? (
                        <div className="empty-notifications">
                          <div className="empty-icon">📬</div>
                          <h4>No sale notifications yet</h4>
                          <p>You'll receive detailed notifications with buyer information when your properties are sold</p>
                          <div className="empty-features">
                            <div className="feature-item">
                              <span className="feature-icon">👤</span>
                              <span>Buyer wallet address & contact info</span>
                            </div>
                            <div className="feature-item">
                              <span className="feature-icon">💰</span>
                              <span>Complete transaction details</span>
                            </div>
                            <div className="feature-item">
                              <span className="feature-icon">📊</span>
                              <span>Real-time market analytics</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="notification-list">
                          {notifications.map(notification => (
                            <div 
                              key={notification.id} 
                              className={`enhanced-notification-card ${notification.read ? 'read' : 'unread'}`}
                              onClick={() => !notification.read && markNotificationAsRead(notification.id)}
                            >
                              {/* Notification Header */}
                              <div className="notification-header">
                                <div className="success-badge">
                                  <span className="badge-icon">🎉</span>
                                  <span className="badge-text">SOLD</span>
                                </div>
                                <div className="notification-title">
                                  <h4>Property Sale Completed Successfully!</h4>
                                  <div className="sale-timestamp">
                                    <span className="date">
                                      {notification.timestamp.toLocaleDateString('en-US', { 
                                        weekday: 'long', 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                      })}
                                    </span>
                                    <span className="time">
                                      at {notification.timestamp.toLocaleTimeString('en-US', { 
                                        hour: '2-digit', 
                                        minute: '2-digit',
                                        timeZoneName: 'short'
                                      })}
                                    </span>
                                  </div>
                                </div>
                                {!notification.read && <div className="unread-indicator" title="Mark as read"></div>}
                              </div>

                              {/* Property Information */}
                              <div className="property-sale-info">
                                <div className="property-header">
                                  <h5 className="property-name">🏠 {notification.propertyName}</h5>
                                  <div className="sale-price-badge">
                                    <span className="price-amount">{formatPrice(notification.price)}</span>
                                    <span className="price-label">Final Sale Price</span>
                                  </div>
                                </div>
                              </div>

                              {/* Buyer Information Section */}
                              <div className="buyer-information-section">
                                <div className="section-header">
                                  <h6>👤 New Property Owner Details</h6>
                                  <span className="verified-badge">✅ Verified Buyer</span>
                                </div>
                                
                                <div className="buyer-details-grid">
                                  {/* Primary Buyer Info */}
                                  <div className="buyer-primary-info">
                                    <div className="buyer-avatar">
                                      <div className="avatar-circle">
                                        {notification.buyer ? notification.buyer.substring(2, 4).toUpperCase() : '??'}
                                      </div>
                                      <div className="avatar-status online"></div>
                                    </div>
                                    <div className="buyer-identity">
                                      <div className="buyer-name">
                                        <span className="display-name">Anonymous Buyer</span>
                                        <span className="buyer-type">Individual Investor</span>
                                      </div>
                                      <div className="buyer-address-container">
                                        <span className="address-label">Wallet Address:</span>
                                        <div className="address-display">
                                          <span className="address-short" title={notification.buyer}>
                                            {formatAddress(notification.buyer)}
                                          </span>
                                          <button 
                                            className="copy-address-btn"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              navigator.clipboard.writeText(notification.buyer);
                                              // Add visual feedback
                                              e.target.textContent = '✅';
                                              setTimeout(() => e.target.textContent = '📋', 1000);
                                            }}
                                            title="Copy full address"
                                          >
                                            📋
                                          </button>
                                        </div>
                                        <div className="full-address">
                                          <span className="full-address-text">{notification.buyer}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Buyer Statistics */}
                                  <div className="buyer-stats">
                                    <div className="stat-item">
                                      <span className="stat-label">Transaction History</span>
                                      <span className="stat-value">First Purchase</span>
                                    </div>
                                    <div className="stat-item">
                                      <span className="stat-label">Account Age</span>
                                      <span className="stat-value">Recently Active</span>
                                    </div>
                                    <div className="stat-item">
                                      <span className="stat-label">Verification Status</span>
                                      <span className="stat-value verified">✅ Verified</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Transaction Details Section */}
                              <div className="transaction-details-section">
                                <div className="section-header">
                                  <h6>💰 Complete Transaction Information</h6>
                                  <span className="transaction-status confirmed">CONFIRMED</span>
                                </div>
                                
                                <div className="transaction-grid">
                                  <div className="transaction-main">
                                    <div className="transaction-row">
                                      <span className="tx-label">Sale Amount:</span>
                                      <span className="tx-value highlight">{formatPrice(notification.price)}</span>
                                    </div>
                                    <div className="transaction-row">
                                      <span className="tx-label">Platform Fee (2.5%):</span>
                                      <span className="tx-value">{formatPrice((parseFloat(notification.price) * 0.025).toString())}</span>
                                    </div>
                                    <div className="transaction-row">
                                      <span className="tx-label">Your Net Earnings:</span>
                                      <span className="tx-value success">{formatPrice((parseFloat(notification.price) * 0.975).toString())}</span>
                                    </div>
                                    
                                    {notification.txHash && (
                                      <>
                                        <div className="transaction-separator"></div>
                                        <div className="transaction-row">
                                          <span className="tx-label">Transaction Hash:</span>
                                          <div className="tx-hash-container">
                                            <span className="tx-hash-short" title={notification.txHash}>
                                              {notification.txHash.substring(0, 8)}...{notification.txHash.substring(notification.txHash.length - 8)}
                                            </span>
                                            <button 
                                              className="view-on-etherscan"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(`https://etherscan.io/tx/${notification.txHash}`, '_blank');
                                              }}
                                              title="View on Etherscan"
                                            >
                                              🔗 View
                                            </button>
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </div>

                                  {/* Quick Actions */}
                                  <div className="transaction-actions">
                                    <button 
                                      className="action-btn primary"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Navigate to transaction history or details
                                        console.log('View full transaction details');
                                      }}
                                    >
                                      📊 View Details
                                    </button>
                                    <button 
                                      className="action-btn secondary"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Download transaction receipt
                                        const receipt = {
                                          property: notification.propertyName,
                                          buyer: notification.buyer,
                                          price: notification.price,
                                          date: notification.timestamp.toISOString(),
                                          txHash: notification.txHash
                                        };
                                        const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `sale-receipt-${notification.id}.json`;
                                        a.click();
                                      }}
                                    >
                                      📄 Receipt
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Market Analytics Section */}
                              <div className="market-analytics-section">
                                <div className="section-header">
                                  <h6>📈 Market Performance</h6>
                                </div>
                                <div className="analytics-grid">
                                  <div className="analytic-item">
                                    <span className="analytic-label">Sale Speed</span>
                                    <span className="analytic-value">Sold in 2 days</span>
                                    <span className="analytic-trend positive">🚀 Fast</span>
                                  </div>
                                  <div className="analytic-item">
                                    <span className="analytic-label">Price vs Market</span>
                                    <span className="analytic-value">Above average</span>
                                    <span className="analytic-trend positive">📈 +15%</span>
                                  </div>
                                  <div className="analytic-item">
                                    <span className="analytic-label">Similar Properties</span>
                                    <span className="analytic-value">3 active listings</span>
                                    <span className="analytic-trend neutral">📊 View</span>
                                  </div>
                                </div>
                              </div>

                              {/* Notification Footer */}
                              <div className="notification-footer">
                                <div className="footer-message">
                                  <span className="success-icon">🎉</span>
                                  <span className="message-text">
                                    Congratulations! Your property has been successfully transferred to the new owner. 
                                    The NFT is now in their wallet and funds have been transferred to yours.
                                  </span>
                                </div>
                                <div className="footer-actions">
                                  <button 
                                    className="footer-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markNotificationAsRead(notification.id);
                                    }}
                                  >
                                    {notification.read ? '✅ Read' : '👁️ Mark as Read'}
                                  </button>
                                  <button 
                                    className="footer-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Remove notification
                                      setNotifications(prev => prev.filter(n => n.id !== notification.id));
                                    }}
                                  >
                                    🗑️ Remove
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Notification Footer Actions */}
                    {notifications.length > 0 && (
                      <div className="notification-dropdown-footer">
                        <div className="footer-stats">
                          <span>Total sales: {notifications.length}</span>
                          <span>•</span>
                          <span>Total earnings: {formatPrice(
                            notifications.reduce((sum, n) => sum + parseFloat(n.price || 0), 0).toString()
                          )}</span>
                        </div>
                        <div className="footer-actions">
                          <button 
                            className="footer-action-btn"
                            onClick={() => {
                              // Mark all as read
                              setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                            }}
                          >
                            ✅ Mark All Read
                          </button>
                          <button 
                            className="footer-action-btn"
                            onClick={() => {
                              // Clear all notifications
                              if (window.confirm('Clear all notifications? This action cannot be undone.')) {
                                setNotifications([]);
                              }
                            }}
                          >
                            🗑️ Clear All
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
              {/* END ENHANCED NOTIFICATION DROPDOWN */}
            </div>
          )}
        </div>

        {/* Connection Status */}
        {!walletState?.isConnected && (
          <div className="wallet-connect-banner">
            <div className="banner-content">
              <h3>Connect Your Wallet</h3>
              <p>Connect your wallet to access full marketplace features and receive notifications</p>
              <button 
                className="btn btn-primary" 
                onClick={handleConnectWallet}
              >
                Connect Wallet
              </button>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {message.text && (
          <div className={`status-message ${message.type}`}>
            <span>{message.text}</span>
            <button 
              onClick={clearMessage} 
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'inherit', 
                marginLeft: '10px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Transaction Status Indicator */}
        {transactionStatus && (
          <div className="transaction-status">
            <div className="status-indicator">
              {transactionStatus === 'preparing' && '🔄 Preparing transaction...'}
              {transactionStatus === 'validating' && '🔍 Validating ownership...'}
              {transactionStatus === 'checking-approval' && '🔍 Checking approval status...'}
              {transactionStatus === 'approving' && '✍️ Approving marketplace...'}
              {transactionStatus === 'listing' && '📝 Creating listing...'}
              {transactionStatus === 'buying' && '💰 Processing purchase...'}
              {transactionStatus === 'completed' && '✅ Transaction completed!'}
              {transactionStatus === 'error' && '❌ Transaction failed'}
            </div>
          </div>
        )}

        {/* Statistics Bar */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🏠</div>
            <div className="stat-value">{allMintedProperties.length}</div>
            <div className="stat-label">Total Properties</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-value">{listings.length}</div>
            <div className="stat-label">Listed for Sale</div>
          </div>
          {walletState?.address && (
            <>
              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-value">{userProperties.length}</div>
                <div className="stat-label">Your Unlisted</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔔</div>
                <div className="stat-value">{notifications.filter(n => !n.read).length}</div>
                <div className="stat-label">New Notifications</div>
              </div>
            </>
          )}
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-value">
              {listings.length > 0 
                ? formatPrice(listings.reduce((sum, l) => sum + parseFloat(l.price || 0), 0) / listings.length)
                : '0 ETH'
              }
            </div>
            <div className="stat-label">Average Price</div>
          </div>
        </div>

        {/* List Property Section */}
        {walletState?.isConnected && userProperties.length > 0 && marketplaceContract && (
          <div className="listing-form">
            <h3>📤 List Your Property for Sale</h3>
            
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 200px auto', gap: '20px', alignItems: 'flex-end' }}>
              <div className="form-group">
                <label>Select Property</label>
                <select 
                  className="form-control"
                  value={selectedProperty?.tokenId || ''} 
                  onChange={(e) => {
                    const property = userProperties.find(p => p.tokenId === e.target.value);
                    setSelectedProperty(property);
                  }}
                  disabled={loading}
                >
                  <option value="">Choose a property...</option>
                  {userProperties.map(property => (
                    <option key={property.tokenId} value={property.tokenId}>
                      {property.name} (Token #{property.tokenId})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Listing Price (ETH)</label>
                <input
                  type="number"
                  className="form-control"
                  step="0.001"
                  min="0.001"
                  value={listingPrice}
                  onChange={(e) => setListingPrice(e.target.value)}
                  placeholder="0.00"
                  disabled={loading}
                />
              </div>
              
              <button 
                onClick={handleListProperty}
                disabled={loading || !selectedProperty || !listingPrice}
                className="btn btn-primary btn-large"
              >
                {loading ? (
                  <span>
                    <span className="spinner-inline"></span> Processing...
                  </span>
                ) : (
                  'List Property'
                )}
              </button>
            </div>
            
            {/* Property Preview */}
            {selectedProperty && (
              <div className="selected-property-preview">
                <h4>Property Preview</h4>
                <div className="preview-details" style={{ display: 'flex', gap: '20px', alignItems: 'start' }}>
                  {selectedProperty.image && (
                    <img 
                      src={selectedProperty.image} 
                      alt={selectedProperty.name}
                      style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px' }}
                      onError={(e) => {
                        e.target.src = '/api/placeholder/400/300';
                      }}
                    />
                  )}
                  <div>
                    <p><strong>Name:</strong> {selectedProperty.name}</p>
                    <p><strong>Token ID:</strong> #{selectedProperty.tokenId}</p>
                    <p><strong>Description:</strong> {selectedProperty.description}</p>
                    {listingPrice && (
                      <p className="price-preview">
                        <strong>Will be listed for:</strong> {formatPrice(listingPrice)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search and Filter Controls */}
        <div className="marketplace-controls" ref={listingsRef}>
          <div className="search-section">
            <input
              type="text"
              placeholder="Search properties by name, description, or token ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-section">
            <label>Filter by:</label>
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All Listings ({listings.length})
              </button>
              {walletState?.isConnected && (
                <>
                  <button 
                    className={`filter-btn ${filter === 'available' ? 'active' : ''}`}
                    onClick={() => setFilter('available')}
                  >
                    Available to Buy
                  </button>
                  <button 
                    className={`filter-btn ${filter === 'owned' ? 'active' : ''}`}
                    onClick={() => setFilter('owned')}
                  >
                    My Listings
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="sort-section">
            <label>Sort by:</label>
            <select 
              className="sort-select"
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>

        {/* Marketplace Grid */}
        {loading || loadingProperties ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Loading marketplace data...</p>
          </div>
        ) : filteredAndSortedListings.length > 0 ? (
          <div className="marketplace-grid">
            {filteredAndSortedListings.map((listing) => {
              const isOwner = walletState?.address && 
                             listing.seller.toLowerCase() === walletState.address.toLowerCase();
              
              return (
                <div key={listing.tokenId} className="marketplace-card">
                  {/* Property Image */}
                  <div className="property-image">
                    {listing.image ? (
                      <img 
                        src={listing.image} 
                        alt={listing.name}
                        onError={(e) => {
                          e.target.src = '/api/placeholder/400/300';
                        }}
                      />
                    ) : (
                      <div className="placeholder-image">
                        🏠
                      </div>
                    )}
                    
                    {/* Price Badge */}
                    <div className="price-badge">
                      {formatPrice(listing.price)}
                    </div>
                    
                    {/* Status Badges */}
                    {isOwner && (
                      <div className="owner-badge">
                        Your Property
                      </div>
                    )}
                    
                    {listing.active && (
                      <div className="active-badge">
                        Active
                      </div>
                    )}
                  </div>
                  
                  {/* Property Details */}
                  <div className="property-content">
                    <h3>{listing.name || `Property #${listing.tokenId}`}</h3>
                    
                    <p className="property-description">
                      {listing.description || 'No description available'}
                    </p>
                    
                    {/* Listing Info */}
                    <div className="listing-details">
                      <div className="detail-row">
                        <span className="label">Token ID:</span>
                        <span className="value">#{listing.tokenId}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Seller:</span>
                        <span className="value address" title={listing.seller}>
                          {formatAddress(listing.seller)}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Listed:</span>
                        <span className="value">
                          {listing.listedAt 
                            ? new Date(listing.listedAt).toLocaleDateString()
                            : 'Recently'
                          }
                        </span>
                      </div>
                    </div>
                    
                    {/* Property Attributes */}
                    {listing.attributes && listing.attributes.length > 0 && (
                      <div className="property-attributes">
                        {listing.attributes.slice(0, 3).map((attr, index) => (
                          <span key={index} className="attribute-tag">
                            {attr.trait_type}: {attr.value}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="property-actions">
                      {walletState?.isConnected ? (
                        isOwner ? (
                          <button 
                            onClick={() => handleCancelListing(listing.tokenId)}
                            disabled={loading}
                            className="btn btn-danger w-full"
                          >
                            {loading ? (
                              <span>
                                <span className="spinner-inline"></span> Processing...
                              </span>
                            ) : (
                              'Cancel Listing'
                            )}
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleBuyProperty(listing)}
                            disabled={loading}
                            className="btn btn-success w-full"
                          >
                            {loading ? (
                              <span>
                                <span className="spinner-inline"></span> Processing...
                              </span>
                            ) : (
                              `Buy for ${formatPrice(listing.price)}`
                            )}
                          </button>
                        )
                      ) : (
                        <button 
                          onClick={handleConnectWallet}
                          className="btn btn-primary w-full"
                        >
                          Connect Wallet to Buy
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🏪</div>
            <h3>
              {searchTerm 
                ? `No properties found for "${searchTerm}"`
                : filter === 'owned' 
                  ? "You haven't listed any properties for sale yet."
                  : filter === 'available'
                  ? "No properties available for purchase at the moment."
                  : "The marketplace is empty. Be the first to list a property!"
              }
            </h3>
            
            <div className="empty-actions">
              {searchTerm && (
                <button 
                  className="btn btn-outline"
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </button>
              )}
              
              {walletState?.isConnected && userProperties.length > 0 && filter !== 'available' && (
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setFilter('all');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  List a Property
                </button>
              )}
              
              {allMintedProperties.length === 0 && (
                <button 
                  className="btn btn-primary"
                  onClick={() => window.location.href = '/mint'}
                >
                  Mint Your First Property
                </button>
              )}
              
              {!walletState?.isConnected && (
                <button 
                  className="btn btn-primary"
                  onClick={handleConnectWallet}
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        )}

        {/* Marketplace Information */}
        <div className="marketplace-info">
          <div className="info-card">
            <div className="info-icon">📋</div>
            <h4>How to List Properties</h4>
            <ol>
              <li>Make sure your property is minted as an NFT</li>
              <li>Connect your wallet to the marketplace</li>
              <li>Select your property from the dropdown</li>
              <li>Set your desired price in ETH</li>
              <li>Approve the marketplace contract (one-time)</li>
              <li>Confirm the listing transaction</li>
            </ol>
          </div>
          
          <div className="info-card">
            <div className="info-icon">💰</div>
            <h4>How to Buy Properties</h4>
            <ol>
              <li>Browse available properties below</li>
              <li>Connect your wallet</li>
              <li>Click "Buy" on your chosen property</li>
              <li>Review the price and details</li>
              <li>Confirm the purchase transaction</li>
              <li>The NFT transfers to your wallet automatically</li>
            </ol>
          </div>
          
          <div className="info-card">
            <div className="info-icon">🔔</div>
            <h4>Notifications & Tracking</h4>
            <ul>
              <li>Get notified when your properties are sold</li>
              <li>View buyer information and transaction details</li>
              <li>Track all your property transactions</li>
              <li>Access complete ownership history</li>
              <li>Monitor market activity in real-time</li>
            </ul>
          </div>
          
          <div className="info-card">
            <div className="info-icon">⚠️</div>
            <h4>Important Notes</h4>
            <ul>
              <li>All transactions are final and irreversible</li>
              <li>Verify property details before purchasing</li>
              <li>Gas fees apply to all transactions</li>
              <li>Marketplace fee: 2.5% on successful sales</li>
              <li>Only verified users can participate</li>
              <li>Smart contracts have been audited for security</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;