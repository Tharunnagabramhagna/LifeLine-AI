import React from 'react';

export default function Landing({ onStart }) {
  return (
    <div className="landing-root">
      {/* Background Image */}
      <div className="landing-bg-image" />
      
      {/* Dark Overlay + Red Grading */}
      <div className="landing-bg-dark-overlay" />
      <div className="landing-bg-red-grading" />
      
      {/* Floating Wave Effect (Simulation Style) */}
      <div className="landing-wave-effect" />
      
      {/* Content */}
      <div className="landing-content z-10 px-6 text-center">
        {/* ICON */}
        <div className="landing-icon text-red-500 mb-4 text-6xl">
          🚑
        </div>
        
        {/* TITLE */}
        <h1 className="landing-title mb-4 font-bold tracking-tight text-5xl md:text-6xl">
          LifeLine AI
        </h1>
        
        {/* TAGLINE */}
        <p className="landing-tagline text-lg text-gray-300 mb-4">
          Saving lives by clearing the path intelligently
        </p>
        
        {/* DESCRIPTION */}
        <p className="landing-desc text-gray-400 max-w-xl mx-auto mb-8">
          AI-powered emergency ambulance optimization system that ensures every second counts
        </p>
        
        {/* BUTTON */}
        <button className="landing-btn" onClick={onStart}>
          ⚡ Start Simulation
        </button>
      </div>
    </div>
  );
}
