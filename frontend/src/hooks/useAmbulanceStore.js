/**
 * useAmbulanceStore — shared state that bridges requests ↔ ambulances.
 * 
 * When a request is assigned → the ambulance unit is marked Busy.
 * When a request completes → the ambulance unit is marked Available.
 *
 * Uses a simple module-level Set so both useLiveRequests and AmbulancesView
 * read the same source of truth without prop-drilling or a context provider.
 */
import { useState, useCallback, useEffect, useRef } from 'react';

// Module-level registry – survives re-renders, shared across all hook instances
const busyUnits = new Set();
const subscribers = new Set();

const notify = () => subscribers.forEach(fn => fn());

export const markBusy = (unitId) => {
  busyUnits.add(unitId);
  notify();
};

export const markAvailable = (unitId) => {
  busyUnits.delete(unitId);
  notify();
};

/** Returns a live-updating boolean: is this unitId currently busy? */
export const useIsUnitBusy = (unitId) => {
  const [busy, setBusy] = useState(() => busyUnits.has(unitId));
  useEffect(() => {
    const update = () => setBusy(busyUnits.has(unitId));
    subscribers.add(update);
    return () => subscribers.delete(update);
  }, [unitId]);
  return busy;
};

/** Returns the full set snapshot (re-renders on any change). */
export const useBusyUnits = () => {
  const [snap, setSnap] = useState(() => new Set(busyUnits));
  useEffect(() => {
    const update = () => setSnap(new Set(busyUnits));
    subscribers.add(update);
    return () => subscribers.delete(update);
  }, []);
  return snap;
};
