// components/DocumentViewer.js
import React, { useState } from 'react';
import axios from 'axios';

const DocumentViewer = ({ user, documents, onClose }) => {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const viewDocument = async (docType) => {
    setLoading(true);
    setError(null);
    
    try {
      const userId = user._id || user.id;
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const documentUrl = `${baseURL}/documents/${userId}/${docType}`;
      
      // Open document in new tab
      const response = await axios.get(documentUrl, {
        headers: getAuthHeader(),
        responseType: 'blob'
      });
      
      // Create blob URL and open in new tab
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Clean up blob URL after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      console.error('Error viewing document:', error);
      setError(`Failed to load document: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async (docType) => {
    setLoading(true);
    setError(null);
    
    try {
      const userId = user._id || user.id;
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const documentUrl = `${baseURL}/documents/${userId}/${docType}`;
      
      const response = await axios.get(documentUrl, {
        headers: getAuthHeader(),
        responseType: 'blob'
      });
      
      // Create download link
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${user.fullName}_${docType}_${Date.now()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading document:', error);
      setError(`Failed to download document: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getDocumentIcon = (docType) => {
    switch (docType) {
      case 'governmentId':
        return '🪪';
      case 'proofOfAddress':
        return '🏠';
      case 'selfieWithId':
        return '🤳';
      default:
        return '📄';
    }
  };

  const getDocumentLabel = (docType) => {
    switch (docType) {
      case 'governmentId':
        return 'Government ID';
      case 'proofOfAddress':
        return 'Proof of Address';
      case 'selfieWithId':
        return 'Selfie with ID';
      default:
        return docType;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content document-viewer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📁 Documents - {user.fullName}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="user-info-summary">
            <div className="info-item">
              <span className="info-label">Wallet:</span>
              <span className="info-value">{user.walletAddress}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">{user.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Registration Date:</span>
              <span className="info-value">{new Date(user.registrationDate).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="documents-grid">
            {['governmentId', 'proofOfAddress', 'selfieWithId'].map((docType) => {
              const doc = documents[docType];
              const hasDocument = doc && (doc.url || doc.filename);
              
              return (
                <div key={docType} className={`document-card ${hasDocument ? 'has-document' : 'no-document'}`}>
                  <div className="document-icon">
                    {getDocumentIcon(docType)}
                  </div>
                  
                  <h4>{getDocumentLabel(docType)}</h4>
                  
                  {hasDocument ? (
                    <>
                      <div className="document-status">
                        <span className="status-icon">✅</span>
                        <span>Uploaded</span>
                      </div>
                      
                      {doc.uploadDate && (
                        <p className="upload-date">
                          Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}
                        </p>
                      )}
                      
                      <div className="document-actions">
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => viewDocument(docType)}
                          disabled={loading}
                        >
                          {loading ? 'Loading...' : '👁️ View'}
                        </button>
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => downloadDocument(docType)}
                          disabled={loading}
                        >
                          {loading ? 'Loading...' : '⬇️ Download'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="document-status">
                      <span className="status-icon">❌</span>
                      <span>Not Uploaded</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;