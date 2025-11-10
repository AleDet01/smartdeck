import { memo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API_HOST from '../utils/apiHost';
import '../css/LogoutButton.css';

const HIDDEN_PATHS = ['/', '/login'];

const LogoutButton = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    try {
      await fetch(`${API_HOST}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      localStorage.removeItem('token');
    } catch (err) {
    }
    navigate('/');
  }, [navigate]);

  if (HIDDEN_PATHS.includes(location.pathname)) return null;

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
});

LogoutButton.displayName = 'LogoutButton';

export default LogoutButton;
