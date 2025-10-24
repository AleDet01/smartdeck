import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API_HOST from '../utils/apiHost';
import '../css/LogoutButton.css';

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
    try { localStorage.removeItem('token'); } catch {}
    navigate('/');
  };

  if (isHidden) return null;

  return (
    <button
      type="button"
      className="logout-btn"
      title="Esci"
      onClick={handleLogout}
    >
      Esci
    </button>
  );
}
