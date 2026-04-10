import React, { useState, useEffect } from 'react';
import { socket } from '../socket';
import Sidebar from '../components/Sidebar';
import UserProfile from '../components/UserProfile';
import SectionBackground from '../components/SectionBackground';
import { getAmbulances, getEvents, getHospitals, simulateEmergency } from '../services/api';

import DashboardView from '../components/views/DashboardView';
import AmbulancesView from '../components/views/AmbulancesView';
import RequestsView from '../components/views/RequestsView';
import AnalyticsView from '../components/views/AnalyticsView';
import SettingsView from '../components/views/SettingsView';
import SubscriptionView from '../components/views/SubscriptionView';
import { planLimits, hasFeature } from '../config/plans';

export default function Dashboard({ user, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [events, setEvents] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [clock, setClock] = useState(new Date().toLocaleTimeString());
  const [toasts, setToasts] = useState([]);
  const [isSimLoading, setIsSimLoading] = useState(false);

  // Live Clock logic
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [userPlan, setUserPlan] = useState('free');
  useEffect(() => {
    const updatePlan = () => setUserPlan(localStorage.getItem('userPlan') || 'free');
    updatePlan();
    window.addEventListener('planChanged', updatePlan);
    return () => window.removeEventListener('planChanged', updatePlan);
  }, []);

  const [simulationCount, setSimulationCount] = useState(() => {
    return parseInt(localStorage.getItem('simCount') || '0', 10);
  });
  
  const activeEmergenciesCount = events.filter(e => e.status !== 'COMPLETED').length;
  
  const simCountRef = React.useRef(simulationCount);
  React.useEffect(() => { simCountRef.current = simulationCount; }, [simulationCount]);

  const activeCountRef = React.useRef(activeEmergenciesCount);
  React.useEffect(() => { activeCountRef.current = activeEmergenciesCount; }, [activeEmergenciesCount]);

  const handleManualSimulation = async () => {
    const limits = planLimits[userPlan] || planLimits.free;
    if (simCountRef.current >= limits.maxSimulations) {
      addToast("Free plan limit reached. Upgrade to continue.");
      return;
    }
    if (activeCountRef.current >= limits.maxActiveEmergencies) {
      addToast("Too many active emergencies. Please wait or upgrade.");
      return;
    }

    try {
      setIsSimLoading(true);
      await simulateEmergency();
      const newCount = simCountRef.current + 1;
      setSimulationCount(newCount);
      localStorage.setItem("simCount", newCount.toString());
    } catch (err) {
      console.error("Simulation Error", err);
    } finally {
      setTimeout(() => setIsSimLoading(false), 200);
    }
  };

  const [autoSim, setAutoSim] = useState(false);
  useEffect(() => {
    const limits = planLimits[userPlan] || planLimits.free;
    if (!autoSim || !user || !limits.autoSimulation) {
      if (!limits.autoSimulation && autoSim) setAutoSim(false);
      return;
    }

    const interval = setInterval(async () => {
      if (simCountRef.current >= limits.maxSimulations || activeCountRef.current >= limits.maxActiveEmergencies) {
        addToast("Limits reached. Simulation paused.");
        setAutoSim(false);
        return;
      }
      try {
        setIsSimLoading(true);
        await simulateEmergency();
        const newCount = simCountRef.current + 1;
        setSimulationCount(newCount);
        localStorage.setItem("simCount", newCount.toString());
      } catch (err) {
        console.error("AutoSim Error:", err);
      } finally {
        setTimeout(() => setIsSimLoading(false), 200);
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [autoSim, user, userPlan]);

  const loadData = async () => {
    try {
      const [evts, ambs, hoss] = await Promise.all([
        getEvents() || [], 
        getAmbulances() || [],
        getHospitals() || []
      ]);
      
      const safeEvts = Array.isArray(evts) ? evts : [];
      const sortedEvts = [...safeEvts].sort((a, b) => {
        const ranks = { CRITICAL: 3, HIGH: 3, MEDIUM: 2, LOW: 1 };
        const rankA = ranks[(a.severity || '').toUpperCase()] || 0;
        const rankB = ranks[(b.severity || '').toUpperCase()] || 0;
        return rankB - rankA;
      });

      setEvents(sortedEvts);
      setAmbulances(Array.isArray(ambs) ? ambs : []);
      setHospitals(Array.isArray(hoss) ? hoss : []);
    } catch (err) {
      console.error("Dashboard data load failure:", err);
    }
  };

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 8000);

    socket.on('new-emergency', (e) => {
      const toastId = Date.now();
      setToasts(prev => [...prev, { id: toastId, message: 'Emergency detected 🚑' }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 3000);

      // 250ms micro-delay for smooth animation routing without dropping frames
      setTimeout(() => {
        setEvents(prev => {
          const withFormattedDate = { ...e, isNew: true, createdAt: e.timestamp || e.createdAt };
          return [withFormattedDate, ...prev].sort((a, b) => {
            const ranks = { CRITICAL: 3, HIGH: 3, MEDIUM: 2, LOW: 1 };
            return (ranks[b.severity || 'MEDIUM'] || 0) - (ranks[a.severity || 'MEDIUM'] || 0);
          });
        });
      }, 250);
    });

    socket.on('ambulance-assigned', ({ eventId, ambulance }) => {
      setAmbulances(prev => prev.map(a => a.id === ambulance.id ? { ...a, ...ambulance, status: 'BUSY' } : a));
      setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, status: 'ASSIGNED', ambulance_assigned: ambulance, ambulance_id: ambulance.id } : ev));
    });
    
    // Explicitly add ambulance:update as requested by user framework updates
    socket.on('ambulance:update', (updated) => {
      if (Array.isArray(updated)) {
        setAmbulances(updated);
      } else {
        setAmbulances(prev => prev.map(a => a.id === updated.id ? updated : a));
      }
    });

    socket.on('ambulance:init', (data) => {
      if (Array.isArray(data)) setAmbulances(data);
    });

    socket.on('event-completed', (payload) => {
      // payload could be { eventId, ambulanceId, completed_at } or just the emergency payload.
      const eventId = payload.eventId || payload.id;
      const ambulanceId = payload.ambulanceId || (payload.ambulance_assigned && payload.ambulance_assigned.id);
      
      setAmbulances(prev => prev.map(a => a.id === ambulanceId ? { ...a, status: 'IDLE' } : a));
      setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, status: 'COMPLETED', completed_at: payload.completed_at || new Date().toISOString() } : ev));
    });

    return () => {
      if (interval) clearInterval(interval);
      socket.off('new-emergency');
      socket.off('ambulance-assigned');
      socket.off('ambulance:update');
      socket.off('ambulance:init');
      socket.off('event-completed');
    };
  }, []);

  return (
    <div className="app-wrapper" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <SectionBackground activeSection={activeMenu} />

      {/* ── HEADER NAVIGATION — Full width across top ── */}
      <div className="topbar">
        <div className="left" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>LifeLine AI</span>
        </div>

        <div className="center-controls">
          <button 
            className="primary-btn" 
            disabled={userPlan === 'free'}
            onClick={() => setAutoSim(!autoSim)}
            style={{ opacity: userPlan === 'free' ? 0.5 : 1, cursor: userPlan === 'free' ? 'not-allowed' : 'pointer' }}
          >
            {isSimLoading ? '⚙️' : (autoSim ? '● STOP LIVE SIMULATION' : '▶ START LIVE SIMULATION')}
          </button>

          <div className="pill">Active: {activeEmergenciesCount} / {(planLimits[userPlan] || planLimits.free).maxActiveEmergencies === Infinity ? '∞' : (planLimits[userPlan] || planLimits.free).maxActiveEmergencies}</div>
          <div className="pill">Plan: {userPlan.toUpperCase()}</div>
        </div>

        <div className="right">
          <UserProfile user={user} />
        </div>
      </div>

      {/* ── BODY — Sidebar left + main content right ── */}
      <div className="dashboard-body">
        <Sidebar 
          activeMenu={activeMenu} 
          setActiveMenu={setActiveMenu} 
          isOpen={sidebarOpen} 
          onLogout={onLogout}
        />

        <main className="dashboard-main">
          {/* Dashboard: no scroll wrapper — DashboardView owns its full remaining space */}
          {activeMenu === 'Dashboard' && (
            <div className="view-content-wrapper" style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
              <DashboardView ambulances={ambulances} events={events} hospitals={hospitals} onSimulate={handleManualSimulation} simulationCount={simulationCount} activeCount={activeEmergenciesCount} userPlan={userPlan} />
            </div>
          )}

          {/* Other views: scrollable area */}
          {activeMenu !== 'Dashboard' && (
            <div className="view-content-wrapper scrollable-view" style={{ flex: 1, overflowY: 'auto' }}>
              {activeMenu === 'Ambulances' && <AmbulancesView />}
              {activeMenu === 'Requests'   && <RequestsView />}
              {activeMenu === 'Analytics'  && <AnalyticsView />}
              {activeMenu === 'Settings'   && <SettingsView onNavigate={setActiveMenu} />}
              {activeMenu === 'Subscription' && <SubscriptionView />}
            </div>
          )}
        </main>
      </div>
      
      {/* GLOBAL TOASTS PLATFORM */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{ background: 'var(--bg-tertiary)', border: '1px solid #ff4d4d', color: 'var(--text-primary)', padding: '12px 24px', borderRadius: '8px', boxShadow: '0 8px 30px rgba(255,77,77,0.3)', animation: 'slideInPulse 0.4s ease forwards', fontWeight: 'bold' }}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
