import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import SplashScreen from './components/SplashScreen';
import Landing from './components/Landing';
import AuthPage from './pages/AuthPage';

function App() {
  const [phase, setPhase] = useState('LANDING'); // LANDING, SPLASH, LOGIN, DASHBOARD
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  // ── CHECK PERSISTENT SESSION (Demo Mode Bypass) ──
  useEffect(() => {
    // If a demo token or user exists, auto-establish link
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setPhase('DASHBOARD');
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme); // keep body backward compat for a moment
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogin = (userData) => {
    // Demo Mode: Authentication is bypassed for hackathon presentation
    setUser(userData);
    localStorage.setItem("token", "demo-token");
    localStorage.setItem("user", JSON.stringify(userData));
    setPhase('DASHBOARD');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Clear legacy keys if they exist
    localStorage.removeItem("currentUser");
    setPhase('LOGIN');
  };
  
  return (
    <>
      {phase === 'LANDING' && <Landing onStart={() => setPhase('SPLASH')} />}
      {phase === 'SPLASH' && <SplashScreen onComplete={() => {
        // Double-check session after splash
        const token = localStorage.getItem('token');
        if (token) setPhase('DASHBOARD');
        else setPhase('LOGIN');
      }} />}
      
      {phase === 'LOGIN' && <AuthPage onAuthSuccess={handleLogin} theme={theme} onToggleTheme={toggleTheme} />}
      
      {phase === 'DASHBOARD' && (
        <div className="app-visible">
          <Dashboard 
            user={user} 
            theme={theme} 
            onToggleTheme={toggleTheme} 
            onLogout={handleLogout} 
          />
        </div>
      )}
    </>
  );
}

export default App;
