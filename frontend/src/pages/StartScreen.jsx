import React from 'react';

// onStart is called by AppRoot to advance to the "intro" stage.
// No react-router or useAuth dependency needed here.
export default function StartScreen({ onStart }) {
  return (
    <div className="auth-container">
      <div className="glass-card" style={{ textAlign: 'center' }}>

        {/* Animated ambulance icon */}
        <div style={{ fontSize: '3.5rem', marginBottom: '1.25rem', display: 'inline-block', animation: 'floatAntiGravity 3s ease-in-out infinite' }}>
          🚑
        </div>

        <h1 style={{ fontSize: '2.4rem', fontWeight: 700, marginBottom: '6px', letterSpacing: '-0.02em' }}>
          LifeLine <span style={{ color: '#ff3b3b' }}>AI</span>
        </h1>

        <p className="subtitle">
          Emergency Response System
        </p>

        {/* Primary CTA — triggers stage transition to "intro" */}
        <button
          id="start-simulation-btn"
          type="submit"
          onClick={onStart}
          style={{ marginTop: '1.5rem', width: '100%' }}
        >
          ▶ &nbsp; Start Simulation
        </button>

        {/* Footer badge */}
        <div style={{
          marginTop: '1.75rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontSize: '0.65rem',
          letterSpacing: '0.18em',
          color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase',
          fontFamily: 'monospace',
        }}>
          SYSTEM ONLINE // SECURE ACCESS GRANTED
        </div>

      </div>
    </div>
  );
}
