// components/Properties.js - Professional version without blue notification box
import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Contract } from "ethers";
import { contractAddress, contractABI } from "../contracts/propertynft";
import { WalletContext } from "../context/WalletContext";
import walletService from "../utils/WalletService";
import { propertyApi, userApi, transactionApi } from "../services/apiService";
import { propertyNFTService } from "../services/PropertyNFTService";

const Properties = () => {
  const walletContext = useContext(WalletContext);
  const walletState = walletContext?.walletState || {
    isConnected: false,
    address: "",
    provider: null
  };
  
  const [filter, setFilter] = useState("all");
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ownedTokenIds, setOwnedTokenIds] = useState([]);
  const [isVerified, setIsVerified] = useState(false);
  const [userStatus, setUserStatus] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Initialize PropertyNFT service if wallet is connected
        if (walletState?.provider) {
          await propertyNFTService.initializeContract(walletState.provider);
        }
        
        if (walletState?.address) {
          await Promise.all([
            checkUserVerification(walletState.address),
            fetchOwnedTokens(walletState.address),
            loadUserNotifications()
          ]);
        }
        
        await loadProperties();
        
      } catch (error) {
        console.error("Error initializing app:", error);
        setError("Failed to initialize application. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, [walletState?.provider, walletState?.address]);

  // Load user notifications about property sales
  const loadUserNotifications = async () => {
    if (!walletState?.address) return;

    try {
      console.log('📋 Loading notifications for:', walletState.address);
      const response = await transactionApi.getUserTransactions(walletState.address);
      
      let transactions = [];
      
      // Handle different response structures
      if (response && response.success && response.data) {
        if (Array.isArray(response.data)) {
          transactions = response.data;
        } else if (response.data.transactions && Array.isArray(response.data.transactions)) {
          transactions = response.data.transactions;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          transactions = response.data.data;
        } else {
          console.warn('Unexpected response.data structure:', response.data);
          transactions = [];
        }
      } else if (response && Array.isArray(response)) {
        transactions = response;
      } else {
        console.log('No valid transaction data found in response');
        transactions = [];
      }
      
      const saleNotifications = transactions
        .filter(tx => {
          const isValidSale = tx && 
                            tx.type === 'sale' && 
                            tx.from && 
                            typeof tx.from === 'string' &&
                            tx.from.toLowerCase() === walletState.address.toLowerCase();
          return isValidSale;
        })
        .map(tx => ({
          id: tx._id || tx.id || `notification_${Date.now()}_${Math.random()}`,
          type: 'sale',
          propertyName: tx.propertyName || tx.property_name || `Property #${tx.propertyId || tx.property_id || 'Unknown'}`,
          buyer: tx.to || tx.buyer || tx.buyerAddress,
          price: tx.value || tx.price || tx.amount || '0',
          txHash: tx.txHash || tx.tx_hash || tx.transactionHash,
          timestamp: new Date(tx.createdAt || tx.created_at || tx.timestamp || Date.now()),
          read: tx.notificationRead || tx.notification_read || tx.read || false
        }))
        .sort((a, b) => b.timestamp - a.timestamp);

      setNotifications(saleNotifications);
      console.log(`✅ Loaded ${saleNotifications.length} sale notifications`);
      
    } catch (error) {
      console.error('Error loading notifications:', error);
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

  // Check user verification status
  const checkUserVerification = async (address) => {
    try {
      const response = await userApi.checkUserStatus(address);
      if (response.success && response.data) {
        setUserStatus(response.data);
        setIsVerified(response.data.status === 'verified');
      } else {
        setIsVerified(false);
        setUserStatus(null);
      }
    } catch (error) {
      console.error("Error checking user verification:", error);
      setIsVerified(false);
      setUserStatus(null);
    }
  };

  // Load all properties from various sources
  const loadProperties = async () => {
    try {
      let allProperties = [];
      
      // Load from blockchain if service is initialized
      if (propertyNFTService.isServiceInitialized()) {
        const blockchainProperties = await loadBlockchainProperties();
        allProperties = [...blockchainProperties];
      }
      
      // Load from backend API
      try {
        const response = await propertyApi.getAllProperties();
        if (response.success && response.data) {
          const apiProperties = response.data.map(prop => ({
            id: prop.propertyId || prop._id,
            title: prop.name,
            description: prop.description,
            owner: prop.owner || prop.ownerAddress,
            status: prop.status || 'Available',
            price: prop.price || 'Not listed',
            location: prop.physicalAddress || prop.location || 'Unknown',
            image: prop.images?.[0]?.path || '/api/placeholder/400/250',
            tokenId: prop.tokenId,
            areaInSqFt: prop.areaInSqFt || 1000,
            propertyType: prop.propertyType || 'Residential',
            submissionDate: prop.submissionDate,
            approvalDate: prop.approvalDate,
            isFromAPI: true,
            isListed: prop.isListed || false,
            listingPrice: prop.listingPrice,
            lastSalePrice: prop.lastSalePrice,
            lastSaleDate: prop.lastSaleDate
          }));
          
          // Merge with blockchain properties, avoiding duplicates
          apiProperties.forEach(apiProp => {
            if (!allProperties.some(p => p.tokenId && p.tokenId === apiProp.tokenId)) {
              allProperties.push(apiProp);
            }
          });
        }
      } catch (apiError) {
        console.warn("API properties load failed:", apiError);
      }
      
      // Add mock properties if no real properties exist
      if (allProperties.length === 0) {
        allProperties = getMockProperties();
      }
      
      setProperties(allProperties);
      console.log(`✅ Loaded ${allProperties.length} properties`);
      
    } catch (error) {
      console.error("Error loading properties:", error);
      setProperties(getMockProperties());
    }
  };

  // Load properties from blockchain
  const loadBlockchainProperties = async () => {
    try {
      const allTokens = await propertyNFTService.getAllTokens();
      console.log('Blockchain tokens:', allTokens);
      
      const blockchainProperties = [];
      
      for (const tokenId of allTokens) {
        try {
          const details = await propertyNFTService.getPropertyDetails(tokenId);
          blockchainProperties.push({
            id: `blockchain_${tokenId}`,
            title: details.name,
            description: details.description,
            owner: details.owner,
            status: 'Minted',
            price: 'See marketplace',
            location: 'Blockchain',
            image: details.image || '/api/placeholder/400/250',
            tokenId: details.tokenId,
            areaInSqFt: 1000,
            propertyType: 'NFT Property',
            isFromBlockchain: true,
            attributes: details.attributes
          });
        } catch (error) {
          console.warn(`Failed to load details for token ${tokenId}:`, error);
        }
      }
      
      return blockchainProperties;
    } catch (error) {
      console.error("Error loading blockchain properties:", error);
      return [];
    }
  };

  // Get mock properties for demonstration
  const getMockProperties = () => [
    {
      id: "mock1",
      title: "Luxury Apartment in Mumbai",
      description: "Modern 3BHK with stunning city views and premium amenities",
      owner: "0x123...abc",
      status: "Available",
      price: "₹1.2 Cr",
      location: "Mumbai, Maharashtra",
      image: "/api/placeholder/400/250",
      tokenId: null,
      areaInSqFt: 1200,
      propertyType: "Residential",
      isMock: true
    },
    {
      id: "mock2",
      title: "Beach Villa in Goa",
      description: "Exclusive beachfront property with private access to Calangute Beach",
      owner: "0x456...def",
      status: "Sold",
      price: "₹3.5 Cr",
      location: "Goa",
      image: "/api/placeholder/400/250",
      tokenId: null,
      areaInSqFt: 2500,
      propertyType: "Villa",
      isMock: true
    },
    {
      id: "mock3",
      title: "Garden Cottage in Ooty",
      description: "Charming cottage surrounded by tea estates and mountain views",
      owner: walletState.address || "0x789...ghi",
      status: "Available",
      price: "₹85 Lac",
      location: "Ooty, Tamil Nadu",
      image: "/api/placeholder/400/250",
      tokenId: null,
      areaInSqFt: 800,
      propertyType: "Cottage",
      isMock: true
    }
  ];
  
  // Fetch owned tokens from blockchain
  const fetchOwnedTokens = async (address) => {
    try {
      if (!propertyNFTService.isServiceInitialized()) return;
      
      const userProperties = await propertyNFTService.getUserProperties(address);
      const tokenIds = userProperties.map(prop => prop.tokenId);
      setOwnedTokenIds(tokenIds);
      console.log(`User owns tokens: ${tokenIds.join(', ')}`);
    } catch (error) {
      console.error("Error fetching owned tokens:", error);
      setOwnedTokenIds([]);
    }
  };
  
  // Connect wallet function
  const connectWallet = async () => {
    if (!walletService.isMetaMaskInstalled()) {
      alert("Please install MetaMask to use this feature");
      return;
    }
    
    try {
      if (walletContext?.connectWallet) {
        await walletContext.connectWallet();
      } else {
        await walletService.connect();
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("Failed to connect wallet. Please try again.");
    }
  };
  
  const handleMintClick = (propertyId) => {
    if (!walletState.isConnected) {
      if (window.confirm("You need to connect your wallet first. Connect now?")) {
        connectWallet();
      }
      return;
    }
    
    if (!isVerified) {
      if (window.confirm("You need to complete KYC verification before minting. Go to registration?")) {
        navigate("/register");
      }
      return;
    }
    
    navigate(`/mint`);
  };

  const handleViewInMarketplace = () => {
    navigate('/marketplace');
  };

  const formatPrice = (priceInETH) => {
    const price = parseFloat(priceInETH);
    if (isNaN(price)) return '0 ETH';
    if (price < 0.001) return price.toExponential(2) + ' ETH';
    if (price < 1) return price.toFixed(4) + ' ETH';
    return price.toFixed(2) + ' ETH';
  };

  // Filter and sort properties
  const filteredAndSortedProperties = React.useMemo(() => {
    let filtered = [...properties];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(property =>
        property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.propertyType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status/ownership filter
    if (filter === "owned" && walletState?.address) {
      filtered = filtered.filter(property => 
        (property.owner && property.owner.toLowerCase() === walletState.address.toLowerCase()) ||
        (property.tokenId && ownedTokenIds.includes(property.tokenId))
      );
    } else if (filter === "available") {
      filtered = filtered.filter(property => 
        property.status && property.status.toLowerCase() === 'available'
      );
    } else if (filter === "minted") {
      filtered = filtered.filter(property => 
        property.tokenId && (property.status === 'Minted' || property.isFromBlockchain)
      );
    } else if (filter === "pending") {
      filtered = filtered.filter(property => 
        property.status === 'pending' || property.status === 'submitted'
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'price':
          // Simple price comparison (you might want to improve this)
          return a.price.localeCompare(b.price);
        case 'location':
          return a.location.localeCompare(b.location);
        case 'oldest':
          return new Date(a.submissionDate || 0) - new Date(b.submissionDate || 0);
        case 'newest':
        default:
          return new Date(b.submissionDate || 0) - new Date(a.submissionDate || 0);
      }
    });
    
    return filtered;
  }, [properties, filter, searchTerm, sortBy, walletState?.address, ownedTokenIds]);

  const formatAddress = (address) => {
    if (!address) return 'Unknown';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return 'status-available';
      case 'sold': return 'status-sold';
      case 'minted': return 'status-minted';
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      default: return 'status-default';
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="container">
          <div className="loading-container">
            <div className="spinner"></div>
            <h3>Loading Your Properties...</h3>
            <p>Fetching properties from blockchain and database...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <div className="container">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h3>Error Loading Properties</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container">
        {/* Header Section with Notifications */}
        <div className="properties-header">
          <div className="header-content">
            <h2 className="section-title">My Properties</h2>
            <p className="section-subtitle">Manage your tokenized real estate portfolio</p>
          </div>
          
          {/* Quick Action Buttons and Notifications */}
          <div className="header-actions">
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
                
                {showNotifications && (
                  <>
                    <div 
                      className="notification-overlay" 
                      onClick={() => setShowNotifications(false)}
                    ></div>
                    <div className="notification-dropdown">
                      <div className="dropdown-header">
                        <h3>🎉 Sale Notifications</h3>
                        <button 
                          className="close-button"
                          onClick={() => setShowNotifications(false)}
                        >
                          ✕
                        </button>
                      </div>
                      
                      <div className="notification-content">
                        {notifications.length === 0 ? (
                          <div className="empty-notifications">
                            <div className="empty-icon">📬</div>
                            <h4>No notifications yet</h4>
                            <p>You'll receive notifications when your properties are sold</p>
                          </div>
                        ) : (
                          <div className="notification-list">
                            {notifications.map(notification => (
                              <div 
                                key={notification.id} 
                                className={`notification-card ${notification.read ? 'read' : 'unread'}`}
                                onClick={() => !notification.read && markNotificationAsRead(notification.id)}
                              >
                                <div className="notification-main">
                                  <div className="success-icon">💰</div>
                                  <div className="notification-info">
                                    <h4>🎉 Property Sold!</h4>
                                    <p className="property-title">{notification.propertyName}</p>
                                    
                                    <div className="sale-details">
                                      <div className="buyer-info">
                                        <h5>👤 Buyer Information:</h5>
                                        <div className="detail-item">
                                          <span className="label">Address:</span>
                                          <span className="buyer-address">{formatAddress(notification.buyer)}</span>
                                        </div>
                                        <div className="detail-item">
                                          <span className="label">Full Address:</span>
                                          <span className="full-address" title={notification.buyer}>{notification.buyer}</span>
                                        </div>
                                      </div>
                                      
                                      <div className="sale-info">
                                        <h5>💰 Sale Information:</h5>
                                        <div className="detail-item">
                                          <span className="label">Sale Price:</span>
                                          <span className="price-value">{formatPrice(notification.price)}</span>
                                        </div>
                                        <div className="detail-item">
                                          <span className="label">Date & Time:</span>
                                          <span className="value">
                                            {notification.timestamp.toLocaleDateString()} at {notification.timestamp.toLocaleTimeString()}
                                          </span>
                                        </div>
                                        {notification.txHash && (
                                          <div className="detail-item">
                                            <span className="label">Transaction:</span>
                                            <span className="tx-hash" title={notification.txHash}>
                                              {notification.txHash.substring(0, 10)}...{notification.txHash.substring(notification.txHash.length - 8)}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="notification-footer">
                                      <small>💡 Your property has been successfully transferred to the new owner</small>
                                    </div>
                                  </div>
                                  {!notification.read && <div className="unread-dot"></div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            
            <div className="quick-actions">
              <button 
                className="btn btn-primary"
                onClick={handleViewInMarketplace}
              >
                🏪 View Marketplace
              </button>
              {walletState.isConnected && isVerified && (
                <button 
                  className="btn btn-secondary"
                  onClick={() => navigate('/mint')}
                >
                  ➕ Add Property
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Wallet Status */}
        {!walletState?.isConnected ? (
          <div className="wallet-connect-banner">
            <div className="banner-content">
              <h3>Connect Your Wallet</h3>
              <p>Connect your wallet to view your properties and receive sale notifications</p>
              <button onClick={connectWallet} className="btn btn-primary">
                Connect Wallet
              </button>
            </div>
          </div>
        ) : (
          <div className="wallet-info-card">
            <div className="wallet-details">
              <div className="wallet-address">
                <span className="label">Connected:</span>
                <span className="address">{formatAddress(walletState.address)}</span>
              </div>
              <div className="verification-status">
                {isVerified ? (
                  <span className="badge badge-success">✓ Verified</span>
                ) : (
                  <span className="badge badge-warning">⚠️ Unverified</span>
                )}
              </div>
              {notifications.filter(n => !n.read).length > 0 && (
                <div className="notification-info">
                  <span className="notification-count">{notifications.filter(n => !n.read).length} new sale notifications</span>
                </div>
              )}
              {!isVerified && (
                <button 
                  className="btn btn-outline btn-small"
                  onClick={() => navigate('/register')}
                >
                  Get Verified
                </button>
              )}
            </div>
          </div>
        )}

        {/* Statistics Bar */}
        <div className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🏠</div>
              <div className="stat-value">{properties.length}</div>
              <div className="stat-label">Total Properties</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-value">{properties.filter(p => p.status === 'Minted' || p.isFromBlockchain).length}</div>
              <div className="stat-label">Minted as NFTs</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💼</div>
              <div className="stat-value">{properties.filter(p => p.status === 'Available').length}</div>
              <div className="stat-label">Available</div>
            </div>
            {walletState?.address && (
              <>
                <div className="stat-card">
                  <div className="stat-icon">👤</div>
                  <div className="stat-value">{filteredAndSortedProperties.filter(p => 
                    (p.owner && p.owner.toLowerCase() === walletState.address.toLowerCase()) ||
                    (p.tokenId && ownedTokenIds.includes(p.tokenId))
                  ).length}</div>
                  <div className="stat-label">Your Properties</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🔔</div>
                  <div className="stat-value">{notifications.filter(n => !n.read).length}</div>
                  <div className="stat-label">New Notifications</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="controls-section">
          <div className="search-bar">
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Search properties by name, location, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <div className="search-icon">🔍</div>
            </div>
          </div>
          
          <div className="filter-controls">
            <div className="filter-group">
              <label>Filter by:</label>
              <div className="filter-tabs">
                <button 
                  className={`filter-tab ${filter === "all" ? "active" : ""}`}
                  onClick={() => setFilter("all")}
                >
                  All ({properties.length})
                </button>
                <button 
                  className={`filter-tab ${filter === "available" ? "active" : ""}`}
                  onClick={() => setFilter("available")}
                >
                  Available ({properties.filter(p => p.status === "Available").length})
                </button>
                <button 
                  className={`filter-tab ${filter === "minted" ? "active" : ""}`}
                  onClick={() => setFilter("minted")}
                >
                  Minted NFTs ({properties.filter(p => p.status === "Minted" || p.isFromBlockchain).length})
                </button>
                {walletState?.isConnected && (
                  <button 
                    className={`filter-tab ${filter === "owned" ? "active" : ""}`}
                    onClick={() => setFilter("owned")}
                  >
                    My Properties ({properties.filter(p => 
                      (p.owner && p.owner.toLowerCase() === walletState.address.toLowerCase()) ||
                      (p.tokenId && ownedTokenIds.includes(p.tokenId))
                    ).length})
                  </button>
                )}
              </div>
            </div>
            
            <div className="sort-group">
              <label>Sort by:</label>
              <select 
                className="sort-select"
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A-Z</option>
                <option value="location">Location A-Z</option>
                <option value="price">Price</option>
              </select>
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        {filteredAndSortedProperties.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏠</div>
            <h3>No Properties Found</h3>
            <p>
              {searchTerm ? (
                `No properties match your search "${searchTerm}"`
              ) : filter === "owned" ? (
                "You don't own any properties yet."
              ) : filter === "minted" ? (
                "No properties have been minted as NFTs yet."
              ) : (
                "No properties found with the selected filter."
              )}
            </p>
            
            <div className="empty-actions">
              {searchTerm && (
                <button 
                  className="btn btn-outline"
                  onClick={() => setSearchTerm("")}
                >
                  Clear Search
                </button>
              )}
              {filter === "owned" && walletState?.isConnected && isVerified && (
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate('/mint')}
                >
                  Add Your First Property
                </button>
              )}
              {!walletState?.isConnected && (
                <button 
                  className="btn btn-primary"
                  onClick={connectWallet}
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="properties-grid">
            {filteredAndSortedProperties.map((property) => {
              const isOwner = walletState?.address && (
                (property.owner && property.owner.toLowerCase() === walletState.address.toLowerCase()) ||
                (property.tokenId && ownedTokenIds.includes(property.tokenId))
              );
              
              return (
                <div key={property.id} className="property-card">
                  <div className="property-image">
                    <img 
                      src={property.image} 
                      alt={property.title}
                      onError={(e) => {
                        e.target.src = "/api/placeholder/400/250";
                      }}
                    />
                    <div className={`property-badge ${getStatusBadgeClass(property.status)}`}>
                      {property.status || 'Available'}
                    </div>
                    {isOwner && (
                      <div className="owner-badge">You own this</div>
                    )}
                    {property.tokenId && (
                      <div className="nft-badge">NFT #{property.tokenId}</div>
                    )}
                    {property.isMock && (
                      <div className="demo-badge">Demo</div>
                    )}
                    {property.isListed && (
                      <div className="listed-badge">Listed for Sale</div>
                    )}
                  </div>
                  
                  <div className="property-content">
                    <h3 className="property-title">{property.title}</h3>
                    <p className="property-description">{property.description}</p>
                    
                    <div className="property-details">
                      <div className="detail-row">
                        <span className="detail-label">Price:</span>
                        <span className="detail-value">{property.price || "Not listed"}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Location:</span>
                        <span className="detail-value">{property.location}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Type:</span>
                        <span className="detail-value">{property.propertyType}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Area:</span>
                        <span className="detail-value">{property.areaInSqFt} sq ft</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Owner:</span>
                        <span className="detail-value">{formatAddress(property.owner)}</span>
                      </div>
                      {property.tokenId && (
                        <div className="detail-row">
                          <span className="detail-label">Token ID:</span>
                          <span className="detail-value">#{property.tokenId}</span>
                        </div>
                      )}
                      {property.lastSalePrice && (
                        <div className="detail-row">
                          <span className="detail-label">Last Sale:</span>
                          <span className="detail-value">{property.lastSalePrice} ETH</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Property Attributes */}
                    {property.attributes && property.attributes.length > 0 && (
                      <div className="property-attributes">
                        {property.attributes.slice(0, 3).map((attr, index) => (
                          <span key={index} className="attribute-tag">
                            {attr.trait_type}: {attr.value}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="property-actions">
                      <Link to={`/property/${property.id}`} className="btn btn-outline">
                        View Details
                      </Link>
                      
                      {property.tokenId ? (
                        // Property is already minted
                        <button 
                          onClick={handleViewInMarketplace}
                          className="btn btn-primary"
                        >
                          View in Marketplace
                        </button>
                      ) : property.status === "Available" && !isOwner ? (
                        // Property available for minting
                        <button 
                          onClick={() => handleMintClick(property.id)} 
                          className="btn btn-success"
                        >
                          Mint as NFT
                        </button>
                      ) : property.status === "pending" || property.status === "submitted" ? (
                        // Property pending approval
                        <span className="status-text">Pending Approval</span>
                      ) : property.status === "approved" && isOwner ? (
                        // Property approved, ready to mint
                        <button 
                          onClick={() => navigate('/mint')} 
                          className="btn btn-success"
                        >
                          Ready to Mint
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Call to Action Section */}
        <div className="cta-section">
          <div className="cta-card">
            <h3>Ready to Get Started?</h3>
            <p>Join the future of real estate with blockchain-powered property ownership</p>
            <div className="cta-actions">
              {!walletState?.isConnected ? (
                <button onClick={connectWallet} className="btn btn-primary btn-large">
                  Connect Wallet to Begin
                </button>
              ) : !isVerified ? (
                <button onClick={() => navigate('/register')} className="btn btn-primary btn-large">
                  Complete KYC Verification
                </button>
              ) : (
                <div className="cta-buttons">
                  <button onClick={() => navigate('/mint')} className="btn btn-primary btn-large">
                    Add Your Property
                  </button>
                  <button onClick={handleViewInMarketplace} className="btn btn-secondary btn-large">
                    Explore Marketplace
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Properties;