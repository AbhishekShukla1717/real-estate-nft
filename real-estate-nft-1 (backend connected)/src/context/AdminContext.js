import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminApi } from '../services/apiService';

const AdminContext = createContext(null);

export const AdminProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsAuthenticated(adminApi.isLoggedIn());
    setLoading(false);
  }, []);

  const value = {
    isAuthenticated,
    setIsAuthenticated,
    loading
  };

  return (
    <AdminContext.Provider value={value}>
      {!loading && children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};
