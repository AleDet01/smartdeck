import { memo } from 'react';
import '../css/SessionWarning.css';

const SessionWarning = memo(({ minutesRemaining, onExtend, onLogout }) => {
  return (
    <div className="session-warning-overlay">
      <div className="session-warning-modal">
        <div className="session-warning-icon">⏰</div>
        <h2 className="session-warning-title">Sessione in Scadenza</h2>
        <p className="session-warning-message">
          La tua sessione scadrà tra <strong>{minutesRemaining} minuti</strong> per inattività.
        </p>
        <p className="session-warning-submessage">
          Vuoi continuare a usare SmartDeck?
        </p>
        <div className="session-warning-actions">
          <button 
            className="session-btn session-btn-secondary" 
            onClick={onLogout}
          >
            Logout
          </button>
          <button 
            className="session-btn session-btn-primary" 
            onClick={onExtend}
          >
            Continua Sessione
          </button>
        </div>
      </div>
    </div>
  );
});

SessionWarning.displayName = 'SessionWarning';

export default SessionWarning;
