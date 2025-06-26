import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/apiService';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if admin is already logged in
  useEffect(() => {
    if (adminApi.isLoggedIn()) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // FIXED: Pass credentials as an object, not separate parameters
      const response = await adminApi.login({ 
        username: username.trim(), 
        password: password.trim() 
      });
      
      if (response.success) {
        // Double check authentication
        if (adminApi.isLoggedIn()) {
          navigate('/admin');
        } else {
          setError('Authentication failed. Please try again.');
        }
      } else {
        setError(response.error || 'Invalid credentials');
      }
    } catch (error) {
      // FIXED: Better error handling to show actual error message
      const errorMessage = error.message || 'Login failed. Please try again.';
      setError(errorMessage);
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <div className="container">
        <div className="auth-card">
          <div className="card-header">
            <h2>Admin Login</h2>
            <p>Access the administrative dashboard</p>
          </div>
          
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                className="form-control"
                placeholder="Enter admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoComplete="username"
                autoFocus
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-control"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
            
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}
            
            <button 
              type="submit" 
              className={`btn btn-primary w-full ${loading ? 'btn-loading' : ''}`}
              disabled={loading || !username.trim() || !password.trim()}
            >
              {loading ? 'Authenticating...' : 'Login'}
            </button>
          </form>
          
          <div className="card-footer">
            <p className="text-center">
              <button 
                type="button" 
                className="link-button"
                onClick={() => navigate('/')}
              >
                ← Back to Home
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;