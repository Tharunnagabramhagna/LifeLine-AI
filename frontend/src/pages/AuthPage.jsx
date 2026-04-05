import React, { useState } from 'react';
import SignIn from '../components/auth/SignIn';
import SignUp from '../components/auth/SignUp';

export default function AuthPage({ onAuthSuccess, theme, onToggleTheme }) {
  const [isSignIn, setIsSignIn] = useState(true);

  return (
    <div className="auth-root" style={{
      backgroundImage: 'url("/auth-bg.png")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative',
      height: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      {/* Ambient Overlay - Lighter to ensure true glass refraction works */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(4px)',
        zIndex: 0
      }} />

      {/* Auth Container */}
      <div className="auth-panel-container" style={{ position: 'relative', zIndex: 10 }}>
        {isSignIn ? (
          <SignIn 
            onToggleView={() => setIsSignIn(false)} 
            onAuthSuccess={onAuthSuccess} 
          />
        ) : (
          <SignUp 
            onToggleView={() => setIsSignIn(true)} 
            onAuthSuccess={onAuthSuccess} 
          />
        )}
      </div>

      {/* Theme Toggle Button (Maintain existing style) */}
      <button className="auth-theme-toggle" onClick={onToggleTheme} title="Toggle System Theme">
        {theme === 'dark' ? '🌙' : '☀️'}
      </button>

      {/* Floating System Info Footer */}
      <div className="auth-footer-overlay" style={{
        position: 'absolute',
        bottom: '2rem',
        width: '100%',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: '0.75rem',
        letterSpacing: '0.1em'
      }}>
        TERMINAL SECURE | VERSION 3.2.0 | SYSTEM ONLINE
      </div>
    </div>
  );
}
