import React from 'react';
import { useTilt } from '../hooks/useTilt';

export default function AmbulanceCard({ ambulance }) {
  const { ref, handleMouseMove, handleMouseLeave } = useTilt();
  const isAvailable = ambulance.status === 'AVAILABLE';
  const color = isAvailable ? 'text-green-400' : 'text-yellow-400';

  return (
    <div 
      ref={ref}
      className="floating-card glass-card p-4"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="floating-inner">
        <h3 className="card-title flex items-center gap-2">
          <div className="icon-ripple-wrapper" style={{ width: '40px', height: '40px' }}>
            <div className="ripple-ring ring-1" style={{ width: '30px', height: '30px' }}></div>
            <div className="ripple-ring ring-2" style={{ width: '30px', height: '30px' }}></div>
            <div className="ripple-ring ring-3" style={{ width: '30px', height: '30px' }}></div>
            
            <div className="ag-particle p1"></div>
            <div className="ag-particle p2"></div>
            <div className="ag-particle p3"></div>
            <div className="ag-particle p4"></div>
            <div className="ag-particle p5"></div>
            <div className="ag-particle p6"></div>
            
            <div className="icon-float" style={{ fontSize: '1.2rem' }}>🚑</div>
          </div>
          {ambulance.id}
        </h3>
        <p className={`mt-2 ${color}`}>
          Status: {ambulance.status}
        </p>
        {!isAvailable && ambulance.hospital && (
          <p className="text-gray-400 mt-2 text-sm">
            → {ambulance.hospital}
          </p>
        )}
      </div>
    </div>
  );
}
