import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { userApi } from '../services/apiService';

const UserStatus = () => {
  const { walletAddress } = useParams();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await userApi.getStatus(walletAddress);
        setStatus(response.user);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [walletAddress]);

  if (loading) return <div>Loading status...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="user-status">
      <h2>Verification Status</h2>
      <div className="status-card">
        <p>Wallet: {status?.walletAddress}</p>
        <p>Status: <span className={`status-${status?.status}`}>{status?.status}</span></p>
        {status?.verificationDate && (
          <p>Verified on: {new Date(status.verificationDate).toLocaleDateString()}</p>
        )}
      </div>
    </div>
  );
};

export default UserStatus;
