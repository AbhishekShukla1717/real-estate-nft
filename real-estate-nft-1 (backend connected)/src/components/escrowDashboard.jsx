// components/EscrowDashboard.jsx
import React, { useState, useEffect, useContext } from 'react';
import { WalletContext } from '../context/WalletContext';
import contractService from '../services/ContractService';

const EscrowDashboard = () => {
  const walletContext = useContext(WalletContext);
  const walletState = walletContext?.walletState || {};
  
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [filter, setFilter] = useState('all'); // all, asSeller, asBuyer

  useEffect(() => {
    if (walletState.isConnected && walletState.address) {
      loadEscrowDeals();
    }
  }, [walletState.isConnected, walletState.address]);

  const loadEscrowDeals = async () => {
    try {
      setLoading(true);
      setError('');
      
      // For now, we'll simulate getting deals by checking known token IDs
      // In a real implementation, you'd need to track escrow deals in your backend
      // or by querying blockchain events
      
      const mockDeals = []; // We'll populate this by checking actual token IDs
      
      // You could extend this to:
      // 1. Query your backend for escrow deals involving this user
      // 2. Listen to EscrowCreated events from the contract
      // 3. Store escrow data in your database when deals are created
      
      setDeals(mockDeals);
    } catch (error) {
      console.error('Error loading escrow deals:', error);
      setError('Failed to load escrow deals: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      0: 'Pending',     // PENDING
      1: 'Funded',      // FUNDED  
      2: 'Completed',   // COMPLETED
      3: 'Cancelled',   // CANCELLED
      4: 'Refunded'     // REFUNDED
    };
    return statusMap[status] || 'Unknown';
  };

  const getStatusColor = (status) => {
    const colorMap = {
      0: 'bg-yellow-100 text-yellow-800',
      1: 'bg-blue-100 text-blue-800',
      2: 'bg-green-100 text-green-800',
      3: 'bg-red-100 text-red-800',
      4: 'bg-purple-100 text-purple-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const handleDepositFunds = async (tokenId, totalCost) => {
    try {
      setActionLoading(prev => ({ ...prev, [`deposit-${tokenId}`]: true }));
      
      const result = await contractService.depositFundsToEscrow(tokenId, totalCost);
      console.log('Funds deposited:', result);
      
      // Reload deals
      await loadEscrowDeals();
      
    } catch (error) {
      console.error('Error depositing funds:', error);
      alert('Failed to deposit funds: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [`deposit-${tokenId}`]: false }));
    }
  };

  const handleCompleteDeal = async (tokenId) => {
    try {
      setActionLoading(prev => ({ ...prev, [`complete-${tokenId}`]: true }));
      
      const result = await contractService.completeEscrowDeal(tokenId);
      console.log('Deal completed:', result);
      
      // Reload deals
      await loadEscrowDeals();
      
    } catch (error) {
      console.error('Error completing deal:', error);
      alert('Failed to complete deal: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [`complete-${tokenId}`]: false }));
    }
  };

  const handleCancelDeal = async (tokenId) => {
    if (!window.confirm('Are you sure you want to cancel this escrow deal?')) {
      return;
    }
    
    try {
      setActionLoading(prev => ({ ...prev, [`cancel-${tokenId}`]: true }));
      
      const result = await contractService.cancelEscrowDeal(tokenId);
      console.log('Deal cancelled:', result);
      
      // Reload deals
      await loadEscrowDeals();
      
    } catch (error) {
      console.error('Error cancelling deal:', error);
      alert('Failed to cancel deal: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [`cancel-${tokenId}`]: false }));
    }
  };

  const handleRefundBuyer = async (tokenId) => {
    if (!window.confirm('Are you sure you want to refund the buyer? This will return all deposited funds to them.')) {
      return;
    }
    
    try {
      setActionLoading(prev => ({ ...prev, [`refund-${tokenId}`]: true }));
      
      const result = await contractService.refundEscrowBuyer(tokenId);
      console.log('Buyer refunded:', result);
      
      // Reload deals
      await loadEscrowDeals();
      
    } catch (error) {
      console.error('Error refunding buyer:', error);
      alert('Failed to refund buyer: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [`refund-${tokenId}`]: false }));
    }
  };

  const canDepositFunds = (deal) => {
    return deal.buyer.toLowerCase() === walletState.address?.toLowerCase() && 
           deal.status === 0 && // PENDING
           !deal.fundsDeposited;
  };

  const canCompleteDeal = (deal) => {
    return (deal.seller.toLowerCase() === walletState.address?.toLowerCase() || 
            deal.buyer.toLowerCase() === walletState.address?.toLowerCase()) &&
           deal.status === 1; // FUNDED
  };

  const canCancelDeal = (deal) => {
    return (deal.seller.toLowerCase() === walletState.address?.toLowerCase() || 
            deal.buyer.toLowerCase() === walletState.address?.toLowerCase()) &&
           deal.status === 0; // PENDING
  };

  const canRefund = (deal) => {
    return deal.seller.toLowerCase() === walletState.address?.toLowerCase() &&
           deal.status === 1; // FUNDED
  };

  const getUserRole = (deal) => {
    if (!walletState.address || !deal) return null;
    
    if (deal.seller.toLowerCase() === walletState.address.toLowerCase()) return 'seller';
    if (deal.buyer.toLowerCase() === walletState.address.toLowerCase()) return 'buyer';
    return null;
  };

  const filteredDeals = deals.filter(deal => {
    if (filter === 'asSeller') {
      return deal.seller.toLowerCase() === walletState.address?.toLowerCase();
    } else if (filter === 'asBuyer') {
      return deal.buyer.toLowerCase() === walletState.address?.toLowerCase();
    }
    return true; // 'all'
  });

  if (!walletState.isConnected) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔐</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
          <p className="text-gray-500 mb-4">
            Connect your wallet to view and manage your escrow deals
          </p>
          <button 
            onClick={() => walletContext?.connectWallet?.()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading escrow deals...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">🔐 Escrow Dashboard</h1>
          <p className="text-gray-600">Manage your secure property transactions</p>
        </div>
        <button 
          onClick={loadEscrowDeals}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-blue-600">{deals.length}</div>
          <div className="text-sm text-gray-600">Total Deals</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-green-600">
            {deals.filter(d => d.status === 2).length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-yellow-600">
            {deals.filter(d => d.status === 1).length}
          </div>
          <div className="text-sm text-gray-600">Active (Funded)</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-gray-600">
            {deals.filter(d => d.status === 0).length}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setFilter('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Deals ({deals.length})
            </button>
            <button
              onClick={() => setFilter('asSeller')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === 'asSeller'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              As Seller ({deals.filter(d => d.seller.toLowerCase() === walletState.address?.toLowerCase()).length})
            </button>
            <button
              onClick={() => setFilter('asBuyer')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === 'asBuyer'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              As Buyer ({deals.filter(d => d.buyer.toLowerCase() === walletState.address?.toLowerCase()).length})
            </button>
          </nav>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Deals List */}
      {filteredDeals.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Escrow Deals</h3>
          <p className="text-gray-500 mb-4">
            {filter === 'all' 
              ? "You don't have any escrow deals yet."
              : filter === 'asSeller'
              ? "You haven't created any escrow deals as a seller."
              : "You don't have any escrow deals as a buyer."
            }
          </p>
          <button 
            onClick={() => window.location.href = '/marketplace'}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Explore Marketplace
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredDeals.map((deal) => {
            const userRole = getUserRole(deal);
            const totalCost = parseFloat(deal.price) + parseFloat(deal.fee);
            
            return (
              <div key={deal.tokenId} className="bg-white rounded-lg shadow-sm border p-6">
                {/* Deal Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Property #{deal.tokenId}</h3>
                    <p className="text-gray-600">
                      Created: {new Date(deal.createdAt).toLocaleDateString()}
                    </p>
                    {userRole && (
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                        userRole === 'seller' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        You are the {userRole}
                      </span>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(deal.status)}`}>
                    {getStatusText(deal.status)}
                  </span>
                </div>

                {/* Deal Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Seller</p>
                    <p className="font-mono text-sm">{deal.seller.slice(0, 8)}...</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Buyer</p>
                    <p className="font-mono text-sm">{deal.buyer.slice(0, 8)}...</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Price</p>
                    <p className="font-semibold">{deal.price} ETH</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fee</p>
                    <p className="text-sm">{deal.fee} ETH</p>
                  </div>
                </div>

                {/* Funds Status */}
                {deal.status === 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-800 text-sm">
                      ⏳ Waiting for buyer to deposit {totalCost.toFixed(4)} ETH
                    </p>
                  </div>
                )}

                {deal.fundsDeposited && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-green-800 text-sm">
                      ✅ Funds deposited ({totalCost.toFixed(4)} ETH secured in escrow)
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {canDepositFunds(deal) && (
                    <button
                      onClick={() => handleDepositFunds(deal.tokenId, totalCost)}
                      disabled={actionLoading[`deposit-${deal.tokenId}`]}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {actionLoading[`deposit-${deal.tokenId}`] ? 'Depositing...' : `Deposit ${totalCost.toFixed(4)} ETH`}
                    </button>
                  )}

                  {canCompleteDeal(deal) && (
                    <button
                      onClick={() => handleCompleteDeal(deal.tokenId)}
                      disabled={actionLoading[`complete-${deal.tokenId}`]}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading[`complete-${deal.tokenId}`] ? 'Completing...' : 'Complete Deal'}
                    </button>
                  )}

                  {canCancelDeal(deal) && (
                    <button
                      onClick={() => handleCancelDeal(deal.tokenId)}
                      disabled={actionLoading[`cancel-${deal.tokenId}`]}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      {actionLoading[`cancel-${deal.tokenId}`] ? 'Cancelling...' : 'Cancel Deal'}
                    </button>
                  )}

                  {canRefund(deal) && (
                    <button
                      onClick={() => handleRefundBuyer(deal.tokenId)}
                      disabled={actionLoading[`refund-${deal.tokenId}`]}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                    >
                      {actionLoading[`refund-${deal.tokenId}`] ? 'Refunding...' : 'Refund Buyer'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default escrowDashboard;