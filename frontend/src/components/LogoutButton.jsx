import { useLocation, useNavigate } from 'react-router-dom';
import API_HOST from '../utils/apiHost';
import '../css/LogoutButton.css';

const HIDDEN_PATHS = ['/', '/login'];

export default function LogoutButton() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch(`${API_HOST}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      localStorage.removeItem('token');
    } catch (err) {
    }
    navigate('/');
  };

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
}
