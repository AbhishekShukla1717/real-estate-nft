import React, { useState } from 'react';
import { transactionApi } from '../services/apiService';

const NotificationTester = ({ walletAddress, onNotificationUpdate }) => {
  const [testResult, setTestResult] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCreateTest = async () => {
    if (!walletAddress) {
      setTestResult('❌ Please connect your wallet first');
      return;
    }
    
    setLoading(true);
    try {
      setTestResult('🔄 Creating test sale transactions...');
      const result = await transactionApi.createTestData(walletAddress);
      
      if (result.success) {
        setTestResult(`✅ Created ${result.data?.created || 0} test transactions for ${result.data?.sellerAddress}`);
        console.log('✅ Test data created:', result.data);
        
        // Trigger notification reload in parent component
        if (onNotificationUpdate) {
          setTimeout(() => onNotificationUpdate(), 1000);
        }
      } else {
        setTestResult(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      setTestResult(`❌ Network Error: ${error.message}`);
      console.error('Error creating test data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    setLoading(true);
    try {
      setTestResult('🔄 Clearing all transaction data...');
      const result = await transactionApi.clearAllData();
      
      if (result.success) {
        setTestResult(`✅ Cleared ${result.data?.previousCount || 0} transactions`);
        
        // Trigger notification reload in parent component
        if (onNotificationUpdate) {
          setTimeout(() => onNotificationUpdate(), 1000);
        }
      } else {
        setTestResult(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      setTestResult(`❌ Network Error: ${error.message}`);
      console.error('Error clearing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDebug = async () => {
    setLoading(true);
    try {
      const result = await transactionApi.debugTransactions();
      
      if (result.success) {
        setDebugInfo(result.data);
        console.log('🔍 Debug info:', result.data);
      } else {
        setDebugInfo({ error: result.message });
      }
    } catch (error) {
      setDebugInfo({ error: error.message });
      console.error('Error fetching debug info:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px dashed #e0e0e0', 
      margin: '20px 0',
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
        <span style={{ fontSize: '24px', marginRight: '10px' }}>🧪</span>
        <h3 style={{ margin: 0, color: '#333' }}>Notification Testing Panel</h3>
      </div>
      
      <div style={{ 
        marginBottom: '15px',
        padding: '10px',
        backgroundColor: '#e8f4f8',
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <strong>Connected Wallet:</strong> {walletAddress ? (
          <span style={{ color: '#007bff', fontFamily: 'monospace' }}>
            {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
          </span>
        ) : (
          <span style={{ color: '#dc3545' }}>Not connected</span>
        )}
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <button 
          onClick={handleCreateTest}
          disabled={!walletAddress || loading}
          style={{ 
            marginRight: '10px', 
            padding: '10px 16px',
            backgroundColor: !walletAddress || loading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: !walletAddress || loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {loading ? '⏳ Working...' : '🎯 Create Test Sales'}
        </button>
        
        <button 
          onClick={handleClearData}
          disabled={loading}
          style={{ 
            marginRight: '10px', 
            padding: '10px 16px',
            backgroundColor: loading ? '#ccc' : '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {loading ? '⏳ Working...' : '🗑️ Clear All'}
        </button>
        
        <button 
          onClick={handleDebug}
          disabled={loading}
          style={{ 
            padding: '10px 16px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {loading ? '⏳ Working...' : '🔍 Debug Info'}
        </button>
      </div>
      
      {testResult && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: testResult.includes('❌') ? '#f8d7da' : '#d4edda',
          color: testResult.includes('❌') ? '#721c24' : '#155724',
          borderRadius: '6px',
          marginBottom: '10px',
          fontSize: '14px',
          border: `1px solid ${testResult.includes('❌') ? '#f5c6cb' : '#c3e6cb'}`
        }}>
          {testResult}
        </div>
      )}
      
      {debugInfo && (
        <div style={{ 
          marginTop: '15px',
          padding: '12px',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          fontSize: '12px',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#495057' }}>
            🔍 Debug Information:
          </div>
          <div style={{ 
            backgroundColor: '#fff',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #e9ecef',
            maxHeight: '200px',
            overflow: 'auto'
          }}>
            <strong>Total Transactions:</strong> {debugInfo.totalTransactions || 0}<br/>
            {debugInfo.transactions && debugInfo.transactions.length > 0 && (
              <>
                <strong>Recent Transactions:</strong>
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                  {debugInfo.transactions.slice(0, 5).map((tx, index) => (
                    <li key={index} style={{ marginBottom: '3px' }}>
                      {tx.propertyName} - {tx.type} ({tx.from?.substring(0, 6)}...→{tx.to?.substring(0, 6)}...) - {tx.value} ETH
                    </li>
                  ))}
                </ul>
              </>
            )}
            {debugInfo.error && (
              <div style={{ color: '#dc3545' }}>
                <strong>Error:</strong> {debugInfo.error}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div style={{ 
        marginTop: '15px',
        padding: '10px',
        backgroundColor: '#fff3cd',
        borderRadius: '6px',
        fontSize: '13px',
        color: '#856404',
        border: '1px solid #ffeaa7'
      }}>
        <strong>💡 How to test:</strong>
        <ol style={{ margin: '5px 0 0 0', paddingLeft: '20px' }}>
          <li>Connect your wallet</li>
          <li>Click "Create Test Sales" to generate test notifications</li>
          <li>Check the notification bell (🔔) in the header</li>
          <li>Use "Debug Info" to see what's stored</li>
          <li>Use "Clear All" to reset and test again</li>
        </ol>
      </div>
    </div>
  );
};

export default NotificationTester;