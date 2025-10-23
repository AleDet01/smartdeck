import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LandingPage from './pages/LandingPage';
import AreaStatsPage from './pages/AreaStatsPage';
import StatsList from './pages/StatsList';
import CreateTestPage from './pages/CreateTestPage';
import PreTestPage from './pages/PreTestPage';
import TestPage from './pages/TestPage';
import LogoutButton from './components/LogoutButton';

function RequireAuth({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
  <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
  <Route path="/stats" element={<RequireAuth><StatsList /></RequireAuth>} />
  <Route path="/stats/:area" element={<RequireAuth><AreaStatsPage /></RequireAuth>} />
  <Route path="/crea-test" element={<RequireAuth><CreateTestPage /></RequireAuth>} />
  <Route path="/pretest/:area" element={<RequireAuth><PreTestPage /></RequireAuth>} />
  <Route path="/test/:area/:num" element={<RequireAuth><TestPage /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <LogoutButton />
    </HashRouter>
  );
}
