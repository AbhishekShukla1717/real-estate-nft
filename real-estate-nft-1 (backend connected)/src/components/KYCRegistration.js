import React, { useState, useContext } from 'react';
import { WalletContext } from '../context/WalletContext';
import axios from 'axios';

const KYCRegistration = () => {
  // Fixed: Use the correct wallet context structure
  const { walletState } = useContext(WalletContext);
  const walletAddress = walletState?.address;

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    governmentId: null,
    proofOfAddress: null,
    selfieWithId: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const data = new FormData();

    // Validate all required fields
    if (!formData.fullName.trim() || !formData.email.trim()) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Validate file uploads
    if (!formData.governmentId || !formData.proofOfAddress || !formData.selfieWithId) {
      setError('Please upload all required documents');
      setLoading(false);
      return;
    }

    data.append('walletAddress', walletAddress);
    data.append('fullName', formData.fullName.trim());
    data.append('email', formData.email.trim());
    data.append('governmentId', formData.governmentId);
    data.append('proofOfAddress', formData.proofOfAddress);
    data.append('selfieWithId', formData.selfieWithId);

    try {
      const response = await axios.post('/api/users/register', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('KYC documents submitted successfully. Awaiting verification.');
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting KYC');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, documentType) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setError(`Invalid file type for ${documentType}. Please upload JPEG, PNG, or PDF.`);
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError(`File size too large for ${documentType}. Maximum size is 5MB.`);
        return;
      }

      setFormData(prev => ({
        ...prev,
        [documentType]: file
      }));
      setError('');
    }
  };

  // Fixed: Check if wallet is connected properly
  if (!walletState?.isConnected || !walletAddress) {
    return (
      <div className="page-content">
        <div className="container">
          <div className="auth-card">
            <div className="card-header">
              <h2>KYC Registration</h2>
              <p>Please connect your wallet to continue</p>
            </div>
            <div className="connect-wallet-section">
              <div className="wallet-prompt">
                <div className="wallet-icon">🔐</div>
                <h3>Wallet Connection Required</h3>
                <p>You need to connect your wallet to register for KYC verification.</p>
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
        <div className="auth-card">
          <div className="card-header">
            <h2>KYC Registration</h2>
            <p>Complete your verification to access all platform features</p>
          </div>

          {error && <div className="status-message error">{error}</div>}
          {success && <div className="status-message success">{success}</div>}
          
          <div className="verification-notice">
            <div className="notice-header">
              <span className="notice-icon">ℹ️</span>
              <strong>Required Documents</strong>
            </div>
            <ul className="notice-list">
              <li>Government-issued photo ID (passport, driver's license, or national ID)</li>
              <li>Proof of address (utility bill, bank statement, or official document)</li>
              <li>Clear selfie photo holding your government ID</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="kyc-form">
            <div className="section">
              <h3>Personal Information</h3>
              
              <div className="form-group">
                <label htmlFor="fullName">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  className="form-control"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter your full legal name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  Email Address <span className="required">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-control"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div className="wallet-info">
                <div className="connected-wallet">
                  <span className="wallet-status">✅ Wallet Connected:</span>
                  <span className="wallet-address">{walletAddress}</span>
                </div>
              </div>
            </div>

            <div className="section">
              <h3>Document Upload</h3>
              
              <div className="document-upload-group">
                <div className="form-group">
                  <label htmlFor="governmentId">
                    Government ID <span className="required">*</span>
                  </label>
                  <input
                    id="governmentId"
                    type="file"
                    className="form-control file-input"
                    onChange={(e) => handleFileChange(e, 'governmentId')}
                    accept=".jpg,.jpeg,.png,.pdf"
                    required
                  />
                  <small className="form-hint">
                    Upload a clear photo of your passport, driver's license, or national ID.
                    Maximum file size: 5MB. Accepted formats: JPEG, PNG, PDF
                  </small>
                  {formData.governmentId && (
                    <div className="uploaded-files">
                      <p className="files-count">✅ File uploaded: {formData.governmentId.name}</p>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="proofOfAddress">
                    Proof of Address <span className="required">*</span>
                  </label>
                  <input
                    id="proofOfAddress"
                    type="file"
                    className="form-control file-input"
                    onChange={(e) => handleFileChange(e, 'proofOfAddress')}
                    accept=".jpg,.jpeg,.png,.pdf"
                    required
                  />
                  <small className="form-hint">
                    Upload a recent utility bill, bank statement, or official document showing your address.
                    Maximum file size: 5MB. Accepted formats: JPEG, PNG, PDF
                  </small>
                  {formData.proofOfAddress && (
                    <div className="uploaded-files">
                      <p className="files-count">✅ File uploaded: {formData.proofOfAddress.name}</p>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="selfieWithId">
                    Selfie with ID <span className="required">*</span>
                  </label>
                  <input
                    id="selfieWithId"
                    type="file"
                    className="form-control file-input"
                    onChange={(e) => handleFileChange(e, 'selfieWithId')}
                    accept=".jpg,.jpeg,.png"
                    required
                  />
                  <small className="form-hint">
                    Take a clear photo of yourself holding your government ID next to your face.
                    Both your face and the ID should be clearly visible. Accepted formats: JPEG, PNG
                  </small>
                  {formData.selfieWithId && (
                    <div className="uploaded-files">
                      <p className="files-count">✅ File uploaded: {formData.selfieWithId.name}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <button 
                type="submit" 
                className={`btn btn-primary btn-large ${loading ? 'btn-loading' : ''}`}
                disabled={
                  loading || 
                  !formData.fullName || 
                  !formData.email || 
                  !formData.governmentId || 
                  !formData.proofOfAddress || 
                  !formData.selfieWithId
                }
              >
                {loading ? 'Submitting...' : 'Submit KYC Application'}
              </button>
            </div>
          </form>

          {success && (
            <div className="verification-status">
              <div className="success-icon">✅</div>
              <h3>Application Submitted</h3>
              <p className="status-description">
                Your KYC application has been submitted successfully. Our team will review your documents
                and notify you via email once the verification process is complete.
              </p>
              <div className="status-details">
                <div className="detail-item">
                  <span className="detail-label">Wallet Address:</span>
                  <span className="detail-value">{walletAddress}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Submission Time:</span>
                  <span className="detail-value">{new Date().toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KYCRegistration;