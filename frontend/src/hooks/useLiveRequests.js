import { useState, useEffect, useRef } from 'react';
import { markBusy, markAvailable } from './useAmbulanceStore';

// Generates a mock request
const generateMockRequest = (idCounter) => {
  const severities = ['Critical', 'High', 'Medium', 'Low'];
  const locations = ['Sector 7G', 'Downtown', 'North Highway', 'Industrial Park', 'Suburbs'];
  const types = ['Cardiac Arrest', 'Traffic Collision', 'Fire Injury', 'Maternity', 'Stroke'];

  const severity = severities[Math.floor(Math.random() * severities.length)];
  const now = Date.now();
  return {
    id: `REQ-${idCounter}`,
    type: types[Math.floor(Math.random() * types.length)],
    severity,
    location: locations[Math.floor(Math.random() * locations.length)],
    status: 'Pending',
    createdAt: now,
    statusUpdatedAt: now,
    assignedUnit: null
  };
};

export const useLiveRequests = (initialEvents = []) => {
  const [requests, setRequests] = useState(() => {
    if (initialEvents.length === 0) {
      return [generateMockRequest(101), generateMockRequest(102)];
    }
    return initialEvents.map(e => ({ 
      ...e, 
      createdAt: e.createdAt || Date.now(),
      statusUpdatedAt: e.statusUpdatedAt || Date.now()
    }));
  });

  const [counter, setCounter] = useState(200);
  const [activityFeed, setActivityFeed] = useState([
    { id: 1, message: 'System Initialized - Awaiting dispatch', time: Date.now() }
  ]);
  const feedIdRef = useRef(100);

  const addFeedItem = (message) => {
    feedIdRef.current += 1;
    setActivityFeed(prev => {
      const newFeed = [{ id: feedIdRef.current, message, time: Date.now() }, ...prev];
      return newFeed.slice(0, 6);
    });
  };

  // Manual Assignment Function
  const assignRequest = (id) => {
    const now = Date.now();
    setRequests(prev => prev.map(req => {
      if (req.id === id && req.status === 'Pending') {
        const assignedUnit = `A-${Math.floor(Math.random() * 90 + 10)}`;
        addFeedItem(`Request ${id} assigned to ${assignedUnit}`);
        markBusy(assignedUnit); // sync ambulance store
        return { 
          ...req, 
          status: 'Assigned', 
          assignedUnit, 
          statusUpdatedAt: now 
        };
      }
      return req;
    }));
  };

  // 1. New Request Injection
  useEffect(() => {
    const injectInterval = setInterval(() => {
      setCounter(prev => {
        const nextId = prev + 1;
        const newReq = generateMockRequest(nextId);
        
        setRequests(prevReqs => {
          const nextReqs = [newReq, ...prevReqs];
          return nextReqs.slice(0, 10);
        });
        
        addFeedItem(`Request ${newReq.id} created`);
        return nextId;
      });
    }, 12000);

    return () => clearInterval(injectInterval);
  }, []);

  // 2. Auto Status Transitions & Cleanup Iteration
  useEffect(() => {
    const transitionInterval = setInterval(() => {
      const now = Date.now();
      
      setRequests(prev => {
        let hasChanges = false;
        
        const updated = prev.filter(req => {
          const elapsedSec = (now - req.statusUpdatedAt) / 1000;
          
          // Auto remove logic after 5s of being completed
          if (req.status === 'Completed' && elapsedSec >= 5) {
            hasChanges = true;
            return false; // drop from array
          }
          return true;
        }).map(req => {
          if (req.status === 'Pending' || req.status === 'Completed') return req;

          const elapsedSec = (now - req.statusUpdatedAt) / 1000;
          let newReq = { ...req };
          let changed = false;

          // Assigned -> In Transit (5s)
          if (req.status === 'Assigned' && elapsedSec >= 5) {
             newReq.status = 'In Transit';
             newReq.statusUpdatedAt = now;
             changed = true;
          }
          // In Transit -> Completed (10s)
          else if (req.status === 'In Transit' && elapsedSec >= 10) {
             newReq.status = 'Completed';
             newReq.statusUpdatedAt = now;
             changed = true;
             markAvailable(req.assignedUnit); // free ambulance
             addFeedItem(`Request ${req.id} completed. Unit ${req.assignedUnit} available.`);
          }

          if (changed) hasChanges = true;
          return changed ? newReq : req;
        });
        
        return hasChanges ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(transitionInterval);
  }, []);

  // Sorting
  const sortedRequests = [...requests].sort((a, b) => {
    const priorityMap = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    if (priorityMap[a.severity] !== priorityMap[b.severity]) {
      return priorityMap[b.severity] - priorityMap[a.severity];
    }
    return b.createdAt - a.createdAt;
  });

  return {
    requests: sortedRequests,
    activityFeed,
    assignRequest
  };
};
