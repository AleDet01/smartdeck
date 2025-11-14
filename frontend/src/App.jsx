import React, { useEffect, useState, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './utils/themeContext';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import LogoutButton from './components/LogoutButton';
import CookieBanner from './components/CookieBanner';
import SessionWarning from './components/SessionWarning';
import LoadingFallback from './components/LoadingFallback';
import API_HOST from './utils/apiHost';
import { useSessionTimeout } from './utils/sessionManager';

// Lazy loading per le pagine principali
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const PreTestPage = lazy(() => import('./pages/PreTestPage'));
const TestPage = lazy(() => import('./pages/TestPage'));
const StatisticsPage = lazy(() => import('./pages/StatisticsPage'));
const AIAssistantPage = lazy(() => import('./pages/AIAssistantPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));

function RequireAuth({ children }) {
  const [state, setState] = useState({ loading: true, ok: false });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_HOST}/auth/me`, { 
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        const data = await res.json().catch(() => ({}));
        if (!cancelled) setState({ loading: false, ok: !!(data && data.authenticated) });
      } catch {
        if (!cancelled) setState({ loading: false, ok: false });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (state.loading) return null;
  return state.ok ? children : <Navigate to="/" />;
}

function SessionManager() {
  const [showWarning, setShowWarning] = useState(false);
  const [minutesRemaining, setMinutesRemaining] = useState(0);
  const location = useLocation();

  const handleWarning = (minutes) => {
    setMinutesRemaining(minutes);
    setShowWarning(true);
  };

  const { extendSession, logout } = useSessionTimeout(handleWarning);

  // Solo per route protette
  const isProtectedRoute = !['/privacy', '/terms', '/'].includes(location.pathname);

  if (!isProtectedRoute) return null;

  return showWarning ? (
    <SessionWarning 
      minutesRemaining={minutesRemaining}
      onExtend={() => { setShowWarning(false); extendSession(); }}
      onLogout={logout}
    />
  ) : null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <ThemeProvider>
          <HashRouter>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '16px',
                },
                success: {
                  iconTheme: {
                    primary: '#4ade80',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
            <SessionManager />
            <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Navigate to="/" />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
            <Route path="/statistiche" element={<RequireAuth><StatisticsPage /></RequireAuth>} />
            <Route path="/ai-assistant" element={<RequireAuth><AIAssistantPage /></RequireAuth>} />
            <Route path="/pretest/:area" element={<RequireAuth><PreTestPage /></RequireAuth>} />
            <Route path="/test/:area/:num" element={<RequireAuth><TestPage /></RequireAuth>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
        <LogoutButton />
        <CookieBanner />
      </HashRouter>
    </ThemeProvider>
    </HelmetProvider>
    </ErrorBoundary>
  );
}
