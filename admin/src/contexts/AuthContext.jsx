import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('admin_token'));

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data;
      
      // Only allow admin and staff
      if (userData.role !== 'admin' && userData.role !== 'staff') {
        toast.error('Access denied. Admin/Staff only.');
        logout();
        return;
      }
      
      setUser(userData);
    } catch (error) {
      console.error('Fetch user error:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      // Only allow admin and staff
      if (user.role !== 'admin' && user.role !== 'staff') {
        toast.error('Access denied. Admin/Staff only.');
        throw new Error('Unauthorized access');
      }
      
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_user', JSON.stringify(user));
      setToken(token);
      setUser(user);
      
      toast.success(`Welcome back, ${user.full_name}!`);
      return user;
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'staff',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
