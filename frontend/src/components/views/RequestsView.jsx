import React, { useState, useEffect } from 'react';
import { getEvents } from '../../services/api';
import EventCard from '../EventCard';

export default function RequestsView() {
  const [requests, setRequests] = useState([]);
  useEffect(() => {
     getEvents().then(setRequests).catch(console.error);
  }, []);

  // Debug Visibility
  useEffect(() => {
    console.log("Requests updated:", requests);
  }, [requests]);

  return (
    <div className="view-container">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="view-header mb-0">Emergency Requests</h2>
          <h4 className="font-mono mt-1" style={{ color: 'var(--text-secondary)' }}>Total Requests: {requests.length}</h4>
        </div>
        <span className="font-mono tracking-widest text-sm animate-pulse" style={{ color: 'var(--accent)' }}>● LIVE CONNECTION</span>
      </div>

      <div className="flex flex-col gap-4 max-w-5xl mt-4">
        {requests.length === 0 ? (
          <div className="font-mono p-4" style={{ color: 'var(--text-secondary)' }}>No active emergency requests. Stand by.</div>
        ) : (
          requests.map(evt => (
             <EventCard key={evt.id} event={evt} onAssign={() => {}} />
          ))
        )}
      </div>
    </div>
  );
}
