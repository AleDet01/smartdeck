import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './utils/themeContext';
import DashboardPage from './pages/DashboardPage';
import LandingPage from './pages/LandingPage';
import PreTestPage from './pages/PreTestPage';
import TestPage from './pages/TestPage';
import StatisticsPage from './pages/StatisticsPage';
import AIAssistantPage from './pages/AIAssistantPage';
import LogoutButton from './components/LogoutButton';
import API_HOST from './utils/apiHost';

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
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Navigate to="/" />} />
          <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
          <Route path="/statistiche" element={<RequireAuth><StatisticsPage /></RequireAuth>} />
          <Route path="/ai-assistant" element={<RequireAuth><AIAssistantPage /></RequireAuth>} />
          <Route path="/pretest/:area" element={<RequireAuth><PreTestPage /></RequireAuth>} />
          <Route path="/test/:area/:num" element={<RequireAuth><TestPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <LogoutButton />
      </HashRouter>
    </ThemeProvider>
  );
}
