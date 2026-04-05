import React from 'react';
import EventCard from './EventCard'; 

export default function EmergencyPanel({ events = [] }) {
  const requests = events;
  const activityFeed = [];

  return (
    <div className="h-full flex flex-col pt-1">
      <h2 className="panel-title mb-3">Emergency Requests</h2>
      <div className="emergency-list flex-1 overflow-y-auto pr-2 space-y-3 mb-4">
        {requests.length === 0 ? (
          <div className="empty-state">No active requests</div>
        ) : (
          requests.map(evt => <EventCard key={evt.id} event={evt} onAssign={() => {}} />)
        )}
      </div>

      {/* Activity Feed Section */}
      <div className="activity-feed mt-2 pt-2 border-t border-gray-800">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Live Activity Feed</h3>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {activityFeed.map(feed => (
            <div key={feed.id} className="text-xs text-gray-400 font-mono flex items-center gap-2 live-feed-item">
              <span className="text-red-500">›</span> {feed.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
