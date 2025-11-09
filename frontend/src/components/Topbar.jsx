import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../utils/themeContext';
import '../css/Topbar.css';

export default function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path);
  
  return (
    <div className="dashboard-topbar">
      <button 
        className={`topbar-btn${isActive('/dashboard') ? ' active' : ''}`} 
        onClick={() => navigate('/dashboard')}
      >
        Test
      </button>
      <button 
        className={`topbar-btn${isActive('/ai-assistant') ? ' active' : ''}`} 
        onClick={() => navigate('/ai-assistant')}
      >
        AI Assistant
      </button>
      <button 
        className={`topbar-btn${isActive('/statistiche') ? ' active' : ''}`} 
        onClick={() => navigate('/statistiche')}
      >
        Statistiche
      </button>
      
      <button 
        className="theme-toggle-btn"
        onClick={toggleTheme}
        aria-label="Cambia tema"
        title={theme === 'light' ? 'Passa al tema scuro' : 'Passa al tema chiaro'}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </div>
  );
}
