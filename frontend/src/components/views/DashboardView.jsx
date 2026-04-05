import React, { useState, useEffect } from 'react';
import { apiRequest, simulateEmergency } from '../../services/api';
import { hasFeature } from '../../config/plans';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import EmergencyPanel from '../EmergencyPanel';
import AmbulanceCard from '../AmbulanceCard';

// ── 🏥 Custom Cinematic Hospital Marker ──
const createHospitalMarker = () => L.divIcon({
  className: '',
  html: `
    <div class="cinematic-marker-root hospital-marker">
      <div class="ripple-ring ring-1"></div>
      <div class="ripple-ring ring-2"></div>
      <div class="ripple-ring ring-3"></div>
      
      <div class="ag-particle p1"></div>
      <div class="ag-particle p2"></div>
      <div class="ag-particle p3"></div>
      <div class="ag-particle p4"></div>
      <div class="ag-particle p5"></div>
      <div class="ag-particle p6"></div>
      
      <div class="icon-float">🏥</div>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
  popupAnchor: [0, -30],
});

const createCinematicMarker = (status) => L.divIcon({
  className: '',
  html: `
    <div class="cinematic-marker-root ambulance-marker cinematic-marker-${status.toLowerCase()}">
      <div class="ripple-ring ring-1"></div>
      <div class="ripple-ring ring-2"></div>
      <div class="ripple-ring ring-3"></div>
      
      <div class="ag-particle p1"></div>
      <div class="ag-particle p2"></div>
      <div class="ag-particle p3"></div>
      <div class="ag-particle p4"></div>
      <div class="ag-particle p5"></div>
      <div class="ag-particle p6"></div>
      
      <div class="icon-float">🚑</div>
    </div>
  `,
  iconSize: [56, 56],
  iconAnchor: [28, 28],
  popupAnchor: [0, -36],
});

export default function DashboardView({ ambulances, events, hospitals, theme, onSimulate, simulationCount, activeCount, userPlan: globalUserPlan }) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [userPlan, setUserPlan] = useState(globalUserPlan || "free");
  const mapCenter = [16.5062, 80.6480];

  useEffect(() => {
    const handlePlanChange = () => {
      setUserPlan(localStorage.getItem('userPlan') || 'free');
    };
    handlePlanChange();
    window.addEventListener('planChanged', handlePlanChange);
    return () => window.removeEventListener('planChanged', handlePlanChange);
  }, []);

  const tileUrl = theme === 'light' 
    ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  return (
    // Takes up the full remaining space inside layout-main (after Topbar)
    <div className="dash-map-root">

      {/* ══ LAYER 0: FULL-SCREEN LEAFLET MAP ══ */}
      <div className="dash-map-layer">
        <MapContainer
          center={mapCenter}
          zoom={13}
          zoomControl={false}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url={tileUrl}
          />
          {ambulances.map((amb) => {
            const position = amb.location && typeof amb.location.lat === 'number' && typeof amb.location.lon === 'number' 
              ? [amb.location.lat, amb.location.lon] 
              : null;
            
            if (!position) return null;

            return (
              <Marker
                key={amb.id}
                position={position}
                icon={createCinematicMarker(amb.status || 'IDLE')}
              >
                <Popup>
                  <div className="popup-inner">
                    <strong className="popup-id">{amb.name || amb.id}</strong>
                    <span className={`popup-status popup-status-${(amb.status || 'idle').toLowerCase()}`}>
                      {amb.status}
                    </span>
                    {(amb.status === 'BUSY' || amb.status === 'EN_ROUTE') && (
                      <div className="popup-details">
                        <span>🚑 {amb.number}</span>
                        <span>📍 {amb.location.name}</span>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {hospitals && hospitals.map((hos) => {
            const position = hos.location && typeof hos.location.lat === 'number' && typeof hos.location.lon === 'number'
              ? [hos.location.lat, hos.location.lon]
              : null;
              
            if (!position) return null;

            return (
              <Marker
                key={hos.id}
                position={position}
                icon={createHospitalMarker()}
              >
                <Popup>
                  <div className="popup-inner">
                    <strong className="popup-id">{hos.name}</strong>
                    <div className="popup-status" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#2ecc71', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                      HOSPITAL FACILITY
                    </div>
                    <div className="popup-details text-xs">
                      <span>🚑 Available Units: {hos.units}</span>
                      <span>📍 {hos.location.lat.toFixed(4)}, {hos.location.lon.toFixed(4)}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
        {/* Cinematic edge-fade vignette — pointer-events:none so map stays interactive */}
        <div className="dash-map-vignette" />
      </div>

      {/* ══ LAYER 1: TOP HUD BAR ══ */}
      <div className="dash-hud-bar">
        {/* Left — system badge */}
        <div className="hud-badge">
          <span className="hud-dot" />
          <span className="hud-label">LifeLine AI · Live Dispatch</span>
          <span className="hud-unit-count">{ambulances.length} Units</span>
        </div>

        {/* Center — neon arrow toggle */}
        <button
          className={`hud-panel-toggle ${panelOpen ? 'toggle-open' : 'toggle-closed'}`}
          onClick={() => setPanelOpen(!panelOpen)}
          aria-label="Toggle side panel"
        >
          <span className="hud-arrow">▶</span>
          <span className="hud-toggle-label">{panelOpen ? 'HIDE PANEL' : 'SHOW PANEL'}</span>
        </button>

        {/* Right — event count badge */}
        <div className="hud-alert-badge">
          <span className="hud-dot hud-dot-red" />
          <span>{events.filter(e => e.severity === 'CRITICAL').length} Critical</span>
          <span className="hud-sep">·</span>
          <span>{events.length} Total Events</span>
        </div>
      </div>

      {/* ══ LAYER 2: FLOATING GLASSMORPHIC SIDE PANEL ══ */}
      <div className={`dash-side-panel ${panelOpen ? 'panel-open' : 'panel-closed'}`}>

        {/* Panel 1 — Live Incidents */}
        <div className="glass-side-section" style={{ '--float-delay': '0s' }}>
          <div className="glass-section-header">
            <span className="gs-dot" />
            <h3 className="gs-title">Live Incidents</h3>
            <span className="gs-badge">{events.length}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
              {!hasFeature(userPlan, "simulation") && (
                <span className="limit-warning" style={{ fontSize: '11px', color: '#ff4d4d', marginRight: '4px' }}>
                  🔒 Available in Pro
                </span>
              )}
              <button 
                  disabled={!hasFeature(userPlan, "simulation")}
                  onClick={async () => { 
                    if (onSimulate) {
                      await onSimulate();
                    } else {
                      try { await simulateEmergency(); } catch(e) {}
                    }
                  }}
                  style={{ background: 'var(--accent)', color: 'white', padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', cursor: hasFeature(userPlan, "simulation") ? 'pointer' : 'not-allowed', border: 'none', transition: '0.2s', opacity: hasFeature(userPlan, "simulation") ? 1 : 0.5, fontWeight: 'bold' }}
              >
                  ▶ START SIMULATION
              </button>
            </div>
          </div>
          <div className="glass-section-body">
            <EmergencyPanel events={events} userPlan={userPlan} />
          </div>
        </div>

        {/* Panel 2 — Active Fleet */}
        <div className="glass-side-section" style={{ '--float-delay': '-3.5s' }}>
          <div className="glass-section-header">
            <span className="gs-dot gs-dot-green" />
            <h3 className="gs-title">Active Fleet</h3>
            <span className="gs-badge">{ambulances.length}</span>
          </div>
          <div className="glass-section-body">
            {ambulances.map(amb => (
              <AmbulanceCard key={amb.id} ambulance={amb} />
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
