// App.js - Complete with All Escrow Routes Fixed
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { adminApi, testApiConnection } from './services/apiService';
import serverService from './services/ServerService';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Component Imports
import Navbar from './components/Navbar';
import Home from './components/Home';
import RegisterUser from './components/RegisterUser';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/AdminLogin';
import Mint from './components/Mint';
import Footer from './components/Footer';
import Properties from './components/Properties';
import Marketplace from './components/Marketplace';
import KYCRegistration from './components/KYCRegistration';
import AdminDashboard from './components/admin/Dashboard';
import UserStatus from './components/UserStatus';
import PrivateRoute from './components/PrivateRoute';
import MyEscrows from './components/MyEscrows'; // Import MyEscrows component

// Context Providers
import { WalletProvider } from './context/WalletContext';
import { AdminProvider } from './context/AdminContext';
import { EscrowProvider } from './context/EscrowContext';

// CSS Import
import './App.css';

/**
 * Protected Route Component
 */
const AdminProtectedRoute = ({ children }) => {
  const isAdmin = adminApi.isLoggedIn();
  
  if (!isAdmin) {
    return <Navigate to="/admin-login" replace />;
  }
  
  return children;
};

/**
 * Individual Escrow Details Page Component - FIXED IMPORTS
 */
const EscrowDetailsPage = () => {
  const { tokenId } = useParams(); // FIXED: Proper useParams import
  
  return (
    <div className="page-content">
      <div className="container">
        <div className="escrow-details-header">
          <h1>Escrow Transaction #{tokenId}</h1>
          <p>Secure property transaction with blockchain escrow protection</p>
        </div>
        
        <div className="escrow-details-card">
          <div className="escrow-notification">
            <div className="notification-icon">⚖️</div>
            <div className="notification-content">
              <div className="notification-title">Escrow Transaction Details</div>
              <div className="notification-message">
                Detailed information for escrow transaction #{tokenId}:
                <ul style={{ marginTop: '10px', marginBottom: '0' }}>
                  <li>📋 Complete transaction timeline and current status</li>
                  <li>🏠 Property details and NFT information</li>
                  <li>👥 Buyer and seller wallet addresses</li>
                  <li>💰 Payment breakdown with platform fees</li>
                  <li>🎯 Action buttons for deposit, complete, or cancel</li>
                  <li>🔗 Real-time blockchain transaction history</li>
                  <li>📱 Mobile-responsive escrow management</li>
                </ul>
              </div>
              <div className="notification-actions">
                <button 
                  className="btn btn-primary" 
                  onClick={() => window.history.back()}
                >
                  ← Go Back
                </button>
                <a href="/my-escrows" className="btn btn-secondary">
                  📋 My Escrows
                </a>
                <a href="/marketplace" className="btn btn-outline">
                  🏪 Browse Marketplace
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Property Details with Escrow Integration
 */
const PropertyDetailsPage = () => {
  const { id } = useParams();
  
  return (
    <div className="page-content">
      <div className="container">
        <div className="property-header">
          <h1>Property #{id}</h1>
          <p>Complete property details with escrow protection options</p>
        </div>
        
        <div className="property-details-card">
          <div className="property-notification">
            <div className="notification-icon">🏠</div>
            <div className="notification-content">
              <div className="notification-title">Property Details & Escrow Integration</div>
              <div className="notification-message">
                Complete property information for Token #{id} with escrow capabilities:
                <ul style={{ marginTop: '10px', marginBottom: '0' }}>
                  <li>🖼️ High-resolution property images and virtual tour</li>
                  <li>📍 Detailed specifications, amenities, and location data</li>
                  <li>📈 Complete transaction history with escrow details</li>
                  <li>👤 Current owner and pricing information</li>
                  <li>⚖️ Active escrow status and participation options</li>
                  <li>🛡️ Direct "Buy with Escrow Protection" button</li>
                  <li>🔐 Smart contract integration for secure transactions</li>
                  <li>💬 Communication tools for buyer-seller interaction</li>
                </ul>
              </div>
              <div className="notification-actions">
                <a href="/marketplace" className="btn btn-primary">
                  🏪 Browse All Properties
                </a>
                <a href="/my-escrows" className="btn btn-secondary">
                  ⚖️ My Escrows
                </a>
                <a href="/properties" className="btn btn-outline">
                  🏠 My Properties
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Escrow Dashboard - Overview of all escrow activities
 */
const EscrowDashboard = () => {
  return (
    <div className="page-content">
      <div className="container">
        <div className="dashboard-header">
          <h1>Escrow Dashboard</h1>
          <p>Overview of all escrow activities and statistics</p>
        </div>
        
        <div className="dashboard-content">
          <div className="escrow-notification">
            <div className="notification-icon">📊</div>
            <div className="notification-content">
              <div className="notification-title">Escrow Dashboard</div>
              <div className="notification-message">
                Comprehensive escrow analytics and management:
                <ul style={{ marginTop: '10px', marginBottom: '0' }}>
                  <li>📈 Real-time escrow statistics and volume</li>
                  <li>⏰ Pending actions requiring your attention</li>
                  <li>💰 Total value locked in escrow contracts</li>
                  <li>📋 Recent escrow activities and notifications</li>
                  <li>🎯 Quick actions for common escrow tasks</li>
                  <li>📱 Mobile-optimized dashboard interface</li>
                </ul>
              </div>
              <div className="notification-actions">
                <a href="/my-escrows" className="btn btn-primary">
                  📋 View My Escrows
                </a>
                <a href="/marketplace" className="btn btn-secondary">
                  🏪 Browse Marketplace
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Main App Component
 */
function App() {
  const [serverStatus, setServerStatus] = useState(true);
  const [apiConnectionStatus, setApiConnectionStatus] = useState(null);

  useEffect(() => {
    // Test API connection on app load
    const testConnection = async () => {
      console.log('🔍 Testing API connection...');
      const isConnected = await testApiConnection();
      setApiConnectionStatus(isConnected);
      
      if (!isConnected) {
        console.error('❌ API connection failed - check if server is running on port 5000');
      } else {
        console.log('✅ API connection successful');
      }
    };
    
    testConnection();

    // Start monitoring when app loads
    serverService.startMonitoring();
    
    // Subscribe to status changes
    const unsubscribe = serverService.onStatusChange((isConnected) => {
      setServerStatus(isConnected);
    });

    // Initial check
    serverService.checkServer();

    // Cleanup on unmount
    return () => {
      unsubscribe();
      serverService.stopMonitoring();
    };
  }, []);

  // Show API connection status notification
  if (apiConnectionStatus === false) {
    return (
      <div className="server-error">
        <div className="error-message">
          <h3>🔌 API Connection Failed</h3>
          <p>Unable to connect to the backend API.</p>
          <p>Please ensure the backend server is running on <code>http://localhost:5000</code></p>
          <button onClick={() => window.location.reload()}>
            🔄 Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Show server status if disconnected
  if (!serverStatus) {
    return (
      <div className="server-error">
        <div className="error-message">
          <h3>⚠️ Server Connection Lost</h3>
          <p>The server is not responding. Please check your connection.</p>
          <button onClick={() => serverService.checkServer()}>
            🔄 Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <WalletProvider>
        <AdminProvider>
          <EscrowProvider>
            <div className="app">
              <ToastContainer 
                position="top-right" 
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
              />
              
              {/* API Connection Status Indicator */}
              {apiConnectionStatus === true && (
                <div style={{
                  position: 'fixed',
                  top: '10px',
                  right: '10px',
                  background: '#4CAF50',
                  color: 'white',
                  padding: '5px 10px',
                  borderRadius: '5px',
                  fontSize: '12px',
                  zIndex: 9999,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  ✅ API Connected
                </div>
              )}
              
              <Navbar />
              <main className="main-content">
                <Routes>
                  {/* ================================ */}
                  {/* PUBLIC ROUTES */}
                  {/* ================================ */}
                  <Route path="/" element={<Home />} />
                  <Route path="/register" element={<RegisterUser />} />
                  <Route path="/admin-login" element={<AdminLogin />} />
                  
                  {/* ================================ */}
                  {/* PROPERTY & NFT ROUTES */}
                  {/* ================================ */}
                  <Route path="/mint" element={<Mint />} />
                  <Route path="/properties" element={<Properties />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  
                  {/* Individual Property Details with Escrow Integration */}
                  <Route path="/property/:id" element={<PropertyDetailsPage />} />
                  
                  {/* ================================ */}
                  {/* ESCROW ROUTES - COMPLETE SUITE */}
                  {/* ================================ */}
                  
                  {/* Main Escrows Page - User's escrow transactions */}
                  <Route path="/my-escrows" element={<MyEscrows />} />
                  
                  {/* Individual Escrow Details */}
                  <Route path="/escrow/:tokenId" element={<EscrowDetailsPage />} />
                  
                  {/* Escrow Dashboard - Analytics and overview */}
                  <Route path="/escrow-dashboard" element={<EscrowDashboard />} />
                  
                  {/* Legacy route redirects for escrow */}
                  <Route path="/escrows" element={<Navigate to="/my-escrows" replace />} />
                  <Route path="/escrow" element={<Navigate to="/my-escrows" replace />} />
                  
                  {/* ================================ */}
                  {/* ADMIN ROUTES */}
                  {/* ================================ */}
                  <Route 
                    path="/admin" 
                    element={
                      <AdminProtectedRoute>
                        <AdminPanel />
                      </AdminProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/*" 
                    element={
                      <PrivateRoute>
                        <AdminDashboard />
                      </PrivateRoute>
                    } 
                  />
                  
                  {/* ================================ */}
                  {/* KYC ROUTES */}
                  {/* ================================ */}
                  <Route path="/kyc-registration" element={<KYCRegistration />} />
                  <Route path="/check-status/:walletAddress" element={<UserStatus />} />
                  
                  {/* ================================ */}
                  {/* FALLBACK & ERROR ROUTES */}
                  {/* ================================ */}
                  <Route 
                    path="*" 
                    element={
                      <div className="page-content">
                        <div className="container text-center">
                          <div className="error-404">
                            <h1>🔍 404 - Page Not Found</h1>
                            <p>The page you're looking for doesn't exist.</p>
                            <div style={{ marginTop: '30px' }}>
                              <a href="/" className="btn btn-primary">
                                🏠 Go Home
                              </a>
                              <a 
                                href="/marketplace" 
                                className="btn btn-secondary" 
                                style={{ marginLeft: '10px' }}
                              >
                                🏪 Browse Marketplace
                              </a>
                              <a 
                                href="/my-escrows" 
                                className="btn btn-outline" 
                                style={{ marginLeft: '10px' }}
                              >
                                ⚖️ My Escrows
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    } 
                  />
                </Routes>
              </main>
              <Footer />
            </div>
          </EscrowProvider>
        </AdminProvider>
      </WalletProvider>
    </BrowserRouter>
  );
}

export default App;