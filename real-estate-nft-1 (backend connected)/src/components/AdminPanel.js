import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { userApi, adminApi, propertyApi } from "../services/apiService";
import kycContractService from "../services/KYCContractService";
import DocumentViewer from "./DocumentViewer";
import walletService from "../utils/WalletService";

const AdminPanel = () => {
  const navigate = useNavigate();
  
  // User Management State
  const [pendingUsers, setPendingUsers] = useState([]);
  const [verifiedUsers, setVerifiedUsers] = useState([]);
  const [rejectedUsers, setRejectedUsers] = useState([]);
  
  // Property Management State
  const [pendingProperties, setPendingProperties] = useState([]);
  const [approvedProperties, setApprovedProperties] = useState([]);
  const [rejectedProperties, setRejectedProperties] = useState([]);
  
  // Admin Management State
  const [adminList, setAdminList] = useState([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [newAdminAddress, setNewAdminAddress] = useState('');
  
  // General State
  const [stats, setStats] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    pendingUsers: 0,
    mintedProperties: 0,
    pendingProperties: 0,
    totalAdmins: 0
  });
  
  const [activeTab, setActiveTab] = useState('users');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walletState, setWalletState] = useState({ isConnected: false, address: '' });
  
  // Modal States
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDocuments, setUserDocuments] = useState(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => {
    // Check if admin is logged in
    if (!adminApi.isLoggedIn()) {
      navigate("/admin-login");
      return;
    }

    initializeAdmin();
  }, [navigate]);

  const initializeAdmin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Initialize wallet connection
      await walletService.checkConnection();
      const state = walletService.getWalletState();
      setWalletState(state);
      
      if (state.isConnected) {
        // Initialize KYC contract service
        await kycContractService.init();
        
        // Check if current wallet is super admin
        const superAdminResult = await kycContractService.checkIsAdmin(state.address);
        setIsSuperAdmin(superAdminResult.isAdmin);
        setCurrentAdmin(state.address);
        
        console.log('Super Admin Status:', superAdminResult.isAdmin);
      }
      
      // Load all data
      await loadAllData();
      
    } catch (error) {
      console.error('💥 Error initializing admin:', error);
      setError(error.message || 'Failed to initialize admin panel');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllData = async () => {
    try {
      console.log('🔄 Loading admin panel data...');
      
      // Load users data
      await loadUsersData();
      
      // Load properties data
      await loadPropertiesData();
      
      // Load platform stats
      await loadStatsData();
      
    } catch (error) {
      console.error('💥 Error loading data:', error);
      throw error;
    }
  };

  const loadUsersData = async () => {
    try {
      const usersResponse = await userApi.getAllUsers();
      console.log('📊 Users Response:', usersResponse);
      
      if (usersResponse.success) {
        const { pendingUsers: newPending, verifiedUsers: newVerified, rejectedUsers: newRejected } = usersResponse.data || {};
        
        setPendingUsers(newPending || []);
        setVerifiedUsers(newVerified || []);
        setRejectedUsers(newRejected || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadPropertiesData = async () => {
    try {
      // Get all properties
      const allPropertiesResponse = await propertyApi.getAllProperties();
      
      if (allPropertiesResponse.success) {
        const properties = allPropertiesResponse.data || [];
        
        // Separate properties by status
        const pending = properties.filter(p => p.status === 'pending');
        const approved = properties.filter(p => p.status === 'approved');
        const rejected = properties.filter(p => p.status === 'rejected');
        const minted = properties.filter(p => p.status === 'minted');
        
        setPendingProperties(pending);
        setApprovedProperties([...approved, ...minted]);
        setRejectedProperties(rejected);
        
        console.log('📊 Properties loaded:', {
          pending: pending.length,
          approved: approved.length + minted.length,
          rejected: rejected.length
        });
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  const loadStatsData = async () => {
    try {
      const statsResponse = await adminApi.getStats();
      if (statsResponse.success) {
        setStats(prevStats => ({
          ...prevStats,
          ...statsResponse.stats,
          pendingUsers: pendingUsers.length,
          verifiedUsers: verifiedUsers.length,
          totalUsers: pendingUsers.length + verifiedUsers.length + rejectedUsers.length,
          pendingProperties: pendingProperties.length
        }));
      }
    } catch (statsError) {
      console.warn('Stats API error:', statsError);
    }
  };

  // User Management Functions
  const handleVerifyUser = async (user) => {
    try {
      console.log('🔄 Verifying user:', user);
      
      const userId = user._id || user.id;
      if (!userId) {
        throw new Error('User ID is missing');
      }
      
      const response = await userApi.verifyUser(userId, 'Verified by admin');
      
      if (response.success) {
        // Also verify on blockchain if wallet is connected
        if (walletState.isConnected && isSuperAdmin) {
          try {
            const blockchainResult = await kycContractService.verifyUserOnChain(user.walletAddress);
            if (blockchainResult.success) {
              console.log('✅ User verified on blockchain:', blockchainResult.transactionHash);
            }
          } catch (blockchainError) {
            console.warn('Blockchain verification failed:', blockchainError);
          }
        }
        
        // Update local state
        setPendingUsers(pendingUsers.filter(u => (u._id || u.id) !== userId));
        setVerifiedUsers([...verifiedUsers, { ...user, status: 'verified' }]);
        
        alert(`✅ ${user.walletAddress} has been verified successfully!`);
        await loadAllData();
      } else {
        throw new Error(response.message || 'Verification failed');
      }
    } catch (error) {
      console.error('❌ Error verifying user:', error);
      alert(`❌ Failed to verify ${user.walletAddress}.\nError: ${error.message}`);
    }
  };

  const handleRejectUser = async (user) => {
    try {
      const reason = prompt(`Please provide a reason for rejecting ${user.walletAddress}:`, '');
      if (reason === null) return;
      
      const userId = user._id || user.id;
      const response = await userApi.rejectUser(userId, reason);
      
      if (response.success) {
        setPendingUsers(pendingUsers.filter(u => (u._id || u.id) !== userId));
        setRejectedUsers([...rejectedUsers, { ...user, status: 'rejected', rejectionReason: reason }]);
        
        alert(`❌ ${user.walletAddress} has been rejected.`);
        await loadAllData();
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert(`❌ Failed to reject ${user.walletAddress}.\nError: ${error.message}`);
    }
  };

  // Property Management Functions
  const handleApproveProperty = async (property) => {
    try {
      console.log('🔄 Approving property:', property);
      
      const approvalNotes = prompt(`Add approval notes for "${property.name}":`, 'Property meets all requirements and is approved for minting.');
      if (approvalNotes === null) return;
      
      const response = await propertyApi.approve(property.propertyId, approvalNotes);
      
      if (response.success) {
        // Update local state
        setPendingProperties(pendingProperties.filter(p => p.propertyId !== property.propertyId));
        setApprovedProperties([...approvedProperties, { ...property, status: 'approved', approvalNotes }]);
        
        alert(`✅ Property "${property.name}" has been approved! Owner can now mint NFT.`);
        await loadAllData();
      } else {
        throw new Error(response.message || 'Approval failed');
      }
    } catch (error) {
      console.error('❌ Error approving property:', error);
      alert(`❌ Failed to approve property.\nError: ${error.message}`);
    }
  };

  const handleRejectProperty = async (property) => {
    try {
      const reason = prompt(`Please provide a reason for rejecting "${property.name}":`, '');
      if (reason === null) return;
      
      const response = await propertyApi.reject(property.propertyId, reason);
      
      if (response.success) {
        setPendingProperties(pendingProperties.filter(p => p.propertyId !== property.propertyId));
        setRejectedProperties([...rejectedProperties, { ...property, status: 'rejected', rejectionReason: reason }]);
        
        alert(`❌ Property "${property.name}" has been rejected.`);
        await loadAllData();
      }
    } catch (error) {
      console.error('Error rejecting property:', error);
      alert(`❌ Failed to reject property.\nError: ${error.message}`);
    }
  };

  const viewPropertyDetails = (property) => {
    setSelectedProperty(property);
    setShowPropertyModal(true);
  };

  // Admin Management Functions
  const handleAddAdmin = async () => {
    if (!newAdminAddress || !newAdminAddress.trim()) {
      alert('Please enter a valid admin address');
      return;
    }

    if (!isSuperAdmin) {
      alert('Only super admin can add new admins');
      return;
    }

    try {
      const result = await kycContractService.addAdmin(newAdminAddress.trim());
      
      if (result.success) {
        alert(`✅ Admin added successfully!\nTransaction Hash: ${result.transactionHash}`);
        setNewAdminAddress('');
        // Reload admin list if you have that functionality
      } else {
        throw new Error(result.error || 'Failed to add admin');
      }
    } catch (error) {
      console.error('Error adding admin:', error);
      alert(`❌ Failed to add admin.\nError: ${error.message}`);
    }
  };

  const handleRemoveAdmin = async (adminAddress) => {
    if (!isSuperAdmin) {
      alert('Only super admin can remove admins');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to remove admin: ${adminAddress}?`);
    if (!confirmed) return;

    try {
      const result = await kycContractService.removeAdmin(adminAddress);
      
      if (result.success) {
        alert(`✅ Admin removed successfully!\nTransaction Hash: ${result.transactionHash}`);
        // Reload admin list if you have that functionality
      } else {
        throw new Error(result.error || 'Failed to remove admin');
      }
    } catch (error) {
      console.error('Error removing admin:', error);
      alert(`❌ Failed to remove admin.\nError: ${error.message}`);
    }
  };

  // Utility Functions
  const viewDocuments = async (user) => {
    try {
      const userId = user._id || user.id;
      const response = await userApi.getUserDocuments(userId);
      
      if (response.success) {
        setSelectedUser(user);
        setUserDocuments(response.data);
        setShowDocumentModal(true);
      } else {
        alert('Failed to load documents');
      }
    } catch (error) {
      console.error('Error viewing documents:', error);
      alert('Failed to load documents');
    }
  };

  const handleLogout = () => {
    adminApi.logout();
    navigate("/admin-login");
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatWalletAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatPrice = (price) => {
    if (!price) return 'Not specified';
    return price;
  };

  if (error) {
    return (
      <div className="admin-panel">
        <div className="error-message">
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={initializeAdmin}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="header-content">
          <div>
            <h2>Admin Control Panel</h2>
            {walletState.isConnected && (
              <div className="admin-info">
                <span>Connected: {formatWalletAddress(walletState.address)}</span>
                {isSuperAdmin && <span className="badge badge-warning">Super Admin</span>}
              </div>
            )}
          </div>
          <div className="header-stats">
            <div className="stat-badge">
              <span className="stat-value">{stats.pendingUsers}</span>
              <span className="stat-label">Pending KYC</span>
            </div>
            <div className="stat-badge">
              <span className="stat-value">{stats.pendingProperties}</span>
              <span className="stat-label">Pending Properties</span>
            </div>
          </div>
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User Management ({pendingUsers.length} pending)
        </button>
        <button 
          className={`tab-button ${activeTab === 'properties' ? 'active' : ''}`}
          onClick={() => setActiveTab('properties')}
        >
          Property Management ({pendingProperties.length} pending)
        </button>
        <button 
          className={`tab-button ${activeTab === 'admins' ? 'active' : ''}`}
          onClick={() => setActiveTab('admins')}
        >
          Admin Management
        </button>
        <button 
          className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Platform Stats
        </button>
      </div>

      {isLoading ? (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading admin data...</p>
        </div>
      ) : (
        <>
          {/* User Management Tab */}
          {activeTab === 'users' && (
            <div className="admin-section">
              <div className="section-header">
                <h3>User KYC Verification</h3>
                <button className="btn-refresh" onClick={loadAllData}>
                  <span className="refresh-icon">🔄</span> Refresh
                </button>
              </div>
              
              <div className="card">
                <div className="card-header">
                  <h4>Pending Verifications ({pendingUsers.length})</h4>
                </div>
                {pendingUsers.length === 0 ? (
                  <p className="empty-state">No pending users to verify.</p>
                ) : (
                  <div className="users-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Wallet Address</th>
                          <th>Full Name</th>
                          <th>Email</th>
                          <th>Registration Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingUsers.map((user) => (
                          <tr key={user._id || user.id}>
                            <td className="monospace">{formatWalletAddress(user.walletAddress)}</td>
                            <td>{user.fullName || 'N/A'}</td>
                            <td>{user.email || 'N/A'}</td>
                            <td>{formatDate(user.registrationDate)}</td>
                            <td className="action-buttons">
                              <button
                                className="btn-approve"
                                onClick={() => handleVerifyUser(user)}
                              >
                                Verify
                              </button>
                              <button
                                className="btn-reject"
                                onClick={() => handleRejectUser(user)}
                              >
                                Reject
                              </button>
                              <button
                                className="btn-view"
                                onClick={() => viewDocuments(user)}
                              >
                                View Docs
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="card">
                <h4>Verified Users ({verifiedUsers.length})</h4>
                {verifiedUsers.length === 0 ? (
                  <p className="empty-state">No verified users yet.</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Wallet Address</th>
                        <th>Full Name</th>
                        <th>Email</th>
                        <th>Verification Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verifiedUsers.map((user) => (
                        <tr key={user._id || user.id}>
                          <td className="monospace">{formatWalletAddress(user.walletAddress)}</td>
                          <td>{user.fullName || 'N/A'}</td>
                          <td>{user.email || 'N/A'}</td>
                          <td>{formatDate(user.verificationDate)}</td>
                          <td><span className="status-active">Verified</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Property Management Tab */}
          {activeTab === 'properties' && (
            <div className="admin-section">
              <div className="section-header">
                <h3>Property Approval Management</h3>
                <button className="btn-refresh" onClick={loadAllData}>
                  <span className="refresh-icon">🔄</span> Refresh
                </button>
              </div>
              
              <div className="card">
                <div className="card-header">
                  <h4>Pending Properties ({pendingProperties.length})</h4>
                </div>
                {pendingProperties.length === 0 ? (
                  <p className="empty-state">No pending properties to review.</p>
                ) : (
                  <div className="property-admin-section">
                    {pendingProperties.map((property) => (
                      <div key={property.propertyId} className="property-approval-card">
                        <div className="property-approval-header">
                          <div>
                            <h4>{property.name}</h4>
                            <p className="property-id">ID: {property.propertyId}</p>
                          </div>
                          <span className="status-badge pending">Pending Review</span>
                        </div>
                        
                        <div className="property-approval-details">
                          <div>
                            <strong>Owner:</strong> {formatWalletAddress(property.owner)}
                          </div>
                          <div>
                            <strong>Type:</strong> {property.propertyType}
                          </div>
                          <div>
                            <strong>Area:</strong> {property.areaInSqFt} sq ft
                          </div>
                          <div>
                            <strong>Price:</strong> {formatPrice(property.price)}
                          </div>
                          <div>
                            <strong>Address:</strong> {property.physicalAddress}
                          </div>
                          <div>
                            <strong>Submitted:</strong> {formatDate(property.submissionDate)}
                          </div>
                        </div>
                        
                        <div className="property-description">
                          <strong>Description:</strong>
                          <p>{property.description}</p>
                        </div>
                        
                        <div className="approval-actions">
                          <button
                            className="btn btn-success"
                            onClick={() => handleApproveProperty(property)}
                          >
                            Approve Property
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleRejectProperty(property)}
                          >
                            Reject Property
                          </button>
                          <button
                            className="btn btn-outline"
                            onClick={() => viewPropertyDetails(property)}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card">
                <h4>Approved Properties ({approvedProperties.length})</h4>
                {approvedProperties.length === 0 ? (
                  <p className="empty-state">No approved properties yet.</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Property Name</th>
                        <th>Owner</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Approval Date</th>
                        <th>Token ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvedProperties.map((property) => (
                        <tr key={property.propertyId}>
                          <td>{property.name}</td>
                          <td className="monospace">{formatWalletAddress(property.owner)}</td>
                          <td>{property.propertyType}</td>
                          <td>
                            <span className={`status-badge ${property.status}`}>
                              {property.status === 'minted' ? '✅ Minted' : '⏳ Approved'}
                            </span>
                          </td>
                          <td>{formatDate(property.approvalDate)}</td>
                          <td className="monospace">{property.tokenId || 'Not minted yet'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Admin Management Tab */}
          {activeTab === 'admins' && (
            <div className="admin-section">
              <div className="section-header">
                <h3>Admin Management</h3>
                {!walletState.isConnected && (
                  <div className="alert alert-warning">
                    <p>Connect your wallet to manage blockchain admins</p>
                  </div>
                )}
              </div>
              
              {walletState.isConnected && (
                <>
                  <div className="card">
                    <h4>Current Admin Status</h4>
                    <div className="admin-status-info">
                      <div className="info-row">
                        <span className="info-label">Your Address:</span>
                        <span className="info-value monospace">{walletState.address}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Role:</span>
                        <span className="info-value">
                          {isSuperAdmin ? (
                            <span className="badge badge-success">Super Admin</span>
                          ) : (
                            <span className="badge badge-warning">Admin</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isSuperAdmin && (
                    <>
                      <div className="card">
                        <h4>Add New Admin</h4>
                        <div className="admin-form">
                          <div className="form-group">
                            <label>Admin Wallet Address:</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="0x..."
                              value={newAdminAddress}
                              onChange={(e) => setNewAdminAddress(e.target.value)}
                            />
                          </div>
                          <button
                            className="btn btn-primary"
                            onClick={handleAddAdmin}
                            disabled={!newAdminAddress.trim()}
                          >
                            Add Admin
                          </button>
                        </div>
                      </div>

                      <div className="card">
                        <h4>Admin Actions</h4>
                        <div className="admin-actions-info">
                          <div className="alert alert-info">
                            <h5>Super Admin Capabilities:</h5>
                            <ul>
                              <li>Add new admins to the system</li>
                              <li>Remove existing admins</li>
                              <li>Verify users on blockchain</li>
                              <li>Revoke user verifications</li>
                              <li>Manage property approvals</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {!isSuperAdmin && (
                    <div className="card">
                      <div className="alert alert-warning">
                        <h4>Limited Admin Access</h4>
                        <p>You have admin access to this dashboard but are not a Super Admin on the blockchain.</p>
                        <p>Contact the Super Admin to get blockchain admin privileges for:</p>
                        <ul>
                          <li>Adding/removing other admins</li>
                          <li>Blockchain user verification</li>
                          <li>Advanced property management</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Platform Stats Tab */}
          {activeTab === 'stats' && (
            <div className="admin-section">
              <div className="section-header">
                <h3>Platform Statistics</h3>
                <button className="btn-refresh" onClick={loadAllData}>
                  <span className="refresh-icon">🔄</span> Refresh
                </button>
              </div>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{stats.totalUsers}</div>
                  <div className="stat-label">Total Users</div>
                  <div className="stat-icon">👥</div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-number">{stats.verifiedUsers}</div>
                  <div className="stat-label">Verified Users</div>
                  <div className="stat-icon">✅</div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-number">{stats.pendingUsers}</div>
                  <div className="stat-label">Pending KYC</div>
                  <div className="stat-icon">⏳</div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-number">{pendingProperties.length}</div>
                  <div className="stat-label">Pending Properties</div>
                  <div className="stat-icon">🏠</div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-number">{approvedProperties.length}</div>
                  <div className="stat-label">Approved Properties</div>
                  <div className="stat-icon">🏢</div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-number">{stats.mintedProperties || 0}</div>
                  <div className="stat-label">Minted NFTs</div>
                  <div className="stat-icon">🎯</div>
                </div>
              </div>
              
              <div className="card">
                <h4>System Information</h4>
                <div className="system-info">
                  <div className="info-row">
                    <span className="info-label">Blockchain Connected:</span>
                    <span className="info-value">
                      {walletState.isConnected ? (
                        <span className="status-connected">✅ Connected</span>
                      ) : (
                        <span className="status-disconnected">❌ Disconnected</span>
                      )}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Admin Level:</span>
                    <span className="info-value">
                      {isSuperAdmin ? (
                        <span className="status-admin">🔑 Super Admin</span>
                      ) : (
                        <span className="status-not-admin">👤 Dashboard Admin</span>
                      )}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">KYC Contract:</span>
                    <span className="info-value monospace">{kycContractService.getContractAddress()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Document Modal */}
      {showDocumentModal && selectedUser && userDocuments && (
        <DocumentViewer 
          user={selectedUser}
          documents={userDocuments}
          onClose={() => {
            setShowDocumentModal(false);
            setSelectedUser(null);
            setUserDocuments(null);
          }}
        />
      )}

      {/* Property Details Modal */}
      {showPropertyModal && selectedProperty && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Property Details</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowPropertyModal(false);
                  setSelectedProperty(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="property-details-full">
                <h4>{selectedProperty.name}</h4>
                <div className="property-info-grid">
                  <div className="info-item">
                    <span className="info-label">Property ID:</span>
                    <span className="info-value">{selectedProperty.propertyId}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Owner:</span>
                    <span className="info-value monospace">{selectedProperty.owner}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Type:</span>
                    <span className="info-value">{selectedProperty.propertyType}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Area:</span>
                    <span className="info-value">{selectedProperty.areaInSqFt} sq ft</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Price:</span>
                    <span className="info-value">{formatPrice(selectedProperty.price)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Status:</span>
                    <span className={`status-badge ${selectedProperty.status}`}>
                      {selectedProperty.status}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Submitted:</span>
                    <span className="info-value">{formatDate(selectedProperty.submissionDate)}</span>
                  </div>
                  {selectedProperty.tokenId && (
                    <div className="info-item">
                      <span className="info-label">Token ID:</span>
                      <span className="info-value monospace">{selectedProperty.tokenId}</span>
                    </div>
                  )}
                </div>
                
                <div className="property-description-full">
                  <h5>Physical Address:</h5>
                  <p>{selectedProperty.physicalAddress}</p>
                  
                  <h5>Description:</h5>
                  <p>{selectedProperty.description}</p>
                </div>
                
                {selectedProperty.images && selectedProperty.images.length > 0 && (
                  <div className="property-images">
                    <h5>Property Images:</h5>
                    <div className="images-grid">
                      {selectedProperty.images.map((image, index) => (
                        <div key={index} className="image-preview">
                          <img 
                            src={image.path || `/uploads/properties/${image.filename}`} 
                            alt={`Property ${index + 1}`}
                            onError={(e) => {
                              e.target.src = '/api/placeholder/300/200';
                            }}
                          />
                          <p>{image.originalName}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedProperty.status === 'pending' && (
                  <div className="modal-actions">
                    <button
                      className="btn btn-success"
                      onClick={() => {
                        setShowPropertyModal(false);
                        handleApproveProperty(selectedProperty);
                      }}
                    >
                      Approve Property
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        setShowPropertyModal(false);
                        handleRejectProperty(selectedProperty);
                      }}
                    >
                      Reject Property
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;