import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, fallback }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-root">
        <div className="auth-bg-ambient"></div>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return fallback;
  }

  return children;
}
