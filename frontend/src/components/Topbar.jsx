import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../css/DashboardPage.css';

export default function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div className="dashboard-topbar">
  <button className={`topbar-btn${location.pathname === '/dashboard' ? ' active' : ''}`} onClick={() => navigate('/dashboard')}>Test</button>
  <button className={`topbar-btn${location.pathname.startsWith('/stats') ? ' active' : ''}`} onClick={() => navigate('/stats')}>Stats</button>
      <button className={`topbar-btn${location.pathname === '/crea-test' ? ' active' : ''}`} onClick={() => navigate('/crea-test')}>Crea un nuovo test</button>
    </div>
  );
}
