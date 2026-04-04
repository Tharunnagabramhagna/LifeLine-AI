import React, { useState, useEffect, useMemo } from 'react';
import { useTilt } from '../hooks/useTilt';

// Deterministic AI suggestion from request seed
const AI_UNITS = ['A-12', 'A-08', 'A-23', 'A-47', 'A-31', 'A-55'];
const AI_ROUTES = ['Traffic Optimized', 'Highway Fast Lane', 'Back Streets Clear', 'GPS Rerouted'];
const AI_CONFIDENCE = [92, 87, 95, 89, 91, 84];

function getAiSuggestion(requestId) {
  const seed = parseInt(requestId.replace('REQ-', ''), 10) || 0;
  const unitIdx = seed % AI_UNITS.length;
  const routeIdx = seed % AI_ROUTES.length;
  const confIdx = seed % AI_CONFIDENCE.length;
  return {
    unit: AI_UNITS[unitIdx],
    route: AI_ROUTES[routeIdx],
    confidence: AI_CONFIDENCE[confIdx],
  };
}

const STATUS_CONFIG = {
  Pending:    { color: '#f59e0b', label: '⏳ PENDING' },
  Assigned:   { color: '#3b82f6', label: '📡 ASSIGNED' },
  'In Transit': { color: '#8b5cf6', label: '🚑 IN TRANSIT' },
  Completed:  { color: '#22c55e', label: '✅ COMPLETED' },
};

const EventCard = ({ event, onAssign }) => {
  const { ref, handleMouseMove, handleMouseLeave } = useTilt();
  const severityLower = event.severity.toLowerCase();
  const timeStr = new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Live elapsed timer
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    const update = () => {
      const diffSecs = Math.floor((Date.now() - event.createdAt) / 1000);
      const mins = Math.floor(diffSecs / 60).toString().padStart(2, '0');
      const secs = (diffSecs % 60).toString().padStart(2, '0');
      setElapsed(`${mins}:${secs}`);
    };
    update();
    const intv = setInterval(update, 1000);
    return () => clearInterval(intv);
  }, [event.createdAt]);

  const isCritical = event.severity === 'Critical';
  const ai = useMemo(() => getAiSuggestion(event.id), [event.id]);
  const statusCfg = STATUS_CONFIG[event.status] || STATUS_CONFIG['Pending'];

  return (
    <div
      ref={ref}
      className={`floating-card event-card ${severityLower} ${isCritical ? 'critical-pulse' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ opacity: event.status === 'Completed' ? 0.5 : 1, transition: 'opacity 0.6s ease' }}
    >
      <div className="floating-inner">
        {/* ── HEADER ROW ── */}
        <div className="event-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div className={`event-badge ${severityLower}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {isCritical && <span className="animate-ping" style={{ width: 6, height: 6, borderRadius: '50%', display: 'inline-block', background: 'var(--accent)' }} />}
              [{event.severity}]
            </div>
            {/* Live timer */}
            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent)' }}>
              ⏱ {elapsed}
            </span>
            {/* Status badge */}
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px',
              borderRadius: 4, border: `1px solid ${statusCfg.color}`,
              color: statusCfg.color, letterSpacing: '0.04em'
            }}>
              {statusCfg.label}
            </span>
          </div>
          <div className="event-title">{event.type}</div>
        </div>

        {/* ── BODY ── */}
        <div className="event-body" style={{ marginTop: '8px' }}>
          <div style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>📍 {event.location}</div>

          {/* AI Suggestion */}
          <div className="ai-suggestion-box" style={{ 
            background: 'var(--bg-tertiary)', 
            padding: '10px', 
            borderRadius: '8px', 
            marginTop: '10px',
            border: '1px solid var(--border-glow)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '1.1rem' }}>🤖</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)' }}>AI SUGGESTION</span>
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Ambulance {ai.unit} ({ai.confidence}% match)
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Route: {ai.route}
            </div>
          </div>

          {/* Footer row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
              CREATED: {timeStr}
            </span>
            <div>
              {event.status === 'Pending' ? (
                <button
                  className="assign-btn"
                  onClick={() => onAssign && onAssign(event.id)}
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(255, 75, 75, 0.3)'
                  }}
                  onMouseOver={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 16px rgba(255, 75, 75, 0.4)'; }}
                  onMouseOut={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 12px rgba(255, 75, 75, 0.3)'; }}
                >
                  ASSIGN AMBULANCE
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '0.75rem', 
                    fontWeight: 800,
                    color: event.status === 'Completed' ? 'var(--accent-green)' : 'var(--accent-blue)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {event.status === 'Completed' ? '✓ Mission Completed' : `🚑 UNIT ${event.assignedUnit}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
