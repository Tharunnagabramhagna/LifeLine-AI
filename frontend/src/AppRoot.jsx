import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import SplashScreen from './components/SplashScreen';
import StartScreen from './pages/StartScreen';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import bgImage from './assets/bg-red-glass.png';

// ── Stage machine ──────────────────────────────────────────────
// Stages: "start" → "intro" → "auth" → "dashboard"
//
// Persisted in localStorage so reload stays on last stage.
// Reset via:  window.resetApp()  in browser console.
// ──────────────────────────────────────────────────────────────

const STAGE_KEY = 'lifeline_stage';

function setStage(stage) {
  localStorage.setItem(STAGE_KEY, stage);
}

function getInitialStage() {
  return localStorage.getItem(STAGE_KEY) || 'start';
}

// Expose global reset helper for QA / testing
window.resetApp = () => {
  localStorage.removeItem(STAGE_KEY);
  window.location.reload();
};

// ── Background wrapper shared across all post-splash stages ───
const BgWrapper = ({ children }) => (
  <div
    style={{
      backgroundImage: `url(${bgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      color: '#f3f4f6',
      overflowX: 'hidden',
    }}
  >
    {children}
  </div>
);

// ── Main App ───────────────────────────────────────────────────
export default function App() {
  const [appStage, setAppStage] = useState(getInitialStage);

  const goToStage = (stage) => {
    setStage(stage);
    setAppStage(stage);
  };

  // ── STAGE: start ──────────────────────────────────
  if (appStage === 'start') {
    return (
      <BgWrapper>
        <StartScreen onStart={() => goToStage('intro')} />
      </BgWrapper>
    );
  }

  // ── STAGE: intro (splash animation) ───────────────
  if (appStage === 'intro') {
    return (
      <SplashScreen
        onComplete={() => goToStage('auth')}
      />
    );
  }

  // ── STAGE: auth + dashboard (router-based) ────────
  return (
    <Router>
      <AuthProvider>
        <BgWrapper>
          <Routes>
            {/* Auth page — no redirect needed, stage is already "auth" */}
            <Route
              path="/"
              element={
                <AuthPage
                  onAuthSuccess={() => goToStage('dashboard')}
                />
              }
            />
            <Route
              path="/auth"
              element={
                <AuthPage
                  onAuthSuccess={() => goToStage('dashboard')}
                />
              }
            />

            {/* Protected dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute fallback={<Navigate to="/auth" replace />}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch-all — redirect based on current stage */}
            <Route
              path="*"
              element={
                appStage === 'dashboard'
                  ? <Navigate to="/dashboard" replace />
                  : <Navigate to="/auth" replace />
              }
            />
          </Routes>
        </BgWrapper>
      </AuthProvider>
    </Router>
  );
}
