import { useNavigate, useLocation } from 'react-router-dom';
import '../css/DashboardPage.css';

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
        className={`topbar-btn${isActive('/stats') ? ' active' : ''}`} 
        onClick={() => navigate('/stats')}
      >
        Stats
      </button>
      <button 
        className={`topbar-btn${isActive('/crea-test') ? ' active' : ''}`} 
        onClick={() => navigate('/crea-test')}
      >
        Crea un nuovo test
      </button>
    </div>
  );
}
