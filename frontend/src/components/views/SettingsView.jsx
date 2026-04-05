import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import './settings.css';

// Modern Toggle Switch Component
const Toggle = ({ checked, onChange }) => (
  <label className="modern-toggle">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span className="toggle-slider"></span>
  </label>
);

export default function SettingsView({ onNavigate }) {
  // Safe default state per instructions
  const [user, setUser] = useState({
    name: "",
    email: "",
    role: "Dispatcher"
  });

  // Load user data safely
  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (storedUser) {
        setUser(storedUser);
      }
    } catch (err) {
      console.error("User load error", err);
    }
  }, []);

  console.log("SETTINGS USER:", user);

  const [toggles, setToggles] = useState({
    twoFa: false,
    emailAlerts: true,
    smsAlerts: false,
    broadcast: true,
    darkMode: true,
    autoRefresh: true,
    soundAlerts: true,
    emergencyMode: false,
    priorityDispatch: false,
    autoAssign: true
  });

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleToggle = (key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleUpdatePassword = async () => {
    setError("");
    setSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password must be different from current password");
      return;
    }

    setLoading(true);

    try {
      await apiRequest('/change-password', {
          method: 'POST',
          body: JSON.stringify({ currentPassword, newPassword })
      });
      setSuccess("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-container pb-20">
      <div className="flex justify-between items-end mb-6">
        <h2 className="view-header mb-0">System Preferences</h2>
        <span className="text-gray-400 font-mono tracking-widest text-sm">TERMINAL SETTINGS</span>
      </div>

      <div className="settings-container">
        
        {/* Subscription Block */}
        <div className="settings-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: 'rgba(255,77,77,0.3)' }}>
          <div>
            <h3 className="settings-section-title" style={{ border: 'none', marginBottom: '8px', padding: 0 }}>Subscription Details</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', margin: 0 }}>
              Current Level: <span style={{ color: '#ff4d4d', fontWeight: 'bold' }}>{(localStorage.getItem('userPlan') || 'free').toUpperCase()}</span>
            </p>
          </div>
          <button className="settings-button" style={{ margin: 0 }} onClick={() => onNavigate && onNavigate('Subscription')}>
            Manage Plan
          </button>
        </div>
        
        {!user.name && !user.email ? (
            <h3 className="text-gray-400">Loading user data...</h3>
        ) : null}

        {/* 1. Profile Settings */}
        <div className="settings-card">
          <h3 className="settings-section-title">Profile Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="settings-input-group">
              <label className="settings-label">Full Name</label>
              <input 
                type="text" 
                className="settings-input" 
                value={user?.name || user?.username || ""} 
                onChange={(e) => setUser(prev => ({ ...prev, name: e.target.value }))} 
              />
            </div>
            <div className="settings-input-group">
              <label className="settings-label">Role</label>
              <input type="text" className="settings-input" value={user?.role || 'Dispatcher'} disabled />
            </div>
            <div className="settings-input-group col-span-2">
              <label className="settings-label">Email Address</label>
              <input type="email" className="settings-input" value={user?.email || ""} disabled />
            </div>
          </div>
          <button className="settings-button" onClick={() => alert('Profile updated')}>Update Profile</button>
        </div>

        {/* 2. Security Settings */}
        <div className="settings-card">
          <h3 className="settings-section-title">Security Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="settings-input-group col-span-2">
              <label className="settings-label">Current Password</label>
              <input 
                type="password" 
                className="settings-input" 
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="settings-input-group">
              <label className="settings-label">New Password</label>
              <input 
                type="password" 
                className="settings-input" 
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="settings-input-group">
              <label className="settings-label">Confirm Password</label>
              <input 
                type="password" 
                className="settings-input" 
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="settings-row mt-2 border-b border-white/5 pb-4 mb-2">
            <div className="settings-row-text">
              <h4>Enable 2FA (Two-Factor Authentication)</h4>
              <p>Add an extra layer of security to your terminal access.</p>
            </div>
            <Toggle checked={toggles.twoFa} onChange={() => handleToggle('twoFa')} />
          </div>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <button 
            className="settings-button mt-4" 
            onClick={handleUpdatePassword}
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>

        {/* 3. Notification Preferences */}
        <div className="settings-card">
          <h3 className="settings-section-title">Notification Preferences</h3>
          
          <div className="settings-row border-b border-white/5">
            <div className="settings-row-text">
              <h4>Email Alerts</h4>
              <p>Receive daily digest and system updates via email.</p>
            </div>
            <Toggle checked={toggles.emailAlerts} onChange={() => handleToggle('emailAlerts')} />
          </div>
          
          <div className="settings-row border-b border-white/5">
            <div className="settings-row-text">
              <h4>SMS Alerts</h4>
              <p>Receive extreme priority incident texts (Operator class required).</p>
            </div>
            <Toggle checked={toggles.smsAlerts} onChange={() => handleToggle('smsAlerts')} />
          </div>
          
          <div className="settings-row">
            <div className="settings-row-text">
              <h4>Emergency Broadcast Alerts</h4>
              <p>Trigger loud terminal sound when life-critical events deploy.</p>
            </div>
            <Toggle checked={toggles.broadcast} onChange={() => handleToggle('broadcast')} />
          </div>
        </div>

        {/* 4. System Preferences */}
        <div className="settings-card">
          <h3 className="settings-section-title">System Preferences</h3>
          
          <div className="settings-row border-b border-white/5">
            <div className="settings-row-text">
              <h4>Dark Mode</h4>
              <p>Enable dark tactical HUD for low-light operator environments.</p>
            </div>
            <Toggle checked={toggles.darkMode} onChange={() => handleToggle('darkMode')} />
          </div>
          
          <div className="settings-row border-b border-white/5">
            <div className="settings-row-text">
              <h4>Auto-refresh Dashboard</h4>
              <p>Stream real-time IoT events seamlessly without refresh.</p>
            </div>
            <Toggle checked={toggles.autoRefresh} onChange={() => handleToggle('autoRefresh')} />
          </div>
          
          <div className="settings-row">
            <div className="settings-row-text">
              <h4>Sound Alerts</h4>
              <p>Enable operational acoustic feedback for interface clicks.</p>
            </div>
            <Toggle checked={toggles.soundAlerts} onChange={() => handleToggle('soundAlerts')} />
          </div>
        </div>

        {/* 5. Emergency Controls */}
        <div className="settings-card" style={{ border: '1px solid rgba(255, 77, 77, 0.4)' }}>
          <h3 className="settings-section-title text-red-500">Emergency Controls</h3>
          <span className="warning-text">⚠️ These settings affect real-time emergency response behavior globally. Proceed with caution.</span>
          
          <div className="settings-row border-b border-red-500/10">
            <div className="settings-row-text">
              <h4>Enable Emergency Mode</h4>
              <p>Halt non-critical services immediately and override grid protocols.</p>
            </div>
            <Toggle checked={toggles.emergencyMode} onChange={() => handleToggle('emergencyMode')} />
          </div>
          
          <div className="settings-row border-b border-red-500/10">
            <div className="settings-row-text">
              <h4>Priority Dispatch AI</h4>
              <p>Hand over active unit allocation fully to predictive algorithms.</p>
            </div>
            <Toggle checked={toggles.priorityDispatch} onChange={() => handleToggle('priorityDispatch')} />
          </div>
          
          <div className="settings-row">
            <div className="settings-row-text">
              <h4>Auto-assign Nearest Ambulance</h4>
              <p>Skip operator approval for ETA &lt; 5 minutes events.</p>
            </div>
            <Toggle checked={toggles.autoAssign} onChange={() => handleToggle('autoAssign')} />
          </div>
        </div>

      </div>
    </div>
  );
}
