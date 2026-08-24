import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Load user on initialization if token exists
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {}
      }

      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        } catch (error) {
          console.error('Failed to fetch current user session:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier, password) => {
    try {
      const res = await api.post('/auth/login', { identifier, password });
      if (res.data.success) {
        const { token: newToken, user: userData } = res.data;
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        return { success: true, user: userData };
      }
    } catch (error) {
      console.error('Login error:', error);
      const message =
        error.response?.data?.message ||
        (error.message === 'Network Error'
          ? 'Network Error: Cannot connect to backend server. Please ensure the backend is running.'
          : error.message || 'Login failed. Please check credentials.');
      return { success: false, error: message };
    }
  };

  const registerStudent = async (formData) => {
    try {
      const res = await api.post('/auth/register-student', formData);
      if (res.data.success) {
        const { token: newToken, user: userData } = res.data;
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        return { success: true, user: userData };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please check inputs.';
      return { success: false, error: message };
    }
  };

  const registerFaculty = async (formData) => {
    try {
      const res = await api.post('/auth/register-faculty', formData);
      if (res.data.success) {
        const { token: newToken, user: userData } = res.data;
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        return { success: true, user: userData };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Faculty registration failed. Please check inputs.';
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  const updateUser = (updatedUser) => {
    setUser((prev) => {
      const merged = { ...(prev || {}), ...updatedUser };
      try {
        localStorage.setItem('user', JSON.stringify(merged));
      } catch (err) {
        console.error('Failed to save user to localStorage:', err);
      }
      return merged;
    });
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        registerStudent,
        registerFaculty,
        logout,
        updateUser,
        refreshUser,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        isFaculty: user?.role === 'FACULTY',
        isStudent: user?.role === 'STUDENT',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
