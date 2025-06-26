import React, { useState, useEffect, useContext } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { adminApi, userApi } from '../services/apiService';
import { WalletContext } from '../context/WalletContext'; // FIXED: Direct wallet context import
import { EscrowContext } from '../context/EscrowContext'; // FIXED: Separate escrow context import

const Navbar = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [escrowNotifications, setEscrowNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // FIXED: Use separate contexts properly
  const { walletState, connectWallet, disconnectWallet } = useContext(WalletContext);
  const { getUserEscrows, escrowStats } = useContext(EscrowContext);

  // Check verification status
  const checkVerificationStatus = async (address) => {
    if (!address) {
      setIsVerified(false);
      return;
    }

    try {
      const response = await userApi.checkUserStatus(address);
      if (response.success && response.data) {
        const verified = response.data.status === 'verified';
        setIsVerified(verified);
        
        // Store verification status in localStorage for persistence
        if (verified) {
          localStorage.setItem('userVerificationStatus', JSON.stringify({
            address: address,
            status: 'verified',
            timestamp: Date.now()
          }));
        } else {
          localStorage.removeItem('userVerificationStatus');
        }
      } else {
        setIsVerified(false);
        localStorage.removeItem('userVerificationStatus');
      }
    } catch (error) {
      console.error('Error checking verification:', error);
      setIsVerified(false);
    }
  };

  // Load user's escrow notifications
  const loadEscrowNotifications = async (address) => {
    if (!address || !isVerified) return;

    try {
      const userEscrows = await getUserEscrows(address);
      
      // Filter for notifications that need user attention
      const notifications = userEscrows.filter(escrow => {
        const isParticipant = escrow.seller.toLowerCase() === address.toLowerCase() || 
                            escrow.buyer.toLowerCase() === address.toLowerCase();
        
        if (!isParticipant) return false;

        // Buyer notifications
        if (escrow.buyer.toLowerCase() === address.toLowerCase()) {
          return escrow.status === 'PENDING' && !escrow.fundsDeposited;
        }
        
        // Seller notifications
        if (escrow.seller.toLowerCase() === address.toLowerCase()) {
          return escrow.status === 'FUNDED' || escrow.status === 'PENDING';
        }
        
        return false;
      });

      setEscrowNotifications(notifications);
    } catch (error) {
      console.error('Error loading escrow notifications:', error);
    }
  };

  useEffect(() => {
    // Check admin status
    setIsAdmin(adminApi.isLoggedIn());
    
    // Check wallet connection and verification
    if (walletState?.address) {
      checkVerificationStatus(walletState.address);
    } else {
      setIsVerified(false);
      setEscrowNotifications([]);
    }
    
    // Close mobile menu on route change
    setMobileMenuOpen(false);
    
  }, [location, walletState?.address]);

  // Load escrow notifications when wallet connects and user is verified
  useEffect(() => {
    if (walletState?.address && isVerified) {
      loadEscrowNotifications(walletState.address);
      
      // Set up periodic check for escrow updates
      const intervalId = setInterval(() => {
        loadEscrowNotifications(walletState.address);
      }, 30000); // Check every 30 seconds
      
      return () => clearInterval(intervalId);
    }
  }, [walletState?.address, isVerified]);

  // Listen for custom verification events
  useEffect(() => {
    const handleVerificationUpdate = (event) => {
      if (event.detail && event.detail.walletAddress === walletState?.address) {
        setIsVerified(event.detail.verified);
        if (event.detail.verified) {
          // Force a re-check to ensure UI is updated
          checkVerificationStatus(walletState.address);
        }
      }
    };

    window.addEventListener('userVerificationUpdated', handleVerificationUpdate);
    
    return () => {
      window.removeEventListener('userVerificationUpdated', handleVerificationUpdate);
    };
  }, [walletState?.address]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      adminApi.logout();
      setIsAdmin(false);
      navigate('/');
    }
  };

  const handleConnectWallet = async () => {
    try {
      const success = await connectWallet();
      if (success && walletState?.address) {
        await checkVerificationStatus(walletState.address);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const handleDisconnectWallet = () => {
    if (window.confirm('Disconnect wallet?')) {
      disconnectWallet();
      setIsVerified(false);
      setEscrowNotifications([]);
    }
  };

  const formatWalletAddress = (address) => {
    if (!address) return '';
    return address.substring(0, 6) + '...' + address.substring(address.length - 4);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  // FIXED: Handle My Escrows navigation
  const handleMyEscrowsClick = (e) => {
    if (!walletState?.isConnected) {
      e.preventDefault();
      alert('Please connect your wallet first to view your escrows.');
      return;
    }
    
    if (!isVerified) {
      e.preventDefault();
      if (window.confirm('You need to be verified to access escrow features. Would you like to complete KYC verification now?')) {
        navigate('/register');
      }
      return;
    }
    
    // Navigation will proceed normally to /my-escrows
    setMobileMenuOpen(false);
  };

  // Get verification badge
  const getVerificationBadge = () => {
    if (!walletState?.isConnected) return null;
    
    if (isVerified) {
      return <span className="verification-badge verified">✅ Verified</span>;
    } else {
      return <span className="verification-badge unverified">⚠️ Unverified</span>;
    }
  };

  // Get notification badge for escrow
  const getNotificationBadge = () => {
    if (!isVerified || escrowNotifications.length === 0) return null;
    
    return (
      <div className="notification-bell" onClick={toggleNotifications}>
        <span className="bell-icon">🔔</span>
        {escrowNotifications.length > 0 && (
          <span className="notification-count">{escrowNotifications.length}</span>
        )}
      </div>
    );
  };

  // Render notification dropdown
  const renderNotificationDropdown = () => {
    if (!showNotifications) return null;

    return (
      <div className="notification-overlay" onClick={() => setShowNotifications(false)}>
        <div className="notification-dropdown" onClick={e => e.stopPropagation()}>
          <div className="dropdown-header">
            <h3>Escrow Notifications</h3>
            <button 
              className="close-button" 
              onClick={() => setShowNotifications(false)}
            >
              ×
            </button>
          </div>
          
          <div className="notification-content">
            {escrowNotifications.length === 0 ? (
              <div className="empty-notifications">
                <div className="empty-icon">📭</div>
                <h4>No Active Escrows</h4>
                <p>You don't have any pending escrow transactions</p>
              </div>
            ) : (
              <div className="notification-list">
                {escrowNotifications.map((escrow, index) => (
                  <div key={index} className="notification-card">
                    <div className="notification-main">
                      <div className="notification-info">
                        <h4>
                          {escrow.buyer.toLowerCase() === walletState?.address?.toLowerCase() 
                            ? '💳 Payment Required' 
                            : '⏳ Awaiting Buyer'
                          }
                        </h4>
                        <p className="property-title">Property #{escrow.tokenId}</p>
                        
                        <div className="escrow-details">
                          <div className="detail-item">
                            <span className="label">Price:</span>
                            <span className="value price-value">
                              {escrow.price ? `${(parseInt(escrow.price) / 1e18).toFixed(4)} ETH` : 'N/A'}
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="label">Status:</span>
                            <span className="value">{escrow.status}</span>
                          </div>
                          <div className="detail-item">
                            <span className="label">
                              {escrow.buyer.toLowerCase() === walletState?.address?.toLowerCase() ? 'Seller:' : 'Buyer:'}
                            </span>
                            <span className="value full-address">
                              {escrow.buyer.toLowerCase() === walletState?.address?.toLowerCase() 
                                ? formatWalletAddress(escrow.seller)
                                : formatWalletAddress(escrow.buyer)
                              }
                            </span>
                          </div>
                        </div>
                        
                        <div className="notification-actions">
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                              setShowNotifications(false);
                              navigate(`/escrow/${escrow.tokenId}`);
                            }}
                          >
                            {escrow.buyer.toLowerCase() === walletState?.address?.toLowerCase() 
                              ? 'Fund Escrow' 
                              : 'View Details'
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {escrowNotifications.length > 0 && (
            <div className="notification-footer">
              <Link 
                to="/my-escrows" 
                className="btn btn-sm btn-outline"
                onClick={() => setShowNotifications(false)}
              >
                View All Escrows
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <header className="site-header">
      <nav className="navbar">
        <div className="container nav-container">
          <div className="nav-logo">
            <Link to="/">
              <span className="logo-icon">🏢</span>
              <span className="logo-text">RealNFT</span>
            </Link>
          </div>
          
          <button 
            className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`} 
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation menu"
          >
            <span className="menu-bar"></span>
            <span className="menu-bar"></span>
            <span className="menu-bar"></span>
          </button>
          
          <div className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
            <ul className="nav-links">
              <li>
                <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink to="/properties" className={({ isActive }) => isActive ? 'active' : ''}>
                  My Properties
                </NavLink>
              </li>
              <li>
                <NavLink to="/marketplace" className={({ isActive }) => isActive ? 'active' : ''}>
                  Marketplace
                </NavLink>
              </li>
              
              {/* FIXED: Always show My Escrows if wallet is connected, with proper click handling */}
              {walletState?.isConnected && (
                <li>
                  <NavLink 
                    to="/my-escrows" 
                    className={({ isActive }) => `escrow-nav-link ${isActive ? 'active' : ''} ${!isVerified ? 'disabled' : ''}`}
                    onClick={handleMyEscrowsClick}
                  >
                    <span className="nav-icon">⚖️</span>
                    My Escrows
                    {escrowNotifications.length > 0 && (
                      <span className="nav-badge">{escrowNotifications.length}</span>
                    )}
                  </NavLink>
                </li>
              )}
              
              {walletState?.isConnected && (
                <>
                  {isVerified ? (
                    <li>
                      <NavLink to="/mint" className={({ isActive }) => isActive ? 'active' : ''}>
                        Mint Property
                      </NavLink>
                    </li>
                  ) : (
                    <li>
                      <NavLink to="/register" className={({ isActive }) => isActive ? 'active' : ''}>
                        Get Verified
                      </NavLink>
                    </li>
                  )}
                </>
              )}
              
              {isAdmin && (
                <li>
                  <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
                    Admin Panel
                  </NavLink>
                </li>
              )}
              
              {!isAdmin && (
                <li>
                  <NavLink to="/admin-login" className={({ isActive }) => isActive ? 'active' : ''}>
                    Admin Login
                  </NavLink>
                </li>
              )}
            </ul>
            
            <div className="nav-actions">
              {walletState?.isConnected ? (
                <div className="wallet-info">
                  <div className="wallet-details">
                    <span className="wallet-address">{formatWalletAddress(walletState.address)}</span>
                    {getVerificationBadge()}
                    {getNotificationBadge()}
                  </div>
                  <button onClick={handleDisconnectWallet} className="btn-small btn-outline">
                    Disconnect
                  </button>
                </div>
              ) : (
                <button onClick={handleConnectWallet} className="btn btn-connect-wallet">
                  Connect Wallet
                </button>
              )}
              
              {isAdmin && (
                <button onClick={handleLogout} className="btn-logout">
                  Admin Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {/* Notification bar for unverified users */}
      {walletState?.isConnected && !isVerified && !isAdmin && (
        <div className="notification-bar">
          <div className="container">
            <p>
              Complete KYC verification to unlock escrow trading and all platform features 
              <Link to="/register" className="notification-action">Get Verified Now</Link>
            </p>
          </div>
        </div>
      )}
      
      {/* Render notification dropdown */}
      {renderNotificationDropdown()}
    </header>
  );
};

export default Navbar;