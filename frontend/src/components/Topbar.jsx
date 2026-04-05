import React, { useState } from 'react';

export default function Topbar({ onToggleSidebar, isSidebarOpen, user, onLogout }) {
  const [open, setOpen] = useState(false);

  const toggleDropdown = () => setOpen(prev => !prev);
  const initial = user?.username?.charAt(0).toUpperCase() || 'A';

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button 
          className={`sidebar-toggle-btn ${isSidebarOpen ? 'active' : ''}`}
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar"
        >
          <span className="burger-line"></span>
          <span className="burger-line"></span>
          <span className="burger-line"></span>
        </button>
        <h2 className="topbar-title">Emergency Dashboard</h2>
      </div>

      <div className="topbar-actions">
        <div className="system-status-indicator">
          <span className="status-badge-active">
            System Active
          </span>
          <div className="status-ping"></div>
        </div>

        {/* Cinematic User Orb */}
        <div className="user-orb-container">
          <div className="user-orb" onClick={toggleDropdown}>
            <div className="avatar-orb">{initial}</div>
            <div className="avatar-status-ping"></div>
            
            <div className={`profile-panel ${open ? "open" : ""}`}>
              <div className="profile-meta">
                <span className="username">username: {user?.username || "Guest Operator"}</span>
                <span className="email">gmail: {user?.email || "offline@lifeline.ai"}</span>
              </div>

              <div className="profile-panel-divider" />

              <button className="logout-action" onClick={onLogout}>
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
