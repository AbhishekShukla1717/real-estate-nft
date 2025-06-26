import React from 'react';

const UserVerificationCard = ({ user, onVerify, onReject }) => {
  const formatDate = (date) => new Date(date).toLocaleDateString();
  const formatAddress = (address) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="verification-card">
      <div className="user-info">
        <h4>User Details</h4>
        <p>Wallet: {formatAddress(user.walletAddress)}</p>
        <p>Registered: {formatDate(user.registrationDate)}</p>
        <p>Documents: {user.documents || 0}</p>
      </div>
      <div className="actions">
        <button 
          className="btn-verify" 
          onClick={() => onVerify(user.id)}
        >
          Verify
        </button>
        <button 
          className="btn-reject" 
          onClick={() => onReject(user.id)}
        >
          Reject
        </button>
      </div>
    </div>
  );
};

export default UserVerificationCard;
