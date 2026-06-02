import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const { data } = await authAPI.getMe();
          setUser(data);
        } catch {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const { data } = await authAPI.login({ email, password });
      localStorage.setItem('token', data.token);
      setToken(data.token);
      const { data: userData } = await authAPI.getMe();
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message || 'Login failed' };
    }
  };

  const register = async (firstName, lastName, email, password) => {
    try {
      const { data } = await authAPI.register({ firstName, lastName, email, password });
      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (userData) => setUser(userData);
  const hasRole = (role) => user?.role === role;
  const hasPermission = (permission) => user?.permissions?.includes(permission) || user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        hasRole,
        hasPermission,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
