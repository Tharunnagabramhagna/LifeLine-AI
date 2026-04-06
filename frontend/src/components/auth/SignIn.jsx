import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PasswordInput from './PasswordInput';

export default function SignIn({ onToggleView, onAuthSuccess }) {
  const { login } = useAuth();
  const navigate = useNavigate();
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
      // Fallback for legacy onAuthSuccess prop
      if (onAuthSuccess) {
        const user = JSON.parse(localStorage.getItem('user'));
        onAuthSuccess(user);
      }
      navigate('/dashboard');
    } catch (err) {
      setError("Incorrect password, try again");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = email && password && !loading;

  return (
    <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl w-full max-w-md">
      <div className="auth-logo-top text-red-500 text-4xl mb-4 text-center">🚑</div>
      <h1 className="text-2xl font-bold text-white text-center">Sign In</h1>
      <p className="subtitle text-gray-400 text-center mb-6">Operator Access Required</p>

      <form onSubmit={handleSubmit}>
        <div className="auth-field-group mb-4">
          <label htmlFor="email" className="auth-label block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
          <input
            type="email"
            id="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg bg-black/40 border border-gray-600 text-white focus:border-red-500 outline-none transition-all"
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
          className="w-full p-3 rounded-lg bg-black/40 border border-gray-600 text-white"
        />

        <div className="auth-footer-row flex justify-between items-center mb-6 text-sm">
          <label className="auth-checkbox-wrap flex items-center gap-2 text-gray-400 cursor-pointer">
            <input 
              type="checkbox" 
              checked={rememberMe} 
              onChange={() => setRememberMe(!rememberMe)} 
              className="accent-red-500"
            />
            <span>Remember me</span>
          </label>
          <button type="button" className="text-red-500 hover:underline" onClick={() => alert("Simulation: Reset link sent.")}>
            Forgot Password?
          </button>
        </div>

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
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="auth-bottom-text text-center mt-6 text-gray-400">
        Don't have an account? <button onClick={onToggleView} className="text-red-500 hover:underline">Sign Up</button>
      </div>
    </div>
  );
}
