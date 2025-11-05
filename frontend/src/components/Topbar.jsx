import { useNavigate, useLocation } from 'react-router-dom';
import '../css/Topbar.css';

export default function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  
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
        className={`topbar-btn${isActive('/crea-test') ? ' active' : ''}`} 
        onClick={() => navigate('/crea-test')}
      >
        Crea Test
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
    </div>
  );
}
