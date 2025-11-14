import { memo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../utils/themeContext';
import LanguageSelector from './LanguageSelector';
import '../css/Topbar.css';

const Topbar = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path);
  
  return (
    <div className="dashboard-topbar">
      <button 
        className={`topbar-btn${isActive('/dashboard') ? ' active' : ''}`} 
        onClick={() => navigate('/dashboard')}
      >
        {t('topbar.home')}
      </button>
      <button 
        className={`topbar-btn${isActive('/ai-assistant') ? ' active' : ''}`} 
        onClick={() => navigate('/ai-assistant')}
      >
        {t('topbar.aiAssistant')}
      </button>
      <button 
        className={`topbar-btn${isActive('/statistiche') ? ' active' : ''}`} 
        onClick={() => navigate('/statistiche')}
      >
        {t('topbar.statistics')}
      </button>
      
      <LanguageSelector />
      
      <button 
        className="theme-toggle-btn"
        onClick={toggleTheme}
        aria-label={t('landing.changeTheme')}
        title={theme === 'light' ? t('landing.darkTheme') : t('landing.lightTheme')}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </div>
  );
});

Topbar.displayName = 'Topbar';

export default Topbar;
