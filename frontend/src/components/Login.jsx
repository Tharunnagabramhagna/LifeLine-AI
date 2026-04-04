import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    // Simulate cinematic delay for "authentication"
    setTimeout(() => {
      setIsSubmitting(false);
      onLogin(email);
    }, 1200);
  };

  return (
    <div className="login-root">
      {/* Background cinematic overlay */}
      <div className="login-bg-overlay" />
      
      <div className="login-card glass-panel">
        {/* Glitter Effect */}
        <div className="glass-shimmer"></div>
        
        <div className="login-header">
          <div className="login-logo">🚑</div>
          <h1 className="login-title">LifeLine AI</h1>
          <p className="login-subtitle">Emergency Response Command</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">System Access Email</label>
            <input
              type="email"
              id="email"
              placeholder="operator@lifeline.ai"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <div className="input-glow"></div>
          </div>

          <button 
            type="submit" 
            className={`login-btn ${isSubmitting ? 'loading' : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="btn-content">
                <span className="btn-spinner"></span>
                Authenticating...
              </span>
            ) : (
              <span className="btn-content">Enter Terminal</span>
            )}
          </button>
        </form>

        <div className="login-footer">
          <span className="security-badge">🔒 Encrypted Connection</span>
          <span className="version-mark">v2.4.0</span>
        </div>
      </div>
    </div>
  );
}
