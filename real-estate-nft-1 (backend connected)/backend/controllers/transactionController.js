// controllers/transactionController.js - COMPLETE FULL FILE

// Initialize global storage if not exists
if (!global.transactions) {
  global.transactions = [];
  console.log('🆕 Initialized global transactions array');
}

const transactionController = {
  // Record a new transaction - ENHANCED for notifications
  recordTransaction: async (req, res) => {
    try {
      console.log('📝 Recording new transaction');
      console.log('📥 Request body:', req.body);
      
      const {
        propertyId,
        propertyName,
        from,
        to,
        transactionHash,
        txHash,
        blockNumber,
        gasUsed,
        transactionFee,
        transactionType,
        type,
        amount,
        value,
        price,
        tokenId,
        status = 'completed',
        notificationRead = false,
        buyerAddress,
        sellerAddress,
        timestamp
      } = req.body;

      // Use whichever fields are provided
      const finalTxHash = transactionHash || txHash || `0xtest${Date.now()}`;
      const finalType = type || transactionType || 'unknown';
      const finalValue = amount || value || price || '0';
      const finalFrom = from || sellerAddress;
      const finalTo = to || buyerAddress;

      // Initialize memory storage
      if (!global.transactions) {
        global.transactions = [];
        console.log('🆕 Initialized global transactions array');
      }

      // Check if transaction already exists
      const existingTx = global.transactions.find(tx => tx.transactionHash === finalTxHash);
      if (existingTx) {
        console.log('⚠️ Transaction already exists:', finalTxHash);
        return res.json({
          success: true,
          message: 'Transaction already recorded',
          data: existingTx
        });
      }

      // Create comprehensive transaction record
      const transactionRecord = {
        _id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        
        // Primary fields
        propertyId: propertyId || tokenId,
        propertyName: propertyName || `Property #${propertyId || tokenId || 'Unknown'}`,
        from: finalFrom ? finalFrom.toLowerCase() : null,
        to: finalTo ? finalTo.toLowerCase() : null,
        transactionHash: finalTxHash,
        type: finalType,
        value: finalValue.toString(),
        status,
        blockNumber: blockNumber || null,
        gasUsed: gasUsed || '0',
        transactionFee: transactionFee || '0',
        tokenId: tokenId || propertyId,
        notificationRead: notificationRead || false,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        createdAt: new Date(),
        
        // Alternative field names for maximum compatibility
        txHash: finalTxHash,
        property_name: propertyName || `Property #${propertyId || tokenId || 'Unknown'}`,
        property_id: propertyId || tokenId,
        buyer: finalTo,
        buyerAddress: finalTo,
        seller: finalFrom,
        sellerAddress: finalFrom,
        notification_read: notificationRead || false,
        created_at: new Date(),
        read: notificationRead || false,
        price: finalValue.toString(),
        amount: finalValue.toString()
      };

      // Add to memory storage
      global.transactions.push(transactionRecord);

      console.log('✅ Transaction recorded successfully');
      console.log('📊 Transaction details:', {
        id: transactionRecord._id,
        type: transactionRecord.type,
        from: transactionRecord.from,
        to: transactionRecord.to,
        propertyName: transactionRecord.propertyName,
        value: transactionRecord.value
      });

      res.status(201).json({
        success: true,
        message: 'Transaction recorded successfully',
        data: transactionRecord
      });

    } catch (error) {
      console.error('❌ Error recording transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Error recording transaction',
        error: error.message
      });
    }
  },

  // Get all transactions
  getAllTransactions: async (req, res) => {
    try {
      const { type, status, from, to, propertyId, page = 1, limit = 50 } = req.query;
      let transactions = global.transactions || [];

      // Apply filters
      if (type) transactions = transactions.filter(tx => tx.type === type);
      if (status) transactions = transactions.filter(tx => tx.status === status);
      if (from) transactions = transactions.filter(tx => tx.from && tx.from.toLowerCase() === from.toLowerCase());
      if (to) transactions = transactions.filter(tx => tx.to && tx.to.toLowerCase() === to.toLowerCase());
      if (propertyId) transactions = transactions.filter(tx => tx.propertyId === propertyId);

      // Sort by timestamp (newest first)
      transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedTransactions = transactions.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: paginatedTransactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(transactions.length / limit),
          totalTransactions: transactions.length,
          hasNext: endIndex < transactions.length,
          hasPrev: page > 1
        }
      });
    } catch (error) {
      console.error('❌ Error fetching transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching transactions',
        error: error.message
      });
    }
  },

  // Get transactions by property
  getTransactionsByProperty: async (req, res) => {
    try {
      const { propertyId } = req.params;
      const transactions = (global.transactions || [])
        .filter(tx => tx.propertyId === propertyId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      res.json({
        success: true,
        data: transactions,
        property: { propertyId },
        count: transactions.length
      });
    } catch (error) {
      console.error('❌ Error fetching property transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching property transactions',
        error: error.message
      });
    }
  },

  // CRITICAL: Get transactions by user - FIXED for notifications
  getTransactionsByUser: async (req, res) => {
    try {
      const { address } = req.params;
      const userAddress = address.toLowerCase();
      
      console.log('📋 FIXED: Fetching transactions for user:', userAddress);
      console.log('📊 Total transactions in memory:', (global.transactions || []).length);

      if (!global.transactions) {
        global.transactions = [];
      }

      // Get all transactions for this user
      const allTransactions = (global.transactions || [])
        .filter(tx => {
          const isFrom = tx.from && tx.from.toLowerCase() === userAddress;
          const isTo = tx.to && tx.to.toLowerCase() === userAddress;
          return isFrom || isTo;
        })
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      console.log(`📋 Found ${allTransactions.length} total transactions for user`);

      // **CRITICAL**: Return the exact structure that frontend expects
      res.json({
        success: true,
        data: allTransactions, // This is what the frontend looks for!
        summary: {
          all: allTransactions,
          sent: allTransactions.filter(tx => tx.from && tx.from.toLowerCase() === userAddress),
          received: allTransactions.filter(tx => tx.to && tx.to.toLowerCase() === userAddress)
        },
        counts: {
          total: allTransactions.length,
          sent: allTransactions.filter(tx => tx.from && tx.from.toLowerCase() === userAddress).length,
          received: allTransactions.filter(tx => tx.to && tx.to.toLowerCase() === userAddress).length
        }
      });

    } catch (error) {
      console.error('❌ Error fetching user transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user transactions',
        error: error.message,
        data: [] // Return empty array on error
      });
    }
  },

  // Get transaction by hash
  getTransactionByHash: async (req, res) => {
    try {
      const { hash } = req.params;
      const transaction = (global.transactions || []).find(tx => tx.transactionHash === hash);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      res.json({ success: true, data: transaction });
    } catch (error) {
      console.error('❌ Error fetching transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching transaction',
        error: error.message
      });
    }
  },

  // Update transaction status
  updateTransactionStatus: async (req, res) => {
    try {
      const { hash } = req.params;
      const { status, blockNumber, gasUsed } = req.body;

      const transactionIndex = (global.transactions || []).findIndex(tx => tx.transactionHash === hash);

      if (transactionIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // Update transaction
      global.transactions[transactionIndex] = {
        ...global.transactions[transactionIndex],
        status: status || global.transactions[transactionIndex].status,
        blockNumber: blockNumber || global.transactions[transactionIndex].blockNumber,
        gasUsed: gasUsed || global.transactions[transactionIndex].gasUsed,
        updatedAt: new Date()
      };

      res.json({
        success: true,
        message: 'Transaction status updated',
        data: global.transactions[transactionIndex]
      });
    } catch (error) {
      console.error('❌ Error updating transaction status:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating transaction status',
        error: error.message
      });
    }
  },

  // Get transaction statistics
  getTransactionStats: async (req, res) => {
    try {
      const transactions = global.transactions || [];
      
      const stats = {
        period: '30d',
        totalTransactions: transactions.length,
        totalProperties: new Set(transactions.map(tx => tx.propertyId).filter(Boolean)).size,
        totalUsers: new Set([
          ...transactions.map(tx => tx.from).filter(Boolean),
          ...transactions.map(tx => tx.to).filter(Boolean)
        ]).size,
        transactionsByType: transactions.reduce((acc, tx) => {
          acc[tx.type] = (acc[tx.type] || 0) + 1;
          return acc;
        }, {}),
        totalValue: transactions.reduce((sum, tx) => sum + (parseFloat(tx.value) || 0), 0),
        completedTransactions: transactions.filter(tx => tx.status === 'completed').length,
        pendingTransactions: transactions.filter(tx => tx.status === 'pending').length,
        salesTransactions: transactions.filter(tx => tx.type === 'sale').length
      };

      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('❌ Error fetching transaction stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching transaction stats',
        error: error.message
      });
    }
  },

  // Mark notification as read
  markNotificationAsRead: async (req, res) => {
    try {
      const { transactionId } = req.params;
      
      console.log('📋 Marking notification as read:', transactionId);
      
      const transactionIndex = (global.transactions || []).findIndex(tx => tx._id === transactionId);

      if (transactionIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // Mark as read with all possible field names
      global.transactions[transactionIndex].notificationRead = true;
      global.transactions[transactionIndex].notification_read = true;
      global.transactions[transactionIndex].read = true;
      global.transactions[transactionIndex].readAt = new Date();

      console.log('✅ Notification marked as read successfully');

      res.json({
        success: true,
        message: 'Notification marked as read',
        data: global.transactions[transactionIndex]
      });
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating notification status',
        error: error.message
      });
    }
  },

  // Create test data for debugging notifications
  createTestData: async (req, res) => {
    try {
      console.log('🧪 Creating test transaction data...');
      
      if (!global.transactions) {
        global.transactions = [];
      }

      const sellerAddress = req.body.sellerAddress || req.query.sellerAddress || '0xe2376bb9286c8fe19b5f52e10308bcd980a96777';
      
      // Create test sale transactions
      const testTransactions = [
        {
          _id: `test_tx_1_${Date.now()}`,
          propertyId: 'test_property_001',
          propertyName: 'Luxury Penthouse Suite',
          from: sellerAddress.toLowerCase(),
          to: '0x742d35Cc6634C0532925a3b8D49E24f9b2b0e7b7',
          transactionHash: `0xtest1${Date.now()}`,
          type: 'sale',
          value: '3.5',
          status: 'completed',
          blockNumber: 12345,
          gasUsed: '21000',
          transactionFee: '0.002',
          tokenId: '001',
          notificationRead: false,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          
          // Alternative field names
          txHash: `0xtest1${Date.now()}`,
          property_name: 'Luxury Penthouse Suite',
          property_id: 'test_property_001',
          buyer: '0x742d35Cc6634C0532925a3b8D49E24f9b2b0e7b7',
          buyerAddress: '0x742d35Cc6634C0532925a3b8D49E24f9b2b0e7b7',
          seller: sellerAddress.toLowerCase(),
          sellerAddress: sellerAddress.toLowerCase(),
          notification_read: false,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
          read: false,
          price: '3.5',
          amount: '3.5'
        },
        {
          _id: `test_tx_2_${Date.now() + 1}`,
          propertyId: 'test_property_002',
          propertyName: 'Modern Villa with Pool',
          from: sellerAddress.toLowerCase(),
          to: '0x8ba1f109551bD432803012645Hac136c54F652eD',
          transactionHash: `0xtest2${Date.now() + 1}`,
          type: 'sale',
          value: '2.1',
          status: 'completed',
          blockNumber: 12346,
          gasUsed: '21000',
          transactionFee: '0.0015',
          tokenId: '002',
          notificationRead: false,
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          
          // Alternative field names
          txHash: `0xtest2${Date.now() + 1}`,
          property_name: 'Modern Villa with Pool',
          property_id: 'test_property_002',
          buyer: '0x8ba1f109551bD432803012645Hac136c54F652eD',
          buyerAddress: '0x8ba1f109551bD432803012645Hac136c54F652eD',
          seller: sellerAddress.toLowerCase(),
          sellerAddress: sellerAddress.toLowerCase(),
          notification_read: false,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
          read: false,
          price: '2.1',
          amount: '2.1'
        },
        {
          _id: `test_tx_3_${Date.now() + 2}`,
          propertyId: 'test_property_003',
          propertyName: 'Cozy Downtown Apartment',
          from: sellerAddress.toLowerCase(),
          to: '0x9Bc1f109551bD432803012645Hac136c54F652eF',
          transactionHash: `0xtest3${Date.now() + 2}`,
          type: 'sale',
          value: '1.75',
          status: 'completed',
          blockNumber: 12347,
          gasUsed: '21000',
          transactionFee: '0.001',
          tokenId: '003',
          notificationRead: false,
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          createdAt: new Date(Date.now() - 30 * 60 * 1000),
          
          // Alternative field names
          txHash: `0xtest3${Date.now() + 2}`,
          property_name: 'Cozy Downtown Apartment',
          property_id: 'test_property_003',
          buyer: '0x9Bc1f109551bD432803012645Hac136c54F652eF',
          buyerAddress: '0x9Bc1f109551bD432803012645Hac136c54F652eF',
          seller: sellerAddress.toLowerCase(),
          sellerAddress: sellerAddress.toLowerCase(),
          notification_read: false,
          created_at: new Date(Date.now() - 30 * 60 * 1000),
          read: false,
          price: '1.75',
          amount: '1.75'
        },
        {
          _id: `test_tx_4_${Date.now() + 3}`,
          propertyId: 'test_property_004',
          propertyName: 'Waterfront Condo',
          from: sellerAddress.toLowerCase(),
          to: '0xaBc1f109551bD432803012645Hac136c54F652eG',
          transactionHash: `0xtest4${Date.now() + 3}`,
          type: 'sale',
          value: '4.2',
          status: 'completed',
          blockNumber: 12348,
          gasUsed: '21000',
          transactionFee: '0.003',
          tokenId: '004',
          notificationRead: false,
          timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
          createdAt: new Date(Date.now() - 10 * 60 * 1000),
          
          // Alternative field names
          txHash: `0xtest4${Date.now() + 3}`,
          property_name: 'Waterfront Condo',
          property_id: 'test_property_004',
          buyer: '0xaBc1f109551bD432803012645Hac136c54F652eG',
          buyerAddress: '0xaBc1f109551bD432803012645Hac136c54F652eG',
          seller: sellerAddress.toLowerCase(),
          sellerAddress: sellerAddress.toLowerCase(),
          notification_read: false,
          created_at: new Date(Date.now() - 10 * 60 * 1000),
          read: false,
          price: '4.2',
          amount: '4.2'
        },
        {
          _id: `test_tx_5_${Date.now() + 4}`,
          propertyId: 'test_property_005',
          propertyName: 'Mountain Cabin Retreat',
          from: sellerAddress.toLowerCase(),
          to: '0xdEf1f109551bD432803012645Hac136c54F652eH',
          transactionHash: `0xtest5${Date.now() + 4}`,
          type: 'sale',
          value: '2.8',
          status: 'completed',
          blockNumber: 12349,
          gasUsed: '21000',
          transactionFee: '0.0018',
          tokenId: '005',
          notificationRead: false,
          timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          createdAt: new Date(Date.now() - 5 * 60 * 1000),
          
          // Alternative field names
          txHash: `0xtest5${Date.now() + 4}`,
          property_name: 'Mountain Cabin Retreat',
          property_id: 'test_property_005',
          buyer: '0xdEf1f109551bD432803012645Hac136c54F652eH',
          buyerAddress: '0xdEf1f109551bD432803012645Hac136c54F652eH',
          seller: sellerAddress.toLowerCase(),
          sellerAddress: sellerAddress.toLowerCase(),
          notification_read: false,
          created_at: new Date(Date.now() - 5 * 60 * 1000),
          read: false,
          price: '2.8',
          amount: '2.8'
        }
      ];

      // Add test transactions to memory, avoiding duplicates
      let addedCount = 0;
      testTransactions.forEach(tx => {
        const exists = global.transactions.find(existing => existing._id === tx._id);
        if (!exists) {
          global.transactions.push(tx);
          addedCount++;
        }
      });

      console.log('✅ Test transactions created successfully');
      console.log(`📊 Total transactions in memory: ${global.transactions.length}`);
      console.log(`🎯 Test seller address: ${sellerAddress}`);
      console.log(`➕ Added ${addedCount} new test transactions`);

      res.json({
        success: true,
        message: 'Test transaction data created successfully',
        data: {
          created: addedCount,
          sellerAddress: sellerAddress,
          totalTransactions: global.transactions.length,
          testTransactions: testTransactions.map(tx => ({
            id: tx._id,
            propertyName: tx.propertyName,
            from: tx.from,
            to: tx.to,
            value: tx.value,
            type: tx.type,
            timestamp: tx.timestamp
          }))
        }
      });

    } catch (error) {
      console.error('❌ Error creating test data:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating test transaction data',
        error: error.message
      });
    }
  },

  // Clear all transactions (for testing)
  clearAllTransactions: async (req, res) => {
    try {
      const previousCount = (global.transactions || []).length;
      global.transactions = [];
      console.log(`🗑️ Cleared ${previousCount} transactions from memory`);

      res.json({
        success: true,
        message: `Cleared ${previousCount} transactions`,
        data: {
          previousCount,
          currentCount: 0
        }
      });

    } catch (error) {
      console.error('❌ Error clearing transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Error clearing transactions',
        error: error.message
      });
    }
  },

  // Debug endpoint to view all transactions
  debugTransactions: async (req, res) => {
    try {
      const transactions = global.transactions || [];
      
      console.log('🔍 Debug: Current transactions in memory:');
      transactions.forEach((tx, index) => {
        console.log(`  ${index + 1}. ${tx._id}: ${tx.type} - ${tx.propertyName} (${tx.from} → ${tx.to}) - ${tx.value} ETH - ${tx.timestamp}`);
      });

      res.json({
        success: true,
        data: {
          totalTransactions: transactions.length,
          memoryUsage: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
          },
          transactions: transactions.map(tx => ({
            id: tx._id,
            type: tx.type,
            propertyName: tx.propertyName,
            from: tx.from,
            to: tx.to,
            value: tx.value,
            status: tx.status,
            timestamp: tx.timestamp,
            notificationRead: tx.notificationRead,
            createdAt: tx.createdAt
          }))
        },
        message: 'Debug information for transaction storage'
      });

    } catch (error) {
      console.error('❌ Error in debug endpoint:', error);
      res.status(500).json({
        success: false,
        message: 'Error in debug endpoint',
        error: error.message
      });
    }
  },

  // Additional utility methods
  
  // Get notifications count for a user
  getNotificationCount: async (req, res) => {
    try {
      const { address } = req.params;
      const userAddress = address.toLowerCase();
      
      const unreadTransactions = (global.transactions || [])
        .filter(tx => {
          const isFrom = tx.from && tx.from.toLowerCase() === userAddress;
          return isFrom && !tx.notificationRead;
        });

      res.json({
        success: true,
        data: {
          unreadCount: unreadTransactions.length,
          totalCount: (global.transactions || []).filter(tx => 
            tx.from && tx.from.toLowerCase() === userAddress
          ).length
        }
      });
    } catch (error) {
      console.error('❌ Error getting notification count:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting notification count',
        error: error.message
      });
    }
  },

  // Mark all notifications as read for a user
  markAllNotificationsAsRead: async (req, res) => {
    try {
      const { address } = req.params;
      const userAddress = address.toLowerCase();
      
      let updatedCount = 0;
      
      (global.transactions || []).forEach(tx => {
        if (tx.from && tx.from.toLowerCase() === userAddress && !tx.notificationRead) {
          tx.notificationRead = true;
          tx.notification_read = true;
          tx.read = true;
          tx.readAt = new Date();
          updatedCount++;
        }
      });

      res.json({
        success: true,
        message: `Marked ${updatedCount} notifications as read`,
        data: {
          updatedCount
        }
      });
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: 'Error marking all notifications as read',
        error: error.message
      });
    }
  }
};

module.exports = transactionController;