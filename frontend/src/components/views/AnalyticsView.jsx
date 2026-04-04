import React from 'react';
import { useTilt } from '../../hooks/useTilt';
import { useLiveRequests } from '../../hooks/useLiveRequests';

// MATH COMPONENT: SVG Polyline Generator
const MathGraph = ({ generatePoint, xMax = 10, yMax = 20, width = 400, height = 150, gradientId = "grad" }) => {
  const points = [];
  for (let x = 0; x <= xMax; x += 0.5) {
    const y = generatePoint(x);
    // Map to SVG coordinates
    const svgX = (x / xMax) * width;
    const svgY = height - (y / yMax) * height;
    points.push(`${svgX},${Math.max(0, Math.min(height, svgY))}`);
  }
  const pathD = `M ${points.join(' L ')}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full px-4 overflow-visible drop-shadow-[0_0_8px_rgba(255,45,45,0.8)] relative">
      <polyline fill="none" stroke="var(--accent)" strokeWidth="3" points={points.join(' L ')} />
      <path
        d={`${pathD} L ${width} ${height} L 0 ${height} Z`}
        fill={`url(#${gradientId})`}
        opacity="0.3"
      />
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default function AnalyticsView() {
  const { ref: ref1, handleMouseMove: hr1, handleMouseLeave: hl1 } = useTilt();
  const { ref: ref2, handleMouseMove: hr2, handleMouseLeave: hl2 } = useTilt();
  const { ref: ref3, handleMouseMove: hr3, handleMouseLeave: hl3 } = useTilt();
  const { ref: ref4, handleMouseMove: hr4, handleMouseLeave: hl4 } = useTilt();

  // Active Requests from Live System
  const { requests } = useLiveRequests();
  const activeRequests = requests.filter(r => r.status !== 'Completed').length;
  const TOTAL_AMBULANCES = 10;
  const utilization = Math.min(100, Math.round((activeRequests / TOTAL_AMBULANCES) * 100));

  // Functions
  const trendFunction = (x) => 6 + 3 * Math.sin(x / 2);
  const responseFunction = (x) => 20 * Math.exp(-0.25 * x);

  // Distribution Ratios
  const distribution = [
    { label: 'Accident', percent: 40 },
    { label: 'Cardiac', percent: 25 },
    { label: 'Fire', percent: 20 },
    { label: 'Other', percent: 15 }
  ];

  return (
    <div className="view-container">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="view-header mb-0">System Intelligence</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontFamily: 'monospace' }}>Neural Network Dispatch Analytics</p>
        </div>
        <span className="font-mono tracking-widest text-sm animate-pulse" style={{ color: 'var(--accent)' }}>● LIVE COMPUTATION</span>
      </div>

      <div className="analytics-container">
        {/* TOP — KPI CARDS */}
        <div className="analytics-kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="floating-card flex flex-col p-6 justify-center items-center">
            <span className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>Avg Response</span>
            <span className="text-3xl font-bold font-mono" style={{ color: 'var(--accent)' }}>4.2m</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--accent-green)', marginTop: '4px' }}>↓ 12% vs last hour</span>
          </div>
          <div className="floating-card flex flex-col p-6 justify-center items-center">
            <span className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>Active Requests</span>
            <span className="text-3xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{activeRequests}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '4px' }}>Live system load</span>
          </div>
          <div className="floating-card flex flex-col p-6 justify-center items-center">
            <span className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>Fleet Utilization</span>
            <span className="text-3xl font-bold font-mono" style={{ color: 'var(--accent)' }}>{utilization}%</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '4px' }}>{activeRequests} / {TOTAL_AMBULANCES} Units Busy</span>
          </div>
        </div>

        {/* BOTTOM — GRAPHS */}
        <div className="analytics-graphs" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
          {/* Trend Graph */}
          <div ref={ref1} onMouseMove={hr1} onMouseLeave={hl1} className="floating-card flex flex-col relative overflow-hidden" style={{ minHeight: '220px' }}>
            <h3 className="text-sm font-mono mb-4 uppercase" style={{ color: 'var(--text-secondary)' }}>Requests Over Time</h3>
            <div className="flex-1 min-h-[140px] relative">
               <MathGraph generatePoint={trendFunction} xMax={10} yMax={15} gradientId="trendGrad" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                <span>00:00</span>
                <span>04:00</span>
                <span>08:00</span>
                <span>12:00</span>
                <span>16:00</span>
                <span>20:00</span>
            </div>
          </div>

          {/* Exponential Response Time Graph */}
          <div ref={ref2} onMouseMove={hr2} onMouseLeave={hl2} className="floating-card flex flex-col relative overflow-hidden" style={{ minHeight: '220px' }}>
            <h3 className="text-sm font-mono mb-4 uppercase" style={{ color: 'var(--text-secondary)' }}>Response Efficiency</h3>
            <div className="flex-1 min-h-[140px] relative">
               <MathGraph generatePoint={responseFunction} xMax={10} yMax={25} gradientId="respGrad" />
            </div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '10px' }}>Exponential decay of wait-time after dispatch.</p>
          </div>

          {/* Emergency Distribution Chart */}
          <div ref={ref3} onMouseMove={hr3} onMouseLeave={hl3} className="floating-card flex flex-col" style={{ minHeight: '220px' }}>
            <p className="text-sm font-mono tracking-widest uppercase mb-4" style={{ color: 'var(--text-secondary)' }}>Emergency Distribution</p>
            <div className="flex items-end justify-around w-full flex-1">
              {distribution.map((type, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 w-full">
                  <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>{type.percent}%</span>
                  <div className="w-8 rounded-t-sm" style={{ 
                    height: `${type.percent * 1.5}px`, 
                    background: 'var(--accent)', 
                    boxShadow: '0 0 10px rgba(255, 75, 75, 0.4)',
                    transition: 'height 1s ease-out'
                  }}></div>
                  <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-primary)', textAlign: 'center' }}>{type.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Utilization Bar */}
          <div ref={ref4} onMouseMove={hr4} onMouseLeave={hl4} className="floating-card flex flex-col justify-center" style={{ minHeight: '220px' }}>
             <div className="flex justify-between items-center mb-6">
               <p className="text-sm font-mono tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>System Load Factor</p>
               <p className="text-3xl font-bold font-mono drop-shadow-[0_0_10px_rgba(255,45,45,0.4)]" style={{ color: 'var(--accent)' }}>{utilization}%</p>
             </div>
             <p className="text-xs mb-3 font-mono" style={{ color: 'var(--text-secondary)' }}>Units Active: {activeRequests} / Registered: {TOTAL_AMBULANCES}</p>
             <div className="w-full rounded-full h-4 overflow-hidden shadow-inner" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-dim)' }}>
               <div 
                 className="h-full rounded-full shadow-[0_0_15px_rgba(255,75,75,0.6)]" 
                 style={{ 
                   width: `${utilization}%`, 
                   transition: 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)', 
                   background: 'linear-gradient(to right, #ff4b4b, #ff7676)' 
                 }}
               ></div>
             </div>
             <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '12px' }}>Real-time synchronization with active fleet status.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
