import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import PasswordInput from './PasswordInput';

export default function SignIn({ onToggleView, onAuthSuccess }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      const user = JSON.parse(localStorage.getItem('user'));
      onAuthSuccess(user);
    } catch (err) {
      setError(err.message || "Incorrect email or password, try again");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = email && password && !loading;

  return (
    <div className="auth-true-card">
      <div className="auth-logo-top">🚑</div>
      <h1>Sign In</h1>
      <p className="subtitle">Operator Access Required</p>

      <form onSubmit={handleSubmit}>
        <div className="auth-field-group">
          <label htmlFor="email" className="auth-label">Email Address</label>
          <input
            type="email"
            id="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input-true"
            required
            autoComplete="email"
          />
        </div>

        <PasswordInput 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          id="password"
          label="Password"
        />

        <div className="auth-footer-row">
          <label className="auth-checkbox-wrap">
            <input 
              type="checkbox" 
              checked={rememberMe} 
              onChange={() => setRememberMe(!rememberMe)} 
            />
            <span>Remember me</span>
          </label>
          <button type="button" className="auth-link" onClick={() => alert("Simulation: Reset link sent.")}>
            Forgot Password?
          </button>
        </div>

        {error && (
          <div className="auth-error-box">
             <span>⚠️</span> {error}
          </div>
        )}

        <button 
          type="submit" 
          className="auth-button-primary"
          disabled={!isFormValid}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="auth-bottom-text">
        Don't have an account? <button onClick={onToggleView} className="auth-link">Sign Up</button>
      </div>
    </div>
  );
}
