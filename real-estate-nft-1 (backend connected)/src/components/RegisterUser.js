import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import kycContractService from "../services/KYCContractService";
import { userApi } from "../services/apiService";
import { toast } from "react-toastify";
import walletService from "../utils/WalletService";

const RegisterUser = () => {
  const [loading, setLoading] = useState(false);
  const [walletState, setWalletState] = useState({
    isConnected: false,
    address: "",
    provider: null
  });
  const [status, setStatus] = useState("");
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [userDbStatus, setUserDbStatus] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    walletAddress: '',
    governmentId: null,
    proofOfAddress: null,
    selfieWithId: null
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Initialize wallet connection
  useEffect(() => {
    const initializeWallet = async () => {
      await walletService.checkConnection();
      const state = walletService.getWalletState();
      setWalletState(state);
      
      if (state.address) {
        await checkVerificationStatus(state.address);
      }
    };

    initializeWallet();

    // Subscribe to wallet changes
    const unsubscribe = walletService.subscribe((newState) => {
      setWalletState(newState);
      if (newState.address) {
        checkVerificationStatus(newState.address);
      } else {
        setVerificationStatus(null);
        setUserDbStatus(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Check verification status with automatic refresh
  const checkVerificationStatus = async (address) => {
    if (!address) {
      setVerificationStatus('not_verified');
      setStatus("📝 Ready to start KYC verification process.");
      return;
    }

    try {
      console.log("🔍 Checking verification status for:", address);
      const response = await userApi.checkUserStatus(address);
      
      if (response.success && response.data) {
        const userStatus = response.data.status;
        setUserDbStatus(response.data);
        setVerificationStatus(userStatus);
        
        // Dispatch custom event for navbar update
        window.dispatchEvent(new CustomEvent('userVerificationUpdated', {
          detail: {
            walletAddress: address,
            verified: userStatus === 'verified',
            status: userStatus
          }
        }));
        
        // Update status messages
        switch (userStatus) {
          case 'verified':
            setStatus("✅ Your account is fully verified! You can now mint property NFTs.");
            // Redirect to mint page after 3 seconds
            setTimeout(() => {
              navigate('/mint');
            }, 3000);
            break;
          case 'pending':
            setStatus("⏳ Your verification is pending admin approval.");
            break;
          case 'rejected':
            setStatus(`❌ Your verification was rejected. ${response.data.verificationDetails?.rejectionReason || ''}`);
            break;
          default:
            setStatus("📝 Ready to start KYC verification process.");
        }
      } else {
        setVerificationStatus('not_verified');
        setStatus("📝 Ready to start KYC verification process.");
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
      setVerificationStatus('not_verified');
      setStatus("📝 Ready to start KYC verification process.");
    }
  };

  // Set up periodic status check for pending users
  useEffect(() => {
    let intervalId;
    
    if (verificationStatus === 'pending' && walletState.address) {
      // Check every 5 seconds if user is pending
      intervalId = setInterval(() => {
        checkVerificationStatus(walletState.address);
      }, 5000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [verificationStatus, walletState.address]);

  const connectWallet = async () => {
    if (loading) return;

    setLoading(true);
    setStatus("🔗 Connecting to MetaMask...");

    try {
      const success = await walletService.connect();
      if (success) {
        setStatus("✅ Wallet connected successfully!");
        const state = walletService.getWalletState();
        await checkVerificationStatus(state.address);
      } else {
        setStatus("❌ Failed to connect wallet");
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setStatus(`❌ Connection failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentChange = (e, documentType) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should not exceed 5MB');
        return;
      }
      
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type. Only JPEG, JPG, PNG, PDF allowed');
        return;
      }

      setFormData(prev => ({
        ...prev,
        [documentType]: file
      }));
      toast.success(`${documentType} uploaded successfully`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!walletState.address) {
      setError('Please connect your wallet first');
      return;
    }
    
    if (!formData.fullName || !formData.email) {
      setError('Please fill in all required fields');
      return;
    }

    if (!formData.governmentId || !formData.proofOfAddress || !formData.selfieWithId) {
      setError('Please upload all required documents');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = new FormData();
      data.append('walletAddress', walletState.address);
      data.append('fullName', formData.fullName);
      data.append('email', formData.email);
      data.append('governmentId', formData.governmentId);
      data.append('proofOfAddress', formData.proofOfAddress);
      data.append('selfieWithId', formData.selfieWithId);

      const response = await userApi.registerUser(data);
      
      if (response.success) {
        setSuccess('KYC submitted successfully! Awaiting admin verification.');
        setVerificationStatus('pending');
        
        // Clear form
        setFormData({
          fullName: '',
          email: '',
          walletAddress: '',
          governmentId: null,
          proofOfAddress: null,
          selfieWithId: null
        });
        
        // Start checking for verification updates
        setTimeout(() => {
          checkVerificationStatus(walletState.address);
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit KYC');
      console.error('KYC submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatWalletAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="register-user-container">
      <div className="register-card">
        <div className="card-header">
          <h2>KYC Verification</h2>
          <p>Complete your identity verification to access platform features</p>
        </div>

        <div className="card-body">
          {/* Wallet Connection Section */}
          <div className="section">
            <h3>Wallet Connection</h3>
            {!walletState.isConnected ? (
              <div className="wallet-connect">
                <p>Connect your MetaMask wallet to begin the KYC process</p>
                <button
                  className="btn btn-primary"
                  onClick={connectWallet}
                  disabled={loading}
                >
                  {loading ? "Connecting..." : "Connect Wallet"}
                </button>
              </div>
            ) : (
              <div className="wallet-connected">
                <div className="wallet-info">
                  <span className="wallet-icon">🔗</span>
                  <div>
                    <strong>Connected Wallet</strong>
                    <p>{formatWalletAddress(walletState.address)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status Display */}
          {status && (
            <div className="status-section">
              <div className={`status-message ${verificationStatus === 'verified' ? 'success' : 
                              verificationStatus === 'rejected' ? 'error' : 
                              verificationStatus === 'pending' ? 'warning' : 'info'}`}>
                {status}
              </div>
            </div>
          )}

          {/* KYC Registration Form */}
          {walletState.isConnected && verificationStatus === 'not_verified' && (
            <div className="section">
              <h3>Upload KYC Documents</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>

                <div className="document-upload-group">
                  <h4>Required Documents</h4>
                  
                  <div className="upload-item">
                    <label htmlFor="governmentId">Government ID</label>
                    <input
                      type="file"
                      id="governmentId"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => handleDocumentChange(e, 'governmentId')}
                      required
                    />
                    {formData.governmentId && (
                      <div className="file-info">
                        <span>✅ {formData.governmentId.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="upload-item">
                    <label htmlFor="proofOfAddress">Proof of Address</label>
                    <input
                      type="file"
                      id="proofOfAddress"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => handleDocumentChange(e, 'proofOfAddress')}
                      required
                    />
                    {formData.proofOfAddress && (
                      <div className="file-info">
                        <span>✅ {formData.proofOfAddress.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="upload-item">
                    <label htmlFor="selfieWithId">Selfie with ID</label>
                    <input
                      type="file"
                      id="selfieWithId"
                      accept=".jpg,.jpeg,.png"
                      onChange={(e) => handleDocumentChange(e, 'selfieWithId')}
                      required
                    />
                    {formData.selfieWithId && (
                      <div className="file-info">
                        <span>✅ {formData.selfieWithId.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="error-message">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="success-message">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-submit"
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Submit KYC Application"}
                </button>
              </form>
            </div>
          )}

          {/* Verified User Section */}
          {verificationStatus === 'verified' && (
            <div className="section">
              <div className="verified-status">
                <div className="success-icon">✅</div>
                <h3>Account Verified!</h3>
                <p>Your KYC verification is complete. You can now access all platform features.</p>
                <div className="verified-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate("/mint")}
                  >
                    Mint Property NFT
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => navigate("/properties")}
                  >
                    Browse Properties
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pending Status */}
          {verificationStatus === 'pending' && (
            <div className="section">
              <div className="pending-status">
                <div className="pending-icon">⏳</div>
                <h3>Verification Pending</h3>
                <p>Your KYC application is under review by our admin team.</p>
                <p><small>This page will automatically update when your verification is complete.</small></p>
                <div className="pending-info">
                  <ul>
                    <li>Review typically takes 1-3 business hours</li>
                    <li>You'll be notified once verification is complete</li>
                    <li>This page refreshes automatically every few seconds</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Rejected Status */}
          {verificationStatus === 'rejected' && (
            <div className="section">
              <div className="rejected-status">
                <div className="error-icon">❌</div>
                <h3>Verification Rejected</h3>
                <p>Unfortunately, your KYC application was not approved.</p>
                {userDbStatus?.verificationDetails?.rejectionReason && (
                  <p><strong>Reason:</strong> {userDbStatus.verificationDetails.rejectionReason}</p>
                )}
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setVerificationStatus('not_verified');
                    setUserDbStatus(null);
                    setStatus("📝 Ready to resubmit KYC application.");
                  }}
                >
                  Resubmit Application
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterUser;