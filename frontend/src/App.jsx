import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import SplashScreen from './components/SplashScreen';
import Landing from './components/Landing';
import AuthPage from './pages/AuthPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import './auth-true.css';

// ── ERROR BOUNDARY ──
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("System Crash Detected:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#ff4b4b', textAlign: 'center', padding: '20px' }}>
          <h1>🚑 SYSTEM KERNEL PANIC</h1>
          <p>The neural link encountered a fatal synchronization error.</p>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ marginTop: '20px', padding: '10px 20px', background: '#ff4b4b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            REBOOT SYSTEM (Clear Buffer)
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { user, logout } = useAuth();
  const [phase, setPhase] = useState('LANDING'); // LANDING, SPLASH, DASHBOARD
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    document.documentElement.className = theme === 'dark' ? 'dark-theme' : 'light-theme';
    document.body.className = theme === 'dark' ? 'dark-theme' : 'light-theme';
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleAuthSuccess = (userData) => {
    setPhase('DASHBOARD');
  };

  // If already logged in, skip landing after splash
  const handleSplashComplete = () => {
    setPhase('DASHBOARD');
  };

  return (
    <ErrorBoundary>
      {phase === 'LANDING' && !user && (
        <Landing onStart={() => setPhase('SPLASH')} />
      )}
      
      {phase === 'SPLASH' && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}

      {(phase === 'DASHBOARD' || user) && (
        <ProtectedRoute fallback={
          <AuthPage 
            onAuthSuccess={handleAuthSuccess} 
            theme={theme} 
            onToggleTheme={toggleTheme} 
          />
        }>
          <div className="app-visible">
            <Dashboard 
              user={user} 
              theme={theme} 
              onToggleTheme={toggleTheme} 
              onLogout={logout} 
            />
          </div>
        </ProtectedRoute>
      )}
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
