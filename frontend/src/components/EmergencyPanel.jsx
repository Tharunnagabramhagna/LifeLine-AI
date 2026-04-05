import React, { useRef, useEffect } from 'react';
import EventCard from './EventCard'; 

export default function EmergencyPanel({ events = [], userPlan = "free" }) {
  const normalizedPlan = (userPlan || "free").toLowerCase();
  const visibleEvents = normalizedPlan === "free" ? events.slice(0, 5) : events;
  const requests = visibleEvents;
  const activityFeed = [];
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current && events.length > 0 && events[0].isNew) {
      listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [events]);

  return (
    <div className="h-full flex flex-col pt-1">
      <h2 className="panel-title mb-3">Emergency Requests</h2>
      <div ref={listRef} className="emergency-list flex-1 overflow-y-auto pr-2 space-y-3 mb-4 scroll-smooth">
        {requests.map(evt => <EventCard key={evt.id} event={evt} userPlan={userPlan} onAssign={() => {}} />)}
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
