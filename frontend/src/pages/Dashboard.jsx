import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import UserProfile from '../components/UserProfile';
import SectionBackground from '../components/SectionBackground';
import { getAmbulances, getEvents, getHospitals } from '../services/api';

import DashboardView from '../components/views/DashboardView';
import AmbulancesView from '../components/views/AmbulancesView';
import RequestsView from '../components/views/RequestsView';
import AnalyticsView from '../components/views/AnalyticsView';
import SettingsView from '../components/views/SettingsView';

export default function Dashboard({ user, theme, onToggleTheme, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [events, setEvents] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [clock, setClock] = useState(new Date().toLocaleTimeString());

  // Live Clock logic
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
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
    loadData();
  }, []);

  return (
    <div className="app-wrapper">
      <SectionBackground activeSection={activeMenu} />

      {/* ── HEADER NAVIGATION — Full width across top ── */}
      <header className="dashboard-header">
        {/* LEFT — toggle button + logo */}
        <div className="header-left">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(prev => !prev)}
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>
          <span className="header-logo" style={{ fontSize: '1.2rem', fontWeight: 800 }}>🚑 LifeLine-AI</span>
        </div>

        {/* CENTER — clock only */}
        <div className="header-center">
          <span className="header-clock" style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '0.05em' }}>{clock}</span>
        </div>

        {/* RIGHT — LIVE badge + user profile */}
        <div className="header-right">
          <span className="live-badge">● LIVE</span>
          <UserProfile user={user} />
        </div>
      </header>

      {/* ── BODY — Sidebar left + main content right ── */}
      <div className="dashboard-body">
        <Sidebar 
          activeMenu={activeMenu} 
          setActiveMenu={setActiveMenu} 
          isOpen={sidebarOpen} 
          theme={theme}
          onToggleTheme={onToggleTheme}
          onLogout={onLogout}
        />

        <main className="dashboard-main">
          {/* Dashboard: no scroll wrapper — DashboardView owns its full remaining space */}
          {activeMenu === 'Dashboard' && (
            <div className="view-content-wrapper" style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
              <DashboardView ambulances={ambulances} events={events} hospitals={hospitals} theme={theme} />
            </div>
          )}

          {/* Other views: scrollable area */}
          {activeMenu !== 'Dashboard' && (
            <div className="view-content-wrapper scrollable-view" style={{ flex: 1, overflowY: 'auto' }}>
              {activeMenu === 'Ambulances' && <AmbulancesView />}
              {activeMenu === 'Requests'   && <RequestsView />}
              {activeMenu === 'Analytics'  && <AnalyticsView />}
              {activeMenu === 'Settings'   && <SettingsView />}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
