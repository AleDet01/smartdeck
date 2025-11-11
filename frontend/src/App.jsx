import React, { useEffect, useState, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './utils/themeContext';
import LandingPage from './pages/LandingPage';
import LogoutButton from './components/LogoutButton';
import CookieBanner from './components/CookieBanner';
import API_HOST from './utils/apiHost';

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
        const res = await fetch(`${API_HOST}/auth/me`, { credentials: 'include' });
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

export default function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: '1.2rem' }}>Caricamento...</div>}>
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
  );
}
