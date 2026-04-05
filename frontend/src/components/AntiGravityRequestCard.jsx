import React from 'react';
import { useTilt } from '../hooks/useTilt';

/**
 * AntiGravityRequestCard
 * 
 * Example component demonstrating the anti-gravity UI effect.
 * Uses the custom useTilt hook for 60fps 3D transforms and parallax content shifting.
 */
const AntiGravityRequestCard = ({ 
  title = "Emergency Extraction",
  urgency = "CRITICAL",
  location = "Sector 7G",
  time = "02:45 AM",
  onClick 
}) => {
  // Initialize the tilt hook with custom configuration for tactical feel
  const { ref, handleMouseMove, handleMouseEnter, handleMouseLeave } = useTilt({
    maxTilt: 10,     // Slight tilt rotation
    scale: 1.02,     // Subtle lift scale
    maxShift: 4      // Subtle inner depth parallax shift
  });

  return (
    <div 
      ref={ref}
      className="ag-card"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ 
        width: '100%', 
        maxWidth: '380px', 
        padding: '20px', 
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      {/* ag-content-shift applies the parallax illusion to the inner content relative to the deep background */}
      <div className="ag-content-shift" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ 
            fontSize: '0.75rem', 
            fontWeight: 'bold', 
            letterSpacing: '0.1em',
            color: urgency === 'CRITICAL' ? '#ff2d2d' : '#2ecc71',
            backgroundColor: urgency === 'CRITICAL' ? 'rgba(255, 45, 45, 0.1)' : 'rgba(46, 204, 113, 0.1)',
            padding: '4px 8px',
            borderRadius: '4px',
            textTransform: 'uppercase'
          }}>
            {urgency}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', fontFamily: 'monospace' }}>
            {time}
          </span>
        </div>

        {/* Title & Body */}
        <div>
          <h3 style={{ 
            margin: '8px 0 4px 0', 
            color: '#ffffff', 
            fontSize: '1.1rem',
            fontWeight: '600',
            letterSpacing: '0.02em'
          }}>
            {title}
          </h3>
          <p style={{ 
            margin: 0, 
            color: 'rgba(255, 255, 255, 0.6)', 
            fontSize: '0.85rem' 
          }}>
            Location: <span style={{ color: '#ffffff' }}>{location}</span>
          </p>
        </div>

        {/* Footer actions or decorative tech lines */}
        <div style={{ 
          marginTop: '12px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
          paddingTop: '12px' 
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff2d2d', boxShadow: '0 0 8px rgba(255, 45, 45, 0.8)' }}></div>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Awaiting Dispatch
          </span>
        </div>

      </div>
    </div>
  );
};

export default AntiGravityRequestCard;
