// components/MyEscrows.js - Complete Implementation
import React, { useState, useEffect, useContext } from 'react';
import { WalletContext } from '../context/WalletContext';
import { EscrowContext } from '../context/EscrowContext';
import { ethers } from 'ethers';

const MyEscrows = () => {
  const { walletState } = useContext(WalletContext);
  const { 
    userEscrows, 
    escrowStats, 
    loading, 
    error,
    getDealDetails,
    depositFunds,
    completeDeal,
    cancelEscrow,
    refundBuyer,
    calculateTotalCost,
    ESCROW_STATUS 
  } = useContext(EscrowContext);

  const [activeTab, setActiveTab] = useState('all');
  const [escrowDetails, setEscrowDetails] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  // Sample escrow data for demonstration (replace with real data)
  const [sampleEscrows] = useState([
    {
      tokenId: '1',
      property: {
        title: 'Luxury Villa in Beverly Hills',
        image: '/api/placeholder/300/200',
        location: 'Beverly Hills, CA'
      },
      seller: '0x1234567890123456789012345678901234567890',
      buyer: '0x0987654321098765432109876543210987654321',
      price: '2.5',
      fee: '0.0625',
      total: '2.5625',
      status: 'PENDING',
      fundsDeposited: false,
      createdAt: Date.now() - 86400000, // 1 day ago
      role: 'seller' // or 'buyer'
    },
    {
      tokenId: '2',
      property: {
        title: 'Modern Apartment in Manhattan',
        image: '/api/placeholder/300/200',
        location: 'Manhattan, NY'
      },
      seller: '0x0987654321098765432109876543210987654321',
      buyer: walletState.address,
      price: '1.8',
      fee: '0.045',
      total: '1.845',
      status: 'FUNDED',
      fundsDeposited: true,
      createdAt: Date.now() - 172800000, // 2 days ago
      role: 'buyer'
    }
  ]);

  // Filter escrows based on active tab
  const filteredEscrows = sampleEscrows.filter(escrow => {
    switch (activeTab) {
      case 'buyer':
        return escrow.role === 'buyer';
      case 'seller':
        return escrow.role === 'seller';
      case 'active':
        return ['PENDING', 'FUNDED'].includes(escrow.status);
      case 'completed':
        return ['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(escrow.status);
      default:
        return true;
    }
  });

  // Handle escrow actions
  const handleDepositFunds = async (tokenId, totalAmount) => {
    setActionLoading(prev => ({ ...prev, [tokenId]: 'depositing' }));
    try {
      const totalWei = ethers.parseEther(totalAmount);
      await depositFunds(tokenId, totalWei);
    } catch (error) {
      console.error('Error depositing funds:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, [tokenId]: null }));
    }
  };

  const handleCompleteDeal = async (tokenId) => {
    setActionLoading(prev => ({ ...prev, [tokenId]: 'completing' }));
    try {
      await completeDeal(tokenId);
    } catch (error) {
      console.error('Error completing deal:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, [tokenId]: null }));
    }
  };

  const handleCancelEscrow = async (tokenId) => {
    setActionLoading(prev => ({ ...prev, [tokenId]: 'cancelling' }));
    try {
      await cancelEscrow(tokenId);
    } catch (error) {
      console.error('Error cancelling escrow:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, [tokenId]: null }));
    }
  };

  const handleRefundBuyer = async (tokenId) => {
    setActionLoading(prev => ({ ...prev, [tokenId]: 'refunding' }));
    try {
      await refundBuyer(tokenId);
    } catch (error) {
      console.error('Error refunding buyer:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, [tokenId]: null }));
    }
  };

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return '#ff9800';
      case 'FUNDED':
        return '#2196f3';
      case 'COMPLETED':
        return '#4caf50';
      case 'CANCELLED':
        return '#f44336';
      case 'REFUNDED':
        return '#9c27b0';
      default:
        return '#757575';
    }
  };

  // Check if wallet is connected
  if (!walletState?.isConnected) {
    return (
      <div className="page-content">
        <div className="container">
          <div className="auth-card">
            <div className="card-header">
              <h2>My Escrow Transactions</h2>
              <p>Please connect your wallet to view your escrow transactions</p>
            </div>
            <div className="connect-wallet-section">
              <div className="wallet-prompt">
                <div className="wallet-icon">🔐</div>
                <h3>Wallet Connection Required</h3>
                <p>Connect your wallet to view and manage your escrow transactions.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container">
        <div className="page-header">
          <h1>My Escrow Transactions</h1>
          <p>Manage all your property escrow transactions in one place</p>
        </div>

        {/* Escrow Stats */}
        <div className="escrow-stats">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">{filteredEscrows.length}</div>
                <div className="stat-label">Total Escrows</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-value">
                  {filteredEscrows.filter(e => ['PENDING', 'FUNDED'].includes(e.status)).length}
                </div>
                <div className="stat-label">Active Deals</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🛒</div>
              <div className="stat-content">
                <div className="stat-value">
                  {filteredEscrows.filter(e => e.role === 'buyer').length}
                </div>
                <div className="stat-label">As Buyer</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏠</div>
              <div className="stat-content">
                <div className="stat-value">
                  {filteredEscrows.filter(e => e.role === 'seller').length}
                </div>
                <div className="stat-label">As Seller</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="escrows-filter">
          <button 
            className={`filter-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Escrows
            <span className="filter-count">{sampleEscrows.length}</span>
          </button>
          <button 
            className={`filter-tab ${activeTab === 'buyer' ? 'active' : ''}`}
            onClick={() => setActiveTab('buyer')}
          >
            As Buyer
            <span className="filter-count">{sampleEscrows.filter(e => e.role === 'buyer').length}</span>
          </button>
          <button 
            className={`filter-tab ${activeTab === 'seller' ? 'active' : ''}`}
            onClick={() => setActiveTab('seller')}
          >
            As Seller
            <span className="filter-count">{sampleEscrows.filter(e => e.role === 'seller').length}</span>
          </button>
          <button 
            className={`filter-tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active
            <span className="filter-count">
              {sampleEscrows.filter(e => ['PENDING', 'FUNDED'].includes(e.status)).length}
            </span>
          </button>
          <button 
            className={`filter-tab ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed
            <span className="filter-count">
              {sampleEscrows.filter(e => ['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(e.status)).length}
            </span>
          </button>
        </div>

        {/* Escrow Cards */}
        <div className="escrows-grid">
          {filteredEscrows.length === 0 ? (
            <div className="no-escrows">
              <div className="no-escrows-icon">📭</div>
              <h3>No Escrow Transactions</h3>
              <p>You don't have any escrow transactions matching the selected filter.</p>
              <div className="no-escrows-actions">
                <a href="/marketplace" className="btn btn-primary">
                  Browse Marketplace
                </a>
                <a href="/properties" className="btn btn-secondary">
                  My Properties
                </a>
              </div>
            </div>
          ) : (
            filteredEscrows.map(escrow => (
              <div key={escrow.tokenId} className="escrow-card">
                <div className="escrow-header">
                  <div className="property-info">
                    <img 
                      src={escrow.property.image} 
                      alt={escrow.property.title}
                      className="property-image"
                    />
                    <div className="property-details">
                      <h3 className="property-title">{escrow.property.title}</h3>
                      <p className="property-location">📍 {escrow.property.location}</p>
                      <p className="token-id">Token #{escrow.tokenId}</p>
                    </div>
                  </div>
                  <div 
                    className="escrow-status"
                    style={{ color: getStatusColor(escrow.status) }}
                  >
                    <span className="status-indicator">●</span>
                    {escrow.status}
                  </div>
                </div>

                <div className="escrow-body">
                  <div className="escrow-details">
                    <div className="detail-row">
                      <span className="detail-label">Your Role:</span>
                      <span className="detail-value role-badge">
                        {escrow.role === 'buyer' ? '🛒 Buyer' : '🏠 Seller'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Price:</span>
                      <span className="detail-value">{escrow.price} ETH</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Platform Fee:</span>
                      <span className="detail-value">{escrow.fee} ETH</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Total Cost:</span>
                      <span className="detail-value total-cost">{escrow.total} ETH</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Counterparty:</span>
                      <span className="detail-value">
                        {formatAddress(escrow.role === 'buyer' ? escrow.seller : escrow.buyer)}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Created:</span>
                      <span className="detail-value">
                        {new Date(escrow.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="escrow-actions">
                    {escrow.role === 'buyer' && escrow.status === 'PENDING' && !escrow.fundsDeposited && (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleDepositFunds(escrow.tokenId, escrow.total)}
                        disabled={actionLoading[escrow.tokenId] === 'depositing'}
                      >
                        {actionLoading[escrow.tokenId] === 'depositing' ? 'Depositing...' : 'Deposit Funds'}
                      </button>
                    )}

                    {escrow.status === 'FUNDED' && (
                      <button
                        className="btn btn-success"
                        onClick={() => handleCompleteDeal(escrow.tokenId)}
                        disabled={actionLoading[escrow.tokenId] === 'completing'}
                      >
                        {actionLoading[escrow.tokenId] === 'completing' ? 'Completing...' : 'Complete Deal'}
                      </button>
                    )}

                    {escrow.status === 'PENDING' && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleCancelEscrow(escrow.tokenId)}
                        disabled={actionLoading[escrow.tokenId] === 'cancelling'}
                      >
                        {actionLoading[escrow.tokenId] === 'cancelling' ? 'Cancelling...' : 'Cancel Escrow'}
                      </button>
                    )}

                    {escrow.role === 'seller' && escrow.status === 'FUNDED' && (
                      <button
                        className="btn btn-warning"
                        onClick={() => handleRefundBuyer(escrow.tokenId)}
                        disabled={actionLoading[escrow.tokenId] === 'refunding'}
                      >
                        {actionLoading[escrow.tokenId] === 'refunding' ? 'Processing...' : 'Refund Buyer'}
                      </button>
                    )}

                    <a 
                      href={`/escrow/${escrow.tokenId}`} 
                      className="btn btn-outline"
                    >
                      View Details
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading escrow transactions...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>Error Loading Escrows</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEscrows;