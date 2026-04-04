import React, { useState, useEffect } from 'react';

export default function SplashScreen({ onComplete }) {
  const [isFinishing, setIsFinishing] = useState(false);
  const radius = 140;
  const circumference = 880;

  useEffect(() => {
    // 4s total animation + 0.5s fade out
    const fadeTimer = setTimeout(() => {
      setIsFinishing(true);
    }, 4000);

    const unmountTimer = setTimeout(() => {
      onComplete();
    }, 4500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, [onComplete]);

  return (
    <div className={`apple-splash-wrapper ${isFinishing ? 'splash-fade-out' : ''}`}>

      {/* BACKGROUND IMAGE WRAPPER (Anti-Gravity Scale) */}
      <div className="splash-bg-container">
        {/* BACKGROUND IMAGE */}
        <div 
          className="splash-bg-image" 
          style={{ backgroundImage: "url('/ambulance-bg.jpg')" }} 
        />
        {/* DARK OVERLAY (CINEMATIC) */}
        <div className="splash-bg-dark-overlay" />
        {/* RED NEON COLOR GRADING */}
        <div className="splash-bg-red-grading" />
      </div>

      {/* SVG RING */}
      <svg width="320" height="320" className="splash-svg-ring-perfect">
        {/* Base Circle */}
        <circle
          cx="160"
          cy="160"
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="2"
          fill="transparent"
        />

        {/* Neon Progress Path */}
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

      {/* TITLE */}
      <h1 className="apple-splash-title-large text-white z-10">
        LifeLine AI
      </h1>

      {/* SINGLE LARGE AMBULANCE (Smooth Math Driven) */}
      <div className="splash-smooth-orbit-parent">
        <div className="splash-smooth-orbit-item z-20">
          🚑
        </div>
      </div>

    </div>
  );
}
