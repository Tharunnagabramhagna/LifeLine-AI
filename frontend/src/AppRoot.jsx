import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import SplashScreen from './components/SplashScreen';
import StartScreen from './pages/StartScreen';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  // PHASE 1 & 2: CONTROL FIRST LOAD & FORCE SPLASH ON REFRESH
  // We use a React state that starts as 'false' on every mount/refresh.
  // This satisfies "Refresh page -> Splash appears AGAIN (IMPORTANT)".
  const [hasVisited, setHasVisited] = React.useState(false);

  return (
    <Router>
      {!hasVisited ? (
        /* PHASE 2: FORCE SPLASH ON FIRST LOAD (INCLUDING REFRESH) */
        <SplashScreen onComplete={() => {
          sessionStorage.setItem("visited", "true"); // Passive tracking
          setHasVisited(true);
        }} />
      ) : (
        <AuthProvider>
          <div className="bg-black text-white min-h-screen">
            <Routes>
              {/* PHASE 5: STRICT ROUTING ORDER */}
              <Route path="/" element={<SplashScreen onComplete={() => setHasVisited(true)} />} />
              <Route path="/start" element={<StartScreen />} />
              <Route path="/auth" element={<AuthPage />} />
              
              {/* PHASE 4: AUTH ONLY INSIDE ROUTES using ProtectedRoute */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute fallback={<Navigate to="/auth" />}>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              {/* Fallback to root if user somehow bypasses */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </AuthProvider>
      )}
    </Router>
  );
}

export default App;
