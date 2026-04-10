import React, { useEffect } from 'react';
import bgImage from '../assets/bg-red-glass.png';

// Accepts either onComplete or onFinish (both supported for compatibility)
export default function SplashScreen({ onComplete, onFinish }) {
  const advance = onComplete || onFinish;

  const radius = 140;
  const circumference = 2 * Math.PI * radius; // ~879.6

  useEffect(() => {
    if (!advance) return;
    const timer = setTimeout(() => {
      advance();
    }, 2800); // animation duration

    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="flex items-center justify-center min-h-screen animate-fadeIn"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        zIndex: 9999,
      }}
    >
      {/* Dark cinematic overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(2px)',
      }} />

      {/* SVG neon ring */}
      <svg
        width="320"
        height="320"
        className="splash-svg-ring-perfect"
        style={{ position: 'absolute' }}
      >
        {/* Track circle */}
        <circle
          cx="160"
          cy="160"
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="2"
          fill="transparent"
        />
        {/* Progress arc — animates via CSS */}
        <circle
          className="splash-neon-path-sync"
          cx="160"
          cy="160"
          r={radius}
          stroke="#ff2d2d"
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          strokeLinecap="round"
        />
      </svg>

      {/* Orbiting ambulance */}
      <div className="splash-smooth-orbit-parent" style={{ position: 'absolute' }}>
        <div className="splash-smooth-orbit-item" style={{ fontSize: '2rem', zIndex: 20 }}>
          🚑
        </div>
      </div>

      {/* Title */}
      <h1
        className="apple-splash-title-large"
        style={{
          position: 'relative',
          zIndex: 10,
          color: 'white',
          textShadow: '0 0 30px rgba(255,45,45,0.6)',
        }}
      >
        LifeLine AI
      </h1>
    </div>
  );
}
