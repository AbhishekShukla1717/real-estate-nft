import React, { useState, useEffect } from 'react';
import { userApi, adminApi } from '../../services/apiService';
import UserVerificationCard from './UserVerificationCard';

const Dashboard = () => {
  const [users, setUsers] = useState({
    pendingUsers: [],
    verifiedUsers: [],
    rejectedUsers: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);
  const fetchUsers = async () => {
    try {
      const response = await userApi.getAllUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleVerify = async (userId, notes) => {
    try {
      await userApi.verifyUser(userId, notes);
      fetchUsers();
    } catch (error) {
      console.error('Error verifying user:', error);
    }
  };

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>
      <div className="pending-verifications">
        <h3>Pending Verifications ({users.pendingUsers.length})</h3>
        {users.pendingUsers.map(user => (
          <UserVerificationCard 
            key={user.id}
            user={user}
            onVerify={handleVerify}
            onReject={(userId, reason) => handleReject(userId, reason)}
          />
        ))}
      </div>
      {/* Other dashboard sections */}
    </div>
  );
};

export default Dashboard;
