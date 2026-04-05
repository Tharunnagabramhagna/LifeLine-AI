import React, { useState, useEffect, useMemo } from 'react';
import { useTilt } from '../hooks/useTilt';
import { apiRequest } from '../services/api';
import { hasFeature } from '../config/plans';

// Deterministic AI suggestion from request seed
const AI_UNITS = ['A-12', 'A-08', 'A-23', 'A-47', 'A-31', 'A-55'];
const AI_ROUTES = ['Traffic Optimized', 'Highway Fast Lane', 'Back Streets Clear', 'GPS Rerouted'];
const AI_CONFIDENCE = [92, 87, 95, 89, 91, 84];

function getAiSuggestion(requestId) {
  // Handle both string "REQ-123" and numeric 123
  const idStr = String(requestId || '');
  const seed = parseInt(idStr.replace('REQ-', ''), 10) || 0;
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
  PENDING:    { color: '#f59e0b', label: '⏳ PENDING' },
  ASSIGNED:   { color: '#3b82f6', label: '📡 ASSIGNED' },
  'IN TRANSIT': { color: '#8b5cf6', label: '🚑 IN TRANSIT' },
  COMPLETED:  { color: '#22c55e', label: '✅ COMPLETED' },
};

const EventCard = ({ event, userPlan = "free", onAssign }) => {
  const { ref, handleMouseMove, handleMouseLeave } = useTilt();
  
  const severityLower = (event?.severity || 'medium').toLowerCase();
  const createdAt = event?.createdAt || event?.timestamp || new Date().toISOString();
  const timeStr = new Date(createdAt).toLocaleTimeString();

  // Live elapsed timer
  const [elapsed, setElapsed] = useState('00:00');
  
  useEffect(() => {
    if (!createdAt) return;
    const update = () => {
      const startTime = new Date(createdAt).getTime();
      const diffSecs = Math.floor((Date.now() - startTime) / 1000);
      const mins = Math.floor(Math.max(0, diffSecs) / 60).toString().padStart(2, '0');
      const secs = (Math.max(0, diffSecs) % 60).toString().padStart(2, '0');
      setElapsed(`${mins}:${secs}`);
    };
    update();
    const intv = setInterval(update, 1000);
    return () => clearInterval(intv);
  }, [createdAt]);

  const isCritical = event?.severity?.toLowerCase() === 'critical';
  const ai = useMemo(() => getAiSuggestion(event?.id), [event?.id]);
  const statusCfg = STATUS_CONFIG[(event?.status || 'PENDING').toUpperCase()] || STATUS_CONFIG['PENDING'];

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="dashboard-card event-card"
      style={{
        padding: '1.25rem',
        borderLeft: `4px solid ${statusCfg.color}`,
        position: 'relative',
        animation: event?.isNew ? 'slideInPulse 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'none',
        opacity: event?.isNew ? 0 : 1,
        transform: event?.isNew ? 'translateY(-20px)' : 'none',
      }}
    >
      <style>{`
        @keyframes slideInPulse {
          0% { opacity: 0; transform: translateY(-20px) scale(0.98); background-color: rgba(255, 75, 75, 0.2); }
          50% { opacity: 1; transform: translateY(2px) scale(1.02); background-color: rgba(255, 75, 75, 0.1); }
          100% { opacity: 1; transform: translateY(0) scale(1); background-color: transparent; }
        }
      `}</style>
      <div className="floating-inner">
        <div className="event-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div className={`event-badge ${severityLower}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {isCritical && <span className="animate-ping" style={{ width: 6, height: 6, borderRadius: '50%', display: 'inline-block', background: 'var(--accent)' }} />}
              [{event?.severity || 'MEDIUM'}]
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent)' }}>
              ⏱ {elapsed}
            </span>
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px',
              borderRadius: 4, border: `1px solid ${statusCfg.color}`,
              color: statusCfg.color, letterSpacing: '0.04em'
            }}>
              {statusCfg.label}
            </span>
          </div>
          <div className="event-title">{event?.type || 'EMERGENCY'}</div>
        </div>

        <div className="event-body" style={{ marginTop: '8px' }}>
          <div style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>
            📍 {typeof event?.location === 'object' ? event?.location?.name : event?.location || 'Unknown Location'}
          </div>

          <div className="ai-suggestion-box" style={{ 
            background: 'var(--bg-tertiary)', 
            padding: '10px', 
            borderRadius: '8px', 
            marginTop: '10px',
            border: '1px solid var(--border-glow)' 
          }}>
            {hasFeature(userPlan, "ai_dispatch") ? (
              <>
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
              </>
            ) : (
              <div className="locked-message" style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '4px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>🔒</span>
                <span>Upgrade to Pro to unlock AI routing</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
              CREATED: {timeStr}
            </span>
            <div>
              {(event?.status || '').toUpperCase() !== 'COMPLETED' ? (
                <button
                  className="assign-btn"
                  onClick={async () => {
                      if (!event?.id) return;
                      try {
                          await apiRequest(`/complete/${event.id}`, { method: 'POST' });
                      } catch (e) {
                          alert(e.message);
                      }
                  }}
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
                >
                  🏁 FINISH TRIP
                </button>
              ) : (
                <span style={{
                  fontSize: '0.75rem', 
                  fontWeight: 800,
                  color: 'var(--accent-green)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  ✓ Mission Completed
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
