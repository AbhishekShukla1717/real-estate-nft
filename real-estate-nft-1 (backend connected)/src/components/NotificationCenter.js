// components/NotificationCenter.js - Component for showing property sale notifications
import React, { useState, useEffect } from 'react';
import { transactionApi } from '../services/apiService';

const NotificationCenter = ({ walletAddress, onNotificationUpdate }) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (walletAddress) {
      loadNotifications();
      // Check for new notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [walletAddress]);

  const loadNotifications = async () => {
    try {
      const response = await transactionApi.getUserTransactions(walletAddress);
      console.log('NotificationCenter response:', response);
      
      if (response.success && response.data) {
        // Ensure response.data is an array
        const transactions = Array.isArray(response.data) ? response.data : [];
        
        const saleNotifications = transactions
          .filter(tx => 
            tx.type === 'sale' && 
            tx.from && 
            tx.from.toLowerCase() === walletAddress.toLowerCase()
          )
          .map(tx => ({
            id: tx._id || tx.id || Math.random().toString(36),
            type: 'sale',
            propertyName: tx.propertyName || `Property #${tx.propertyId}`,
            buyer: tx.to,
            price: tx.value,
            txHash: tx.txHash,
            timestamp: new Date(tx.createdAt || tx.timestamp || Date.now()),
            read: tx.notificationRead || false
          }))
          .sort((a, b) => b.timestamp - a.timestamp); // Most recent first

        setNotifications(saleNotifications);
        const unread = saleNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);
        
        if (onNotificationUpdate) {
          onNotificationUpdate(unread);
        }
        
        console.log(`✅ NotificationCenter loaded ${saleNotifications.length} notifications`);
      } else {
        console.log('No notification data received in NotificationCenter');
        setNotifications([]);
        setUnreadCount(0);
        if (onNotificationUpdate) {
          onNotificationUpdate(0);
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
      if (onNotificationUpdate) {
        onNotificationUpdate(0);
      }
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await transactionApi.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      if (onNotificationUpdate) {
        onNotificationUpdate(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatAddress = (address) => {
    if (!address) return 'Unknown';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatPrice = (priceInETH) => {
    const price = parseFloat(priceInETH);
    if (isNaN(price)) return '0 ETH';
    if (price < 0.001) return price.toExponential(2) + ' ETH';
    if (price < 1) return price.toFixed(4) + ' ETH';
    return price.toFixed(2) + ' ETH';
  };

  if (!walletAddress) return null;

  return (
    <div className="notification-center">
      <button 
        className={`notification-bell ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => setShowNotifications(!showNotifications)}
        title={`${unreadCount} unread notifications`}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {showNotifications && (
        <>
          <div 
            className="notification-overlay" 
            onClick={() => setShowNotifications(false)}
          ></div>
          <div className="notification-dropdown">
            <div className="notification-header">
              <h4>Property Sale Notifications</h4>
              <button 
                className="close-btn"
                onClick={() => setShowNotifications(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="no-notifications">
                  <p>No sale notifications yet</p>
                  <small>You'll be notified when someone buys your properties</small>
                </div>
              ) : (
                notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="notification-content">
                      <div className="notification-icon">🎉</div>
                      <div className="notification-details">
                        <h5>Property Sold!</h5>
                        <p className="property-name">{notification.propertyName}</p>
                        <div className="sale-info">
                          <span className="buyer-label">Sold to:</span>
                          <span className="buyer-address">{formatAddress(notification.buyer)}</span>
                        </div>
                        <div className="price-info">
                          <span className="price-label">Price:</span>
                          <span className="sale-price">{formatPrice(notification.price)}</span>
                        </div>
                        <div className="timestamp">
                          {notification.timestamp.toLocaleDateString()} at {notification.timestamp.toLocaleTimeString()}
                        </div>
                        {notification.txHash && (
                          <a 
                            href={`https://etherscan.io/tx/${notification.txHash}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="tx-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Transaction ↗
                          </a>
                        )}
                      </div>
                      {!notification.read && <div className="unread-indicator"></div>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;