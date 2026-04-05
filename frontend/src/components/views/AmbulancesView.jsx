import React, { useState, useEffect } from 'react';
import { getAmbulances } from '../../services/api';

const FUEL = [95, 72, 88, 61, 79, 54, 90, 67];

export default function AmbulancesView() {
  const [fleet, setFleet] = useState([]);
  useEffect(() => {
    getAmbulances().then(setFleet).catch(console.error);
  }, []);
  
  const busyCount = fleet.filter(u => u.status !== 'AVAILABLE' && u.status !== 'IDLE').length;

  return (
    <div className="view-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
        <div>
          <h2 className="view-header" style={{ marginBottom: 0 }}>Fleet Command</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', fontFamily: 'monospace', marginTop: 2 }}>
            {fleet.length - busyCount} available · {busyCount} deployed
          </p>
        </div>
        <span style={{ color: 'var(--accent)', fontFamily: 'monospace', fontSize: '0.85rem' }} className="animate-pulse">
          ● TRACKING
        </span>
      </div>

      <div className="grid-responsive">
        {fleet.map((unit, index) => {
          const isBusy = (unit.status !== 'AVAILABLE' && unit.status !== 'IDLE');
          const fuel = FUEL[index % FUEL.length];

          return (
            <div key={unit.id} className="floating-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ flex: 1, paddingRight: '1rem' }}>
                  {/* Unit name */}
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                    {unit.name}
                  </h3>
                  {/* Vehicle number */}
                  <p style={{ color: 'var(--accent)', fontFamily: 'monospace', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                    {unit.id} · {unit.number}
                  </p>
                  {/* Live status badge */}
                  <span style={{
                    display: 'inline-block',
                    fontSize: '0.7rem', fontWeight: 700,
                    padding: '3px 8px', borderRadius: 4,
                    background: isBusy ? 'rgba(255,75,75,0.12)' : 'rgba(34,197,94,0.12)',
                    color: isBusy ? 'var(--accent)' : 'var(--accent-green)',
                    border: `1px solid ${isBusy ? 'var(--accent)' : 'var(--accent-green)'}`,
                    transition: 'all 0.4s ease',
                    letterSpacing: '0.06em'
                  }}>
                    {isBusy ? '🔴 BUSY' : '🟢 AVAILABLE'}
                  </span>
                </div>

                {/* Ambulance icon with ripple */}
                <div className="icon-ripple-wrapper">
                  <div className="ripple-ring ring-1" />
                  <div className="ripple-ring ring-2" />
                  <div className="ripple-ring ring-3" />
                  <div className="icon-float">🚑</div>
                </div>
              </div>

              {/* Fuel bar */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                  <span>Fuel</span>
                  <span style={{ color: 'var(--text-primary)' }}>{fuel}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${fuel}%`,
                    background: fuel > 40 ? 'var(--accent-red)' : '#f59e0b',
                    borderRadius: 999,
                    boxShadow: '0 0 8px rgba(255,45,45,0.6)',
                    transition: 'width 0.8s ease',
                  }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
