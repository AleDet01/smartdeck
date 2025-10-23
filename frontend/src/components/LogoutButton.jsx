import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API_HOST from '../utils/apiHost';

export default function LogoutButton() {
  const location = useLocation();
  const navigate = useNavigate();

  const hiddenPaths = ['/', '/login'];
  const isHidden = hiddenPaths.includes(location.pathname);

  const handleLogout = async () => {
    try {
      await fetch(`${API_HOST}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch {}
    // Clear any legacy token flag just in case
    try { localStorage.removeItem('token'); } catch {}
    navigate('/');
  };

  if (isHidden) return null;

  return (
    <button
      onClick={handleLogout}
      title="Esci"
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 2000,
        padding: '10px 14px',
        background: '#f3f4f6',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        cursor: 'pointer',
        fontWeight: 600,
        color: '#23272f'
      }}
    >
      Esci
    </button>
  );
}
