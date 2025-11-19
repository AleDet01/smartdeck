import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../utils/themeContext';
import LanguageSelector from './LanguageSelector';
import '../css/BottomControls.css';

const BottomControls = memo(() => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <div className="bottom-controls">
      <LanguageSelector />
      <button 
        className="theme-toggle-btn-bottom"
        onClick={toggleTheme}
        aria-label={t('landing.changeTheme')}
        title={theme === 'light' ? t('landing.darkTheme') : t('landing.lightTheme')}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </div>
  );
});

BottomControls.displayName = 'BottomControls';

export default BottomControls;
