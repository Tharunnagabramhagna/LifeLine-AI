import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PasswordInput from './PasswordInput';

export default function SignUp({ onToggleView, onAuthSuccess }) {
  const { login } = useAuth();
  const navigate = useNavigate();
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

  const BASE_URL = "http://localhost:5000/api";

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

      // Attempt login immediately
      try {
        await login(email, password);
        if (onAuthSuccess) {
          const user = JSON.parse(localStorage.getItem('user'));
          onAuthSuccess(user);
        }
        navigate('/dashboard');
      } catch (loginErr) {
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
    <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl w-full max-w-md">
      <div className="auth-logo-top text-red-500 text-4xl mb-4 text-center">🚑</div>
      <h1 className="text-2xl font-bold text-white text-center">Sign Up</h1>
      <p className="subtitle text-gray-400 text-center mb-6">New Operator Registration</p>

      <form onSubmit={handleSubmit}>
        <div className="auth-field-group mb-4">
          <label htmlFor="name" className="auth-label block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
          <input
            type="text"
            id="name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-black/40 border border-gray-600 text-white focus:border-red-500 outline-none transition-all"
            required
            autoComplete="name"
          />
        </div>

        <div className="auth-field-group mb-4">
          <label htmlFor="email" className="auth-label block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
          <input
            type="email"
            id="email"
            placeholder="Enter your email address"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-black/40 border border-gray-600 text-white focus:border-red-500 outline-none transition-all"
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
          className="w-full p-3 rounded-lg bg-black/40 border border-gray-600 text-white"
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
          className="w-full p-3 rounded-lg bg-black/40 border border-gray-600 text-white"
        />
        {!isMatch && formData.confirmPassword.length > 0 && (
          <div style={{ color: '#ff4d4d', fontSize: '12px', marginTop: '-14px', marginBottom: '14px' }}>
            Passwords do not match
          </div>
        )}

        {error && (
          <div className="auth-error-box bg-red-500/20 border border-red-500/50 p-3 rounded-lg text-red-500 text-sm mb-4 flex items-center gap-2">
             <span>⚠️</span> {error}
          </div>
        )}

        <button 
          type="submit" 
          className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!isFormValid}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="auth-bottom-text text-center mt-6 text-gray-400">
        Already have an account? <button onClick={onToggleView} className="text-red-500 hover:underline">Sign In</button>
      </div>
    </div>
  );
}
