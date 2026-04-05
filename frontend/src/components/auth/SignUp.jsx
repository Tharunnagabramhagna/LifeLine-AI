import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import PasswordInput from './PasswordInput';

export default function SignUp({ onToggleView, onAuthSuccess }) {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.id]: e.target.value });

  const isPasswordStrong = formData.password.length >= 6;
  const isMatch = formData.password === formData.confirmPassword;
  const isFormValid = formData.name && formData.email && isPasswordStrong && isMatch && !loading;

  const BASE_URL = "http://localhost:5005/api";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setLoading(true);
    setError('');

    try {
      const { name, email, password } = formData;
      const res = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("RAW RESPONSE:", text);
        throw new Error("Server returned HTML instead of JSON. Check API URL.");
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || "Registration failed");
      }

      alert("Signup successful!");
      
      // Attempt login immediately
      try {
        await login(email, password);
        const user = JSON.parse(localStorage.getItem('user'));
        onAuthSuccess(user);
      } catch (loginErr) {
        // Fallback toggle back to signin view if auto-login fails
        onToggleView();
      }

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-true-card">
      <div className="auth-logo-top">🚑</div>
      <h1>Sign Up</h1>
      <p className="subtitle">New Operator Registration</p>

      <form onSubmit={handleSubmit}>
        <div className="auth-field-group">
          <label htmlFor="name" className="auth-label">Full Name</label>
          <input
            type="text"
            id="name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleChange}
            className="auth-input-true"
            required
            autoComplete="name"
          />
        </div>

        <div className="auth-field-group">
          <label htmlFor="email" className="auth-label">Email Address</label>
          <input
            type="email"
            id="email"
            placeholder="Enter your email address"
            value={formData.email}
            onChange={handleChange}
            className="auth-input-true"
            required
            autoComplete="email"
          />
        </div>

        <PasswordInput 
          value={formData.password}
          onChange={handleChange}
          placeholder="At least 6 characters"
          id="password"
          label="Password"
        />
        {!isPasswordStrong && formData.password.length > 0 && (
          <div style={{ color: '#ff4d4d', fontSize: '12px', marginTop: '-14px', marginBottom: '14px' }}>
            At least 6 characters
          </div>
        )}

        <PasswordInput 
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Repeat your password"
          id="confirmPassword"
          label="Confirm Password"
        />
        {!isMatch && formData.confirmPassword.length > 0 && (
          <div style={{ color: '#ff4d4d', fontSize: '12px', marginTop: '-14px', marginBottom: '14px' }}>
            Passwords do not match
          </div>
        )}

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
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="auth-bottom-text">
        Already have an account? <button onClick={onToggleView} className="auth-link">Sign In</button>
      </div>
    </div>
  );
}
