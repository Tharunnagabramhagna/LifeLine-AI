import React, { useState, useEffect } from 'react';

export default function AuthPage({ onAuthSuccess, theme, onToggleTheme }) {
  const [isSignIn, setIsSignIn] = useState(true);
  const [formData, setFormData] = useState({ 
    name: '',
    email: '', 
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (isSignIn) {
      if (!formData.email || !formData.password) {
        setError('Credentials required for system access.');
        return;
      }
    } else {
      if (!formData.name || !formData.email || !formData.password) {
        setError('All fields are required for registration.');
        return;
      }
    }

    onAuthSuccess({
      name: formData.name || "Operator",
      email: formData.email,
      role: "Dispatcher"
    });
  };

  return (
    <div className="auth-root">
      <div className="auth-bg-ambient"></div>
      
      <button className="auth-theme-toggle" onClick={onToggleTheme} title="Toggle System Theme">
        {theme === 'dark' ? '🌙' : '☀️'}
      </button>

      <div className="auth-panel-container">
        <div className="floating-card auth-panel cinematic-shimmer">
          <div className="auth-header">
            <div className="auth-logo">🚑</div>
            <h1 className="auth-title">LifeLine AI</h1>
            <p className="auth-subtitle">Emergency Dispatch Protocol</p>
            <p className="auth-meta-text">Secure Operator Terminal v3.2.0</p>
          </div>

          <div className="auth-tabs">
            <div className={`tab-indicator ${!isSignIn ? 'right' : ''}`}></div>
            <button 
              className={`auth-tab ${isSignIn ? 'active' : ''}`}
              onClick={() => setIsSignIn(true)}
            >
              OPERATOR SIGN IN
            </button>
            <button 
              className={`auth-tab ${!isSignIn ? 'active' : ''}`}
              onClick={() => setIsSignIn(false)}
            >
              NEW REGISTRATION
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {!isSignIn && (
              <div className="input-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
            )}

            <div className="input-group">
              <label htmlFor="email">Operator Email</label>
              <input
                type="email"
                id="email"
                placeholder="operator@lifeline.ai"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Access Key</label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>

            {error && <div className="auth-message error">{error}</div>}

            <button type="submit" className="auth-submit-btn anti-gravity-btn">
              {isSignIn ? 'INITIALIZE SESSION' : 'REGISTER TERMINAL'}
            </button>
          </form>

          <div className="auth-footer">
            <span style={{ fontSize: '0.65rem' }}>🔐 End-to-End Encrypted</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--accent)' }}>System Status: Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
