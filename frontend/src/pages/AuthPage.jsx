import React, { useState } from 'react';
import SignIn from '../components/auth/SignIn';
import SignUp from '../components/auth/SignUp';
import { useTheme } from '../context/ThemeContext';

// onAuthSuccess is called after successful login/register
// — received from AppRoot to advance stage to "dashboard"
export default function AuthPage({ onAuthSuccess }) {
  const [isSignIn, setIsSignIn] = useState(true);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="auth-container">
      <div className="glass-card">
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

      {/* Theme toggle — positioned top-right */}
      <button
        id="theme-toggle-btn"
        className="auth-theme-toggle"
        onClick={toggleTheme}
        title="Toggle System Theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* System status footer */}
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        width: '100%',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.35)',
        fontSize: '0.7rem',
        letterSpacing: '0.12em',
        fontFamily: 'monospace',
        textTransform: 'uppercase',
        pointerEvents: 'none',
      }}>
        TERMINAL SECURE | VERSION 3.2.0 | SYSTEM ONLINE
      </div>
    </div>
  );
}
