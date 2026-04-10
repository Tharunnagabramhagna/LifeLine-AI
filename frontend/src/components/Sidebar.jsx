import React from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ activeMenu, setActiveMenu, isOpen, onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const menu = [
    { name: "Dashboard", icon: "📊" },
    { name: "Ambulances", icon: "🚑" },
    { name: "Requests", icon: "🚨" },
    { name: "Analytics", icon: "📈" },
    { name: "Settings", icon: "⚙️" },
  ];

  return (
    <div className={`sidebar ${isOpen ? '' : 'hidden'}`} style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Glitter Effect */}
      <div className="glass-shimmer"></div>

      <div className="sidebar-brand-wrapper">
        {/* Anti-gravity particles */}
        <div className="ag-particle p1"></div>
        <div className="ag-particle p2"></div>
        <div className="ag-particle p3"></div>
        <div className="ag-particle p4"></div>
        <div className="ag-particle p5"></div>
        <div className="ag-particle p6"></div>

        {/* Existing branding text — static, no animation */}
        <div className="sidebar-brand">
          <h1 className="sidebar-title m-0 p-0" style={{ fontSize: '1.2rem' }}>
            <span className="brand-life">Life</span><span className="brand-line">Line AI</span>
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {menu.map((item) => (
          <div
            key={item.name}
            className={`sidebar-menu-item ${activeMenu === item.name ? "active" : ""}`}
            onClick={() => setActiveMenu(item.name)}
          >
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-name">{item.name}</span>
          </div>
        ))}
      </nav>

      {/* Sidebar Bottom Actions */}
      <div className="sidebar-bottom">
        <div className="sidebar-action-group">
          <button className="sidebar-action-btn theme-toggle" onClick={toggleTheme} title="Toggle Theme" style={{ width: '100%' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>

        {/* 🚪 Industry-grade Logout Button */}
        <button 
          className="logout-btn"
          onClick={logout}
        >
          <span className="logout-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 19H5V5H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="logout-text">Log Out</span>
        </button>
      </div>
    </div>
  );
}
