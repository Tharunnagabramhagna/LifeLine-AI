import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiRequest } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          // In a real app, you might want to verify the token with the backend here
          // For now, we trust the local storage if it exists
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error("Session restoration failed", e);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleSessionExpired = () => {
      setUser(null);
      // localStorage is already cleared directly in api.js
    };

    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await apiRequest('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      const userData = {
        email: res.user.email,
        name: res.user.name || "Operator",
        role: "Dispatcher",
        plan: res.user.plan || 'FREE',
        simulation_count: res.user.simulation_count || 0
      };
      
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;

    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const signup = async (name, email, password) => {
    setError(null);
    try {
      console.log("Signup Payload:", { name, email, password });
      await apiRequest('/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      // Auto-login after signup
      return await login(email, password);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, signup, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
